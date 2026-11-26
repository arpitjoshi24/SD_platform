require("dotenv").config();

const app = require("./app");
const { connectDB, closeDB } = require("./config/db");

const PORT = Number.parseInt(process.env.PORT || "5000", 10) || 5000;
let server = null;
let isShuttingDown = false;

const validateEnv = () => {
  if (!process.env.DATABASE_URL || !String(process.env.DATABASE_URL).trim()) {
    throw new Error("DATABASE_URL is required");
  }
  if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim().length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters long");
  }
};

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  try {
    await closeDB();
    console.log("PostgreSQL pool closed.");
  } catch (err) {
    console.error("Error while closing PostgreSQL pool:", err.message);
    exitCode = 1;
  }

  process.exit(exitCode);
};

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      console.error("HTTP server error:", err.message);
      shutdown("SERVER_ERROR", 1);
    });

    process.on("SIGINT", () => shutdown("SIGINT", 0));
    process.on("SIGTERM", () => shutdown("SIGTERM", 0));
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Promise Rejection:", reason);
      shutdown("UNHANDLED_REJECTION", 1);
    });
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown("UNCAUGHT_EXCEPTION", 1);
    });
  } catch (err) {
  console.error("\n========== SERVER STARTUP FAILURE ==========");
  console.error("Error object:", err);
  console.error("Error name:", err?.name);
  console.error("Error message:", err?.message);
  console.error("Error code:", err?.code);
  console.error("Error stack:", err?.stack);
  console.error("============================================\n");

  process.exit(1);
}
};

startServer();