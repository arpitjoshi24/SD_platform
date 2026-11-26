const express = require("express");
const { pool } = require("../config/db");
const { API_VERSION } = require("../utils/constants");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      success: true,
      message: "ArchMentor Backend Running",
      data: {
        status: "healthy",
        database: "connected",
        apiVersion: API_VERSION,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;