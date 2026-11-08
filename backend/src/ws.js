const { WebSocketServer, WebSocket } = require("ws");
const { resolveUser } = require("./config/auth");

const clients = new Map(); // userId -> Set<WebSocket>

function setup(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    let userId;
    try {
      const { user } = await resolveUser(token);
      if (!user) throw new Error("refusé");
      userId = user.id;
    } catch {
      ws.close(4001, "Token invalide");
      return;
    }

    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    ws.on("close", () => {
      const sockets = clients.get(userId);
      if (!sockets) return;
      sockets.delete(ws);
      if (sockets.size === 0) clients.delete(userId);
    });
  });

  return wss;
}

/** Pousse une notification en temps réel à toutes les connexions ouvertes de cet utilisateur (no-op s'il n'est pas connecté). */
function pushToUser(userId, notification) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(notification);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

module.exports = { setup, pushToUser };
