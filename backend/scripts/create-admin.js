#!/usr/bin/env node
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/db");

const BCRYPT_ROUNDS = 12;

async function main() {
  const [, , fullNameArg, emailArg, passwordArg] = process.argv;

  if (!fullNameArg || !emailArg || !passwordArg) {
    console.error(
      'Usage: node scripts/create-admin.js "<Full Name>" <email> <password>'
    );
    process.exit(1);
  }

  const fullName = String(fullNameArg).trim();
  const email = String(emailArg).trim().toLowerCase();
  const password = String(passwordArg);

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const client = await pool.connect();
  try {
    const existing = await client.query(
      "SELECT id, email, role FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );

    if (existing.rows.length > 0) {
      const updated = await client.query(
        `UPDATE users
         SET
           full_name = $2,
           password_hash = $3,
           role = 'admin',
           account_status = 'active',
           updated_at = NOW()
         WHERE id = $1
         RETURNING id, full_name, email, role, account_status`,
        [existing.rows[0].id, fullName, passwordHash]
      );
      console.log("Promoted/updated existing user as admin:", updated.rows[0]);
    } else {
      const created = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, account_status)
         VALUES ($1, $2, $3, 'admin', 'active')
         RETURNING id, full_name, email, role, account_status`,
        [fullName, email, passwordHash]
      );
      console.log("Created new admin user:", created.rows[0]);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});