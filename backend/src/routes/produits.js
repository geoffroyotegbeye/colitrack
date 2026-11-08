const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");
const { notifyRole } = require("../utils/notify");

function normalize(name) {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const MAX_IMAGES = 7;
const TRANSPORT_MODES = ["standard", "express", "maritime", "aerien"];

const SELECT_BASE = `
  SELECT p.*, u.full_name AS owner_name,
    COALESCE((
      SELECT json_agg(gi.image_url ORDER BY gi.created_at)
      FROM saved_product_images gi WHERE gi.saved_product_id = p.id
    ), '[]') AS images,
    COALESCE((
      SELECT json_agg(json_build_object(
        'mode', tr.mode, 'rate_per_kg', tr.rate_per_kg,
        'delay_min_days', tr.delay_min_days, 'delay_max_days', tr.delay_max_days
      ) ORDER BY tr.mode)
      FROM product_transport_modes ptm
      JOIN transport_rates tr ON tr.mode = ptm.mode
      WHERE ptm.product_id = p.id
    ), '[]') AS transport_options
  FROM saved_products p
  JOIN users u ON u.id = p.user_id`;

async function replaceImages(productId, images, mainImageUrl) {
  const list = (images || []).filter(Boolean).slice(0, MAX_IMAGES);
  if ((mainImageUrl ? 1 : 0) + list.length > MAX_IMAGES) {
    throw Object.assign(new Error(`Maximum ${MAX_IMAGES} images par produit`), { status: 400 });
  }
  await db.query("DELETE FROM saved_product_images WHERE saved_product_id = ?", [productId]);
  for (const url of list) {
    await db.query(
      "INSERT INTO saved_product_images (id, saved_product_id, image_url) VALUES (?, ?, ?)",
      [uuidv4(), productId, url]
    );
  }
}

async function replaceTransportModes(productId, modes) {
  const list = [...new Set((modes || []).filter((m) => TRANSPORT_MODES.includes(m)))];
  await db.query("DELETE FROM product_transport_modes WHERE product_id = ?", [productId]);
  for (const mode of list) {
    await db.query(
      "INSERT INTO product_transport_modes (id, product_id, mode) VALUES (?, ?, ?)",
      [uuidv4(), productId, mode]
    );
  }
}

// GET /api/produits/marketplace — catalogue global public (pas d'auth), pour la marketplace et l'affiliation
router.get("/marketplace", async (req, res) => {
  try {
    const { rows } = await db.query(
      `${SELECT_BASE} WHERE p.is_global = true AND p.status = 'active' ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produits/marketplace/:id — fiche produit publique (pas d'auth), pour l'achat direct depuis la marketplace
router.get("/marketplace/:id", async (req, res) => {
  try {
    const { rows } = await db.query(
      `${SELECT_BASE} WHERE p.id = ? AND p.is_global = true AND p.status = 'active'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware, (req, res, next) => {
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
});

// GET /api/produits — admin: catalogue global ; agent: son catalogue perso + le catalogue global
// filtres optionnels : search, status, scope (mine|global, agent uniquement), page, limit
router.get("/", async (req, res) => {
  try {
    const { search, status, scope, page, limit } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === "admin") {
      conditions.push("p.is_global = true");
    } else if (scope === "mine") {
      conditions.push("p.user_id = ?"); params.push(req.user.id);
    } else if (scope === "global") {
      conditions.push("p.is_global = true");
    } else {
      conditions.push("(p.user_id = ? OR p.is_global = true)"); params.push(req.user.id);
    }
    if (search) {
      conditions.push("(p.name ILIKE ? OR p.category ILIKE ?)");
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (status) { conditions.push("p.status = ?"); params.push(status); }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const selectSql = `${SELECT_BASE} ${where} ORDER BY p.created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM saved_products p JOIN users u ON u.id = p.user_id ${where}`;

    const result = await paginate(db, { selectSql, countSql, params, page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produits/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await db.query(`${SELECT_BASE} WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable" });
    const product = rows[0];
    if (!product.is_global && product.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/produits — admin uniquement (catalogue global) : les agents n'ont plus de catalogue personnel, ils font uniquement de l'affiliation
router.post("/", adminOnly, async (req, res) => {
  const {
    name, description, category, default_quantity, default_price,
    product_link, stock_quantity, weight, dimensions, tax, main_image_url, commission_rate, images, transport_modes,
  } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Nom du produit requis" });
  if ([default_price, weight, tax, stock_quantity].some((v) => v !== undefined && v !== null && Number(v) < 0)) {
    return res.status(400).json({ error: "Les valeurs de prix, taxe, poids et stock ne peuvent pas être négatives" });
  }
  try {
    const id = uuidv4();
    await db.query(
      `INSERT INTO saved_products
        (id, user_id, name, normalized_name, description, category, default_quantity, default_price,
         product_link, is_global, stock_quantity, weight, dimensions, tax, main_image_url, commission_rate)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.user.id, name.trim(), normalize(name), description || null, category || null,
        default_quantity || 1, default_price || 0, product_link || null,
        true, stock_quantity || 0, weight || 0, dimensions || null,
        tax || 0, main_image_url || null, commission_rate === undefined || commission_rate === null ? null : commission_rate,
      ]
    );
    await replaceImages(id, images, main_image_url);
    await replaceTransportModes(id, transport_modes);
    await notifyRole(db, {
      role: "agent",
      title: "Nouveau produit disponible",
      message: `"${name.trim()}" a été ajouté au catalogue global`,
    });
    const { rows } = await db.query(`${SELECT_BASE} WHERE p.id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /api/produits/:id — seul le propriétaire peut modifier (is_global est immuable après création)
router.patch("/:id", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM saved_products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable" });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Accès refusé" });

    const allowed = [
      "name", "description", "category", "default_quantity", "default_price",
      "product_link", "stock_quantity", "weight", "dimensions", "tax", "status", "main_image_url", "commission_rate",
    ];
    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (!fields.length && !("images" in req.body) && !("transport_modes" in req.body)) {
      return res.status(400).json({ error: "Aucun champ valide" });
    }
    if (["default_price", "weight", "tax", "stock_quantity"].some((f) => fields.includes(f) && Number(req.body[f]) < 0)) {
      return res.status(400).json({ error: "Les valeurs de prix, taxe, poids et stock ne peuvent pas être négatives" });
    }

    if (fields.length) {
      const set = fields.map((f) => `${f} = ?`).join(", ");
      const values = fields.map((f) => req.body[f]);
      const extra = req.body.name ? [normalize(req.body.name)] : [];
      const setClause = req.body.name ? `${set}, normalized_name = ?` : set;
      await db.query(`UPDATE saved_products SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, ...extra, req.params.id]);
    }
    if ("images" in req.body) {
      const mainImageUrl = "main_image_url" in req.body ? req.body.main_image_url : rows[0].main_image_url;
      await replaceImages(req.params.id, req.body.images, mainImageUrl);
    }
    if ("transport_modes" in req.body) {
      await replaceTransportModes(req.params.id, req.body.transport_modes);
    }

    const { rows: updated } = await db.query(`${SELECT_BASE} WHERE p.id = ?`, [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/produits/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM saved_products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable" });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Accès refusé" });
    await db.query("DELETE FROM saved_products WHERE id = ?", [req.params.id]);
    res.json({ message: "Produit supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
