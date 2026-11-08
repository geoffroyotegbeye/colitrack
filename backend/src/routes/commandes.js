const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly, optionalAuth } = require("../config/auth");
const { paginate } = require("../utils/paginate");
const { creditCommissionIfDelivered } = require("../utils/commission");
const { notifyRole } = require("../utils/notify");
const { canReadOrder, editRestriction } = require("../utils/orderAccess");
const { generateTrackingNumber } = require("../utils/trackingNumber");

// GET /api/commandes — filtres optionnels : search, agent_id (admin), status, date_from, date_to, page, limit
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, agent_id, status, date_from, date_to, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === "agent") {
      conditions.push("c.agent_id = ?"); params.push(req.user.id);
    } else if (req.user.role === "client") {
      conditions.push("c.client_id = ?"); params.push(req.user.id);
    } else if (agent_id) {
      conditions.push("c.agent_id = ?"); params.push(agent_id);
    }
    if (search) {
      conditions.push("(c.tracking_number ILIKE ? OR c.client_name ILIKE ? OR c.client_phone ILIKE ? OR c.product ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (status) { conditions.push("c.status = ?"); params.push(status); }
    if (date_from) { conditions.push("c.created_at::date >= ?::date"); params.push(date_from); }
    if (date_to) { conditions.push("c.created_at::date <= ?::date"); params.push(date_to); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const selectSql = `SELECT c.*, u.full_name AS agent_name FROM commandes c LEFT JOIN users u ON u.id = c.agent_id ${where} ORDER BY c.created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM commandes c ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commandes/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM commandes WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Commande introuvable" });
    const order = rows[0];
    if (!canReadOrder(req.user, order)) return res.status(403).json({ error: "Accès refusé" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/commandes — authentifié (client/agent/admin), ou anonyme depuis la marketplace publique
// (un produit du catalogue est alors obligatoire : affiliate_code ou product_id)
router.post("/", optionalAuth, async (req, res) => {
  const {
    client_name, client_phone, address_from, address_to,
    package_type, volume, product_link, delivery_mode, city, notes, agent_id, affiliate_code, product_id,
  } = req.body;
  let { price, weight, product, quantity } = req.body;
  if (!client_name || !client_phone || !address_from || !address_to) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }
  if (!req.user && !affiliate_code && !product_id) {
    return res.status(400).json({ error: "Une commande sans compte doit porter sur un produit du catalogue" });
  }
  if ([price, weight, volume, quantity].some((v) => v !== undefined && v !== null && Number(v) < 0)) {
    return res.status(400).json({ error: "Les valeurs de prix, poids, volume et quantité ne peuvent pas être négatives" });
  }
  try {
    let affiliateLinkId = null;
    let affiliateAgentId = null;
    let catalogProductId = product_id || null;
    if (affiliate_code) {
      const { rows: linkRows } = await db.query("SELECT id, agent_id, product_id FROM affiliate_links WHERE code = ?", [affiliate_code]);
      if (!linkRows.length) return res.status(404).json({ error: "Lien d'affiliation introuvable" });
      affiliateLinkId = linkRows[0].id;
      affiliateAgentId = linkRows[0].agent_id;
      catalogProductId = linkRows[0].product_id;
    }

    // Prix fixé par le catalogue (jamais par le navigateur) pour les commandes publiques, clients et affiliées :
    // sinon un visiteur choisit son prix, ou un agent gonfle la base de sa propre commission.
    // L'admin et l'agent en saisie libre (hors affiliation) gardent la main sur le prix.
    const isStaff = req.user && ["admin", "agent"].includes(req.user.role);
    if (catalogProductId && (!isStaff || affiliateLinkId)) {
      const { rows: prodRows } = await db.query(
        "SELECT name, default_price, weight FROM saved_products WHERE id = ? AND status = 'active'",
        [catalogProductId]
      );
      if (!prodRows.length) return res.status(404).json({ error: "Produit introuvable ou indisponible" });
      quantity = Math.max(1, Math.floor(Number(quantity) || 1));
      price = Number(prodRows[0].default_price) * quantity;
      weight = Number(prodRows[0].weight) * quantity;
      product = prodRows[0].name;
    }

    const id = uuidv4();
    const resolvedAgentId = affiliateAgentId
      || (req.user?.role === "agent" ? req.user.id : null)
      || (req.user?.role === "admin" ? agent_id || null : null);
    const resolvedClientId = req.user?.id || null;

    // Taxe appliquée automatiquement selon le taux global (Module 5) — jamais fournie par le client
    const { rows: rateRows } = await db.query("SELECT rate FROM tax_settings ORDER BY updated_at DESC LIMIT 1");
    const taxRate = rateRows.length ? Number(rateRows[0].rate) : 0;
    const tax = Math.round((price || 0) * (taxRate / 100) * 100) / 100;

    // Coût transport calculé automatiquement à partir du tarif global du mode choisi — jamais fourni par le client
    const { rows: transportRows } = await db.query(
      "SELECT rate_per_kg FROM transport_rates WHERE mode = ?", [delivery_mode || "standard"]
    );
    const transportRate = transportRows.length ? Number(transportRows[0].rate_per_kg) : 0;
    const transport_cost = Math.round((weight || 0) * transportRate * 100) / 100;

    // Numéro aléatoire : en cas de collision (quasi impossible), on retente avec un autre
    let tracking_number;
    for (let attempt = 0; ; attempt++) {
      tracking_number = generateTrackingNumber();
      try {
        await db.query(
          `INSERT INTO commandes
            (id, tracking_number, client_id, client_name, client_phone, address_from, address_to,
             package_type, weight, volume, price, tax, transport_cost, product, quantity, product_link,
             delivery_mode, city, notes, agent_id, affiliate_link_id, status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'registered')`,
          [
            id, tracking_number, resolvedClientId, client_name, client_phone,
            address_from, address_to, package_type || "medium",
            weight || 0, volume || 0, price || 0, tax || 0, transport_cost || 0,
            product || "", quantity || 1, product_link || null,
            delivery_mode || "standard", city || address_to, notes || null, resolvedAgentId, affiliateLinkId,
          ]
        );
        break;
      } catch (err) {
        if (err.code !== "23505" || attempt >= 4) throw err;
      }
    }
    const { rows } = await db.query("SELECT * FROM commandes WHERE id = ?", [id]);
    await notifyRole(db, {
      role: "admin",
      title: "Nouvelle commande",
      message: `${client_name} — ${tracking_number}`,
      excludeUserId: req.user?.id,
      commandeId: id,
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/commandes/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM commandes WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Commande introuvable" });
    const order = rows[0];
    const allowed = [
      "client_name", "client_phone", "city", "product", "quantity",
      "price", "tax", "transport_cost", "weight", "product_link", "delivery_mode",
      "estimated_arrival", "notes", "status", "agent_id",
    ];
    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    const denied = editRestriction(req.user, order, fields);
    if (denied) return res.status(403).json({ error: denied });
    if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });
    if (["price", "tax", "transport_cost", "weight", "quantity"].some((f) => fields.includes(f) && Number(req.body[f]) < 0)) {
      return res.status(400).json({ error: "Les valeurs de prix, taxe, transport, poids et quantité ne peuvent pas être négatives" });
    }

    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => req.body[f]);
    await db.query(`UPDATE commandes SET ${set}, updated_at = NOW() WHERE id = ?`, [...values, req.params.id]);
    if (fields.includes("status") && req.body.status !== order.status) {
      // Tout changement de statut est tracé (qui, quand), quelle que soit la route utilisée
      await db.query(
        "INSERT INTO tracking_history (id, commande_id, status, description, changed_by) VALUES (?, ?, ?, ?, ?)",
        [uuidv4(), req.params.id, req.body.status, req.body.description || "", req.user.id]
      );
      await creditCommissionIfDelivered(req.params.id, req.body.status);
    }

    const { rows: updated } = await db.query("SELECT * FROM commandes WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/commandes/:id
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query("DELETE FROM tracking_history WHERE commande_id = ?", [req.params.id]);
    await db.query("DELETE FROM commandes WHERE id = ?", [req.params.id]);
    res.json({ message: "Commande supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
