const { Pool } = require("pg");

const parsePositiveInt = (value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const buildPoolConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || String(connectionString).trim() === "") {
    throw new Error("DATABASE_URL is required to initialize the PostgreSQL pool");
  }

  const sslEnabled =
    process.env.DB_SSL !== undefined
      ? process.env.DB_SSL !== "false"
      : process.env.NODE_ENV === "production" ||
        connectionString.includes("sslmode=require");

  const maxConnections = parsePositiveInt(process.env.DB_POOL_MAX, 10);
  const connectionTimeoutMillis = parsePositiveInt(
    process.env.DB_CONNECTION_TIMEOUT_MS,
    10000
  );
  const idleTimeoutMillis = parsePositiveInt(
    process.env.DB_IDLE_TIMEOUT_MS,
    30000
  );

  return {
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: maxConnections,
    connectionTimeoutMillis,
    idleTimeoutMillis,
  };
};

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected idle PostgreSQL client error:", err.message);
});

const connectDB = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL Connected Successfully");
  } finally {
    client.release();
  }
};

const closeDB = async () => {
  await pool.end();
};

const withTransaction = async (callback) => {
  if (typeof callback !== "function") {
    throw new Error("withTransaction requires a callback function");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to rollback transaction:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connectDB,
  closeDB,
  withTransaction,
};