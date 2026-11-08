require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, "../../database.sql"), "utf8");
  const client = await pool.connect();
  try {
    console.log("🔌 Connexion établie...\n");
    await client.query(sql);
    console.log("🎉 Base de données initialisée avec succès !");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
