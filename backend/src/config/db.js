const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL. Set DB_SSL=false for a local PostgreSQL without SSL.
  ssl:
    process.env.DB_SSL === "false"
      ? false
      : {
          rejectUnauthorized: false,
        },
});

const connectDB = async () => {
  try {
    const client = await pool.connect();

    console.log("✅ PostgreSQL Connected Successfully");

    client.release();
  } catch (error) {
    console.error("❌ Database Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB,
};