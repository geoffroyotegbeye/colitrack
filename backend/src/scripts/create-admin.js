require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Crée ou réinitialise le compte admin. Le schéma doit déjà exister (npm run db:init).
async function createAdmin() {
  const client = await pool.connect();
  try {
    const email = process.env.ADMIN_EMAIL || "admin@colitrack.com";
    const password = process.env.ADMIN_PASSWORD || "Test1234!";
    const hash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = $3, role = 'admin', updated_at = NOW()`,
      ["Administrateur ColiTrack", email, hash]
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🔐 ACCÈS ADMIN COLITRACK");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email    : ${email}`);
    console.log(`  Password : ${password}`);
    if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
      console.log("  ⚠️  Changez ce mot de passe — ADMIN_PASSWORD n'était pas défini.");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
