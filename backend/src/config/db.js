const { Pool } = require("pg");
require("dotenv").config();

// SSL activé seulement si la base l'exige (Neon, ou PGSSL=require) — la base interne
// de Railway/Docker n'utilise pas SSL et planterait si on le forçait.
function sslConfig() {
  const url = process.env.DATABASE_URL || "";
  if (process.env.PGSSL === "disable") return false;
  if (process.env.PGSSL === "require" || /sslmode=require/.test(url) || /\.neon\.tech/.test(url)) {
    return { rejectUnauthorized: false };
  }
  return false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});

const dbHost = (process.env.DATABASE_URL || "").replace(/^.*@/, "").split("/")[0] || "?";

pool.connect()
  .then((client) => {
    console.log(`✅ PostgreSQL connecté (${dbHost})`);
    client.release();
  })
  .catch((err) => {
    console.error(`❌ Erreur connexion PostgreSQL (${dbHost}) :`, err.message);
  });

// Helper : adapte la syntaxe MySQL (?) vers PostgreSQL ($1, $2...)
pool.query = (function (originalQuery) {
  return function (text, params) {
    let i = 0;
    const pgText = text.replace(/\?/g, () => `$${++i}`);
    return originalQuery.call(this, pgText, params);
  };
})(pool.query.bind(pool));

module.exports = pool;
