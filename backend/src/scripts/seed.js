require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const DB_URL = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString: DB_URL });

const PASSWORD = "Test1234!";

// Garde-fou : le seed EFFACE les données. On refuse toute base qui n'est pas locale,
// sauf FORCE_SEED=1 explicite (ex. base de démo jetable).
const isLocal = /@(localhost|127\.0\.0\.1|db|postgres)[:/]/.test(DB_URL) || /@[^/]*\.railway\.internal/.test(DB_URL);
if (!isLocal && process.env.FORCE_SEED !== "1") {
  console.error("❌ Seed refusé : DATABASE_URL ne pointe pas vers une base locale.");
  console.error("   Pour forcer sur une base jetable : FORCE_SEED=1 npm run db:seed");
  process.exit(1);
}

async function resetDomainTables(client) {
  // Vide toutes les tables métier (ordre géré par CASCADE), garde le schéma.
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const names = rows.map((r) => `"${r.tablename}"`).join(", ");
  if (names) await client.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
  console.log(`🧹 ${rows.length} tables réinitialisées`);
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Seed en cours...\n");
    await resetDomainTables(client);
    const hash = await bcrypt.hash(PASSWORD, 10);

    const admin = { id: uuidv4(), full_name: "Administrateur ColiTrack", email: "admin@colitrack.com" };
    const agent1 = { id: uuidv4(), full_name: "Fatou Diallo", email: "fatou.agent@colitrack.com", phone: "+229 97 20 21 01" };
    const agent2 = { id: uuidv4(), full_name: "Moussa Kone", email: "moussa.agent@colitrack.com", phone: "+229 96 11 22 33" };
    const client1 = { id: uuidv4(), full_name: "Elyna Market", email: "elyna@colitrack.com", phone: "+229 97 20 21 01" };
    const client2 = { id: uuidv4(), full_name: "Jean Kpossou", email: "jean@colitrack.com", phone: "+229 91 44 55 66" };

    for (const [u, role] of [[admin, "admin"], [agent1, "agent"], [agent2, "agent"], [client1, "client"], [client2, "client"]]) {
      await client.query(
        `INSERT INTO users (id, full_name, email, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET full_name = $2, phone = $5, role = $6
         RETURNING id`,
        [u.id, u.full_name, u.email, hash, u.phone || null, role]
      );
    }
    console.log("✅ 5 utilisateurs (1 admin, 2 agents, 2 clients)");

    // Réglages globaux : taxe 5 %, commission par défaut 10 %
    await client.query(
      `INSERT INTO tax_settings (id, rate, default_commission_rate, updated_by) VALUES ($1, 5, 10, $2)`,
      [uuidv4(), admin.id]
    );
    // Tarifs de transport par mode (prix au kg + délais en jours)
    for (const [mode, rate, dmin, dmax] of [
      ["standard", 2500, 14, 20], ["express", 6000, 5, 9],
      ["maritime", 1200, 35, 55], ["aerien", 7500, 3, 6],
    ]) {
      await client.query(
        `INSERT INTO transport_rates (id, mode, rate_per_kg, delay_min_days, delay_max_days)
         VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), mode, rate, dmin, dmax]
      );
    }
    console.log("✅ Taxe 5 % + 4 tarifs de transport");

    // Catégories
    const CATEGORIES = ["Mode & Vêtements", "Chaussures", "Accessoires", "Tech & Gadgets"];
    for (const name of CATEGORIES) {
      await client.query("INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", [uuidv4(), name]);
    }

    // Catalogue : produits GLOBAUX (admin) — visibles dans la marketplace — avec images.
    const IMG = "https://images.unsplash.com/photo-";
    const Q = "?auto=format&fit=crop&w=600&q=70";
    const img = (id) => `${IMG}${id}${Q}`;
    const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // [nom, catégorie, prix, stock, poids(kg), commission%, [imagePrincipale, ...galerie]]
    const catalogue = [
      ["Montre connectée", "Tech & Gadgets", 28000, 15, 0.3, 12, ["1523275335684-37898b6baf30", "1579586337278-3befd40fd17a"]],
      ["Casque audio sans fil", "Tech & Gadgets", 24000, 20, 0.4, 12, ["1505740420928-5e560c06d30e", "1484704849700-f032a568e944"]],
      ["Sneakers Air Style", "Chaussures", 32000, 10, 0.9, 10, ["1542291026-7eec264c27ff", "1549298916-b41d501d3772", "1434389677669-e08b4cac3105"]],
      ["Chaussures ville homme", "Chaussures", 35000, 8, 1.1, 10, ["1434389677669-e08b4cac3105", "1549298916-b41d501d3772"]],
      ["Robe élégante", "Mode & Vêtements", 15000, 25, 0.4, 15, ["1595777457583-95e059d581b8", "1515372039744-b8f02a3ae446"]],
      ["T-shirt premium", "Mode & Vêtements", 8000, 50, 0.25, 15, ["1521572163474-6864f9cf17ab"]],
      ["Veste tendance", "Mode & Vêtements", 26000, 12, 0.8, 12, ["1551028719-00167b16eac5"]],
      ["Casquette classique", "Mode & Vêtements", 6000, 40, 0.2, 15, ["1588850561407-ed78c282e89b"]],
      ["Sac à main cuir", "Accessoires", 22000, 14, 0.7, 12, ["1584917865442-de89df76afd3"]],
      ["Sac à dos urbain", "Accessoires", 18000, 18, 0.9, 12, ["1553062407-98eeb64c6a62"]],
      ["Lunettes de soleil", "Accessoires", 9000, 30, 0.1, 15, ["1572635196237-14b3f281503f"]],
    ];
    for (const [name, category, price, stock, weight, commission, images] of catalogue) {
      const pid = uuidv4();
      await client.query(
        `INSERT INTO saved_products
           (id, user_id, name, normalized_name, category, default_quantity, default_price,
            is_global, stock_quantity, weight, status, main_image_url, commission_rate)
         VALUES ($1,$2,$3,$4,$5,1,$6,true,$7,$8,'active',$9,$10)`,
        [pid, admin.id, name, slugify(name), category, price, stock, weight, img(images[0]), commission]
      );
      for (const code of images) {
        await client.query(
          "INSERT INTO saved_product_images (id, saved_product_id, image_url) VALUES ($1,$2,$3)",
          [uuidv4(), pid, img(code)]
        );
      }
      // Chaque produit propose les 4 modes de transport
      for (const mode of ["standard", "express", "maritime", "aerien"]) {
        await client.query(
          "INSERT INTO product_transport_modes (id, product_id, mode) VALUES ($1,$2,$3) ON CONFLICT (product_id, mode) DO NOTHING",
          [uuidv4(), pid, mode]
        );
      }
    }
    console.log(`✅ ${CATEGORIES.length} catégories + ${catalogue.length} produits globaux (avec images) dans la marketplace`);

    // Commandes réparties sur plusieurs statuts
    const commandesSeed = [
      { agent: agent1, cli: client1, status: "registered", product: "Robe Shein", price: 15000 },
      { agent: agent1, cli: client1, status: "validated", product: "Sac à main", price: 22000 },
      { agent: agent1, cli: client2, status: "in_transit", product: "Chaussures Nike", price: 35000 },
      { agent: agent2, cli: client2, status: "arrived_benin", product: "Montre connectée", price: 28000 },
      { agent: agent2, cli: client1, status: "delivered", product: "Écouteurs Bluetooth", price: 12000 },
      { agent: agent1, cli: client2, status: "refused", product: "Casquette", price: 5000 },
    ];

    const colisStatusByCommandeStatus = {
      validated: "recu", in_transit: "en_transit", arrived_benin: "arrive_agence", delivered: "livre",
    };

    for (const c of commandesSeed) {
      const id = uuidv4();
      const tracking = "CT" + Math.floor(10000000 + Math.random() * 89999999);
      await client.query(
        `INSERT INTO commandes
           (id, tracking_number, client_id, client_name, client_phone, address_from, address_to,
            package_type, weight, price, tax, status, agent_id, product, quantity, city, delivery_mode)
         VALUES ($1,$2,$3,$4,$5,'Import Chine',$6,'medium',1,$7,0,$8,$9,$10,1,$6,'standard')`,
        [id, tracking, c.cli.id, c.cli.full_name, c.cli.phone, "Cotonou", c.price, c.status, c.agent.id, c.product]
      );
      await client.query(
        `INSERT INTO tracking_history (id, commande_id, status, description)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), id, c.status, `Commande ${c.status}`]
      );

      // Colis généré pour toute commande confirmée (statut != registered/refused)
      const colisStatus = colisStatusByCommandeStatus[c.status];
      if (colisStatus) {
        const colisId = uuidv4();
        await client.query(
          `INSERT INTO colis (id, commande_id, tracking_number, status, weight, destination, agent_id)
           VALUES ($1, $2, $3, $4, 1, $5, $6)`,
          [colisId, id, tracking, colisStatus, "Cotonou", c.agent.id]
        );
        await client.query(
          `INSERT INTO colis_history (id, colis_id, status, description)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), colisId, colisStatus, "Colis créé"]
        );
      }
    }
    console.log("✅ 6 commandes + historique de tracking + 4 colis");

    // Cours de formation publié avec 3 leçons (vidéo, PDF, quiz)
    const courseId = uuidv4();
    await client.query(
      `INSERT INTO courses (id, title, description, is_free, status, created_by)
       VALUES ($1, 'Devenir agent ColicTrack', 'Les bases pour bien démarrer : commandes, colis et marketplace d''affiliation.', true, 'published', $2)`,
      [courseId, admin.id]
    );
    await client.query(
      `INSERT INTO course_lessons (id, course_id, title, type, content_url, position) VALUES
       ($1, $3, 'Introduction à ColicTrack', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0),
       ($2, $3, 'Guide du revendeur (PDF)', 'pdf', 'https://www.africau.edu/images/default/sample.pdf', 1)`,
      [uuidv4(), uuidv4(), courseId]
    );
    await client.query(
      `INSERT INTO course_lessons (id, course_id, title, type, quiz_data, position)
       VALUES ($1, $2, 'Quiz de validation', 'quiz', $3, 2)`,
      [uuidv4(), courseId, JSON.stringify([
        { question: "Quel statut précède \"Livrée\" ?", options: ["Enregistrée", "En livraison", "Annulée"], correct_index: 1 },
        { question: "Un colis est généré à partir de...", options: ["Une commande confirmée", "Un produit", "Une catégorie"], correct_index: 0 },
      ])]
    );
    console.log("✅ 1 cours publié avec 3 leçons (vidéo, PDF, quiz)");

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Comptes de test (mot de passe commun)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Mot de passe : ${PASSWORD}`);
    console.log(`  Admin  : ${admin.email}`);
    console.log(`  Agent  : ${agent1.email} (boutique active)`);
    console.log(`  Agent  : ${agent2.email} (boutique pending)`);
    console.log(`  Client : ${client1.email}`);
    console.log(`  Client : ${client2.email}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
