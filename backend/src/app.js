const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes/index.routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/error.middleware");

const app = express();

// Trust reverse proxy headers when deployed behind Nginx / PaaS
if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security & HTTP middlewares
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin / CLI requests with no Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    },
    credentials: true,
  })
);

// Snapshot payloads can be larger than default body limits
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// API routes
app.use("/api/v1", routes);

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;