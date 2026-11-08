require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { setup: setupWebSocket } = require("./ws");

const authRoutes = require("./routes/auth");
const commandesRoutes = require("./routes/commandes");
const trackingRoutes = require("./routes/tracking");
const agentsRoutes = require("./routes/agents");
const colisRoutes = require("./routes/colis");
const produitsRoutes = require("./routes/produits");
const taxesRoutes = require("./routes/taxes");
const usersRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const activityRoutes = require("./routes/activity");
const coursesRoutes = require("./routes/courses");
const notificationsRoutes = require("./routes/notifications");
const clientsRoutes = require("./routes/clients");
const uploadRoutes = require("./routes/upload");
const affiliateRoutes = require("./routes/affiliate");
const digimarketRoutes = require("./routes/digimarket");

const app = express();
const PORT = process.env.PORT || 3001;

// Derrière le proxy de l'hébergeur (Railway/Render) : req.protocol = https, vraie IP client
app.set("trust proxy", 1);

// CORS — autorise le frontend local + le domaine de production
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

// En mode une seule origine, le frontend est servi par ce même serveur : l'appel API est
// alors same-origin (son Origin = l'hôte de la requête) et doit toujours passer.
app.use(
  cors({
    origin: (origin, callback) => {
      // Pas d'origin (curl, health checks) ou origine explicitement autorisée → en-têtes CORS
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // Origine inconnue : on NE jette PAS d'erreur (sinon 500). On n'envoie simplement pas
      // les en-têtes CORS ; une requête same-origin n'en a pas besoin et passe quand même,
      // une vraie requête cross-origin non autorisée sera bloquée par le navigateur.
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandesRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/colis", colisRoutes);
app.use("/api/produits", produitsRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/digimarket", digimarketRoutes);

// Health check — utilisé par l'hébergeur pour vérifier que le service est vivant
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Toute route /api inconnue → 404 JSON (avant le repli SPA)
app.use("/api", (req, res) => res.status(404).json({ error: "Route introuvable" }));

// En production : sert le frontend compilé (une seule origine, pas de CORS).
// SERVE_FRONTEND=1 active ce mode ; sinon le backend reste une API pure (dev local avec Vite).
if (process.env.SERVE_FRONTEND === "1") {
  const distDir = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(distDir));
  // Repli SPA : toute autre route renvoie index.html (routing côté client)
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
} else {
  app.use((req, res) => res.status(404).json({ error: "Route introuvable" }));
}

// Erreur globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur ColiTrack démarré sur le port ${PORT}`);
});
