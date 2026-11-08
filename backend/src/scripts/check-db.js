require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function check() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("📋 Tables :");
    rows.forEach((r) => console.log(`   ✅ ${r.table_name}`));

    const { rows: users } = await client.query("SELECT id, full_name, email, role FROM users");
    console.log("\n👤 Utilisateurs :");
    users.forEach((u) => console.log(`   - ${u.email} (${u.role})`));
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch((err) => console.error("❌", err.message));
