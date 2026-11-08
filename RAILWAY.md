# Déploiement ColiTrack sur Railway

Architecture retenue : **une seule origine**. Le backend Express sert aussi le frontend
React compilé. Un seul service web + une base PostgreSQL. Pas de CORS, `/api` et `/ws`
fonctionnent directement.

```
Railway projet « colitrack »
├── Postgres            (plugin Railway — fournit DATABASE_URL)
└── colitrack (web)     (ce dépôt — build frontend + backend, sert tout)
```

---

## Étapes (interface web Railway)

### 1. Créer le projet et la base
1. [railway.com](https://railway.com) → **New Project** → **Deploy PostgreSQL**.
2. Le service **Postgres** est créé. Il expose une variable `DATABASE_URL` (réseau interne).

### 2. Ajouter le service applicatif
1. Dans le projet → **New** → **GitHub Repo** → choisir `Elynadev/colitrack`, branche `geodev`.
2. Railway lit `railway.json` à la racine : build et démarrage sont déjà configurés.

### 3. Variables d'environnement du service web
Dans le service **colitrack** → onglet **Variables** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (référence au service Postgres) |
| `JWT_SECRET` | une longue chaîne aléatoire — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NODE_ENV` | `production` |
| `JWT_EXPIRES_IN` | `7d` |

`PORT` est fourni automatiquement par Railway. `SERVE_FRONTEND=1` est déjà passé par la commande de démarrage.
`FRONTEND_URL` est inutile en une seule origine (mais sans danger si présent).

### 4. Exposer le domaine
Service web → **Settings** → **Networking** → **Generate Domain**.
→ URL publique du type `https://colitrack-production.up.railway.app`.

### 5. Initialiser la base (une seule fois)
Après le premier déploiement réussi, ouvrir le **shell** du service web (ou via la CLI) et lancer :

```bash
npm run db:init          # crée les tables (idempotent)
FORCE_SEED=1 npm run db:seed   # comptes + données de démo (ATTENTION : efface les données)
```

> `db:seed` refuse une base non locale sauf `FORCE_SEED=1`. Ne le relancer **jamais** une
> fois que le client a saisi de vraies données : il remettrait tout à zéro.

### Comptes de démo (après seed)
Mot de passe commun : `Test1234!`
- Admin : `admin@colitrack.com`
- Agent : `fatou.agent@colitrack.com`
- Client : `elyna@colitrack.com`

---

## Avec la CLI Railway (optionnel, plus rapide)
```bash
npm i -g @railway/cli
railway login
railway init                       # ou : railway link <projet>
railway add --database postgres
railway up                         # build + déploie ce dépôt
railway variables --set JWT_SECRET=... --set NODE_ENV=production
railway run npm run db:init
railway run bash -c "FORCE_SEED=1 npm run db:seed"
railway domain                     # génère l'URL publique
```

---

## Notes
- **Uploads (photos, pièces d'identité)** : stockés dans `backend/uploads`, sur le disque du
  conteneur. Railway peut redéployer/redémarrer le conteneur et **effacer ce dossier**. Pour
  la démo c'est acceptable ; pour la production il faudra un stockage externe (ex. Cloudflare
  R2 / S3) — déjà noté dans l'audit sécurité.
- **SSL base** : géré automatiquement. La base interne Railway n'utilise pas SSL ; Neon oui.
  Forcer si besoin avec `PGSSL=require` ou `PGSSL=disable`.
- **Rebuild frontend** : comme le backend sert le frontend, tout changement front nécessite un
  redéploiement du service (Railway le fait à chaque push sur la branche suivie).
