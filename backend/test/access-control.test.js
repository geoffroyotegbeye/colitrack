/**
 * Tests de contrôle d'accès (audit sécurité, points 2 à 6).
 * Nécessite un backend lancé sur une base de TEST (jamais la prod) avec les comptes du seed :
 *   API_URL=http://localhost:3099 node --test test/
 * Toutes les données créées sont supprimées à la fin.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/config/db");

const API = process.env.API_URL || "http://localhost:3099";
const PASSWORD = "Test1234!";
const tok = {};
const created = { orders: [], products: [], users: [] };

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
const login = async (email) => (await call("POST", "/auth/login", { body: { email, password: PASSWORD } })).body.token;

const ORDER = { client_name: "Test Sécurité", client_phone: "+229 00 00 00 00", address_from: "Rue secrète 12", address_to: "Cotonou" };
async function adminOrder(extra = {}) {
  const { body } = await call("POST", "/commandes", { token: tok.admin, body: { ...ORDER, price: 1000, ...extra } });
  created.orders.push(body.id);
  return body;
}

let product, affiliateCode;

before(async () => {
  tok.admin = await login("admin@colitrack.com");
  tok.agent1 = await login("fatou.agent@colitrack.com");
  tok.agent2 = await login("moussa.agent@colitrack.com");
  tok.client1 = await login("elyna@colitrack.com");
  tok.client2 = await login("jean@colitrack.com");
  assert.ok(Object.values(tok).every(Boolean), "comptes du seed introuvables : lancer npm run db:seed");

  product = (await call("POST", "/produits", { token: tok.admin, body: { name: "Produit test sécurité", default_price: 5000, weight: 2 } })).body;
  created.products.push(product.id);
  affiliateCode = (await call("POST", "/affiliate/links", { token: tok.agent1, body: { product_id: product.id } })).body.link.code;
});

after(async () => {
  for (const id of created.orders.filter(Boolean)) await call("DELETE", `/commandes/${id}`, { token: tok.admin });
  for (const id of created.products) await db.query("DELETE FROM saved_products WHERE id = ?", [id]);
  for (const id of created.users) await db.query("DELETE FROM users WHERE id = ?", [id]);
  await db.end();
});

// ── Point 2 : suivi public ────────────────────────────────────────────────
test("suivi public : un visiteur anonyme ne voit ni nom, ni adresse, ni prix", async () => {
  const order = await adminOrder();
  const { status, body } = await call("GET", `/tracking/${order.tracking_number}`);
  assert.equal(status, 200);
  for (const f of ["client_name", "address_from", "address_to", "price", "tax", "client_id", "agent_id"]) {
    assert.equal(body[0][f], undefined, `le champ ${f} ne doit pas être public`);
  }
  assert.equal(body[0].status, "registered");
});

test("suivi public : le propriétaire connecté voit le détail complet", async () => {
  const order = await adminOrder();
  const { body } = await call("GET", `/tracking/${order.tracking_number}`, { token: tok.admin });
  assert.equal(body[0].client_name, ORDER.client_name);
  assert.equal(body[0].address_from, ORDER.address_from);
});

test("suivi public : un autre client connecté ne voit pas le détail", async () => {
  const order = await adminOrder();
  const { body } = await call("GET", `/tracking/${order.tracking_number}`, { token: tok.client2 });
  assert.equal(body[0].client_name, undefined);
});

test("numéro de suivi : aléatoire, non séquentiel", async () => {
  const a = await adminOrder();
  const b = await adminOrder();
  assert.match(a.tracking_number, /^DHH-\d{4}-[2-9A-HJKMNP-Z]{8}$/);
  assert.notEqual(a.tracking_number, b.tracking_number);
});

// ── Point 3 : statut d'une commande d'un autre agent ──────────────────────
test("un agent ne peut pas changer le statut de la commande d'un autre agent", async () => {
  const order = await adminOrder({ agent_id: (await call("GET", "/auth/me", { token: tok.agent1 })).body.id });
  const { status } = await call("POST", "/tracking/history", { token: tok.agent2, body: { commande_id: order.id, status: "delivered" } });
  assert.equal(status, 403);
});

test("un client ne peut pas changer un statut", async () => {
  const order = await adminOrder();
  const { status } = await call("POST", "/tracking/history", { token: tok.client1, body: { commande_id: order.id, status: "delivered" } });
  assert.equal(status, 403);
});

// ── Point 4 : fraude sur les commissions ──────────────────────────────────
test("commande affiliée anonyme : le prix vient du catalogue, pas du navigateur", async () => {
  const { status, body } = await call("POST", "/commandes", { body: { ...ORDER, affiliate_code: affiliateCode, price: 1, weight: 0, quantity: 3 } });
  created.orders.push(body.id);
  assert.equal(status, 201);
  assert.equal(Number(body.price), 15000);
  assert.equal(Number(body.weight), 6);
});

test("commande anonyme sans produit du catalogue : refusée", async () => {
  const { status } = await call("POST", "/commandes", { body: { ...ORDER, price: 1 } });
  assert.equal(status, 400);
});

test("l'agent affilié ne peut ni modifier le prix ni marquer livrée sa propre commande affiliée", async () => {
  const { body: order } = await call("POST", "/commandes", { body: { ...ORDER, affiliate_code: affiliateCode } });
  created.orders.push(order.id);
  const price = await call("PATCH", `/commandes/${order.id}`, { token: tok.agent1, body: { price: 999999 } });
  assert.equal(price.status, 403);
  const viaPatch = await call("PATCH", `/commandes/${order.id}`, { token: tok.agent1, body: { status: "delivered" } });
  assert.equal(viaPatch.status, 403);
  const viaHistory = await call("POST", "/tracking/history", { token: tok.agent1, body: { commande_id: order.id, status: "delivered" } });
  assert.equal(viaHistory.status, 403);
  const { body: after } = await call("GET", `/commandes/${order.id}`, { token: tok.admin });
  assert.equal(after.status, "registered");
  assert.equal(after.commission_amount, null);
});

test("un agent ne peut pas réattribuer sa commande", async () => {
  const { body: order } = await call("POST", "/commandes", { token: tok.agent1, body: { ...ORDER, price: 100 } });
  created.orders.push(order.id);
  const { status } = await call("PATCH", `/commandes/${order.id}`, { token: tok.agent1, body: { agent_id: null } });
  assert.equal(status, 403);
});

test("un changement de statut par PATCH est enregistré dans l'historique", async () => {
  const order = await adminOrder();
  await call("PATCH", `/commandes/${order.id}`, { token: tok.admin, body: { status: "validated" } });
  const { body } = await call("GET", `/tracking/history/${order.id}`, { token: tok.admin });
  assert.ok(body.some((e) => e.status === "validated"));
});

// ── Point 5 : lecture des colis et historiques d'autrui ───────────────────
test("un client ne peut lire ni le colis ni les historiques d'un autre client", async () => {
  const { body: order } = await call("POST", "/commandes", { token: tok.client1, body: { ...ORDER, product_id: product.id } });
  created.orders.push(order.id);
  await call("PATCH", `/commandes/${order.id}`, { token: tok.admin, body: { status: "validated" } });
  const { body: colis } = await call("POST", "/colis", { token: tok.admin, body: { commande_id: order.id } });

  assert.equal((await call("GET", `/colis/${colis.id}`, { token: tok.client2 })).status, 403);
  assert.equal((await call("GET", `/colis/history/${colis.id}`, { token: tok.client2 })).status, 403);
  assert.equal((await call("GET", `/tracking/history/${order.id}`, { token: tok.client2 })).status, 403);
  // le propriétaire, lui, y a accès
  assert.equal((await call("GET", `/colis/${colis.id}`, { token: tok.client1 })).status, 200);
  assert.equal((await call("GET", `/tracking/history/${order.id}`, { token: tok.client1 })).status, 200);
  await db.query("DELETE FROM colis_history WHERE colis_id = ?", [colis.id]);
  await db.query("DELETE FROM colis WHERE id = ?", [colis.id]);
});

// ── Point 6 : compte suspendu ──────────────────────────────────────────────
test("un compte suspendu est coupé immédiatement, même avec un jeton encore valide", async () => {
  const email = `suspendu-${Date.now()}@test.local`;
  const { body: reg } = await call("POST", "/auth/register", { body: { full_name: "Test Suspendu", email, password: PASSWORD } });
  created.users.push(reg.user.id);
  assert.equal((await call("GET", "/auth/me", { token: reg.token })).status, 200);

  await call("PATCH", `/users/${reg.user.id}/status`, { token: tok.admin, body: { status: "suspended" } });
  const { status, body } = await call("GET", "/auth/me", { token: reg.token });
  assert.equal(status, 401);
  assert.match(body.error, /suspendu/);
});
