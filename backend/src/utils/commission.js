const db = require("../config/db");
const { notifyRole } = require("./notify");

/**
 * Crédite la commission d'affiliation d'une commande une fois livrée.
 * No-op si la commande n'a pas de lien affilié, ou si elle a déjà été créditée.
 */
async function creditCommissionIfDelivered(commandeId, newStatus) {
  if (newStatus !== "delivered") return;

  const { rows } = await db.query(
    `SELECT c.id, c.price, c.tracking_number, c.affiliate_link_id, c.commission_amount, al.product_id, al.agent_id
     FROM commandes c
     LEFT JOIN affiliate_links al ON al.id = c.affiliate_link_id
     WHERE c.id = ?`,
    [commandeId]
  );
  const order = rows[0];
  if (!order || !order.affiliate_link_id || order.commission_amount !== null) return;

  const { rows: prodRows } = await db.query("SELECT commission_rate FROM saved_products WHERE id = ?", [order.product_id]);
  const { rows: settingsRows } = await db.query("SELECT default_commission_rate FROM tax_settings ORDER BY updated_at DESC LIMIT 1");

  const productRate = prodRows[0]?.commission_rate;
  const rate = productRate !== null && productRate !== undefined
    ? Number(productRate)
    : Number(settingsRows[0]?.default_commission_rate ?? 10);

  const commission = Math.round(Number(order.price) * (rate / 100) * 100) / 100;
  await db.query("UPDATE commandes SET commission_amount = ? WHERE id = ?", [commission, commandeId]);

  const { rows: agentRows } = await db.query("SELECT full_name FROM users WHERE id = ?", [order.agent_id]);
  await notifyRole(db, {
    role: "admin",
    title: "Commission due",
    message: `${commission.toLocaleString()} F dus à ${agentRows[0]?.full_name || "un agent"} — ${order.tracking_number}`,
    commandeId,
  });
}

module.exports = { creditCommissionIfDelivered };
