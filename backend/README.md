# ColiTrack — Backend Node.js + MySQL

Backend REST API pour ColiTrack. Tourne sur **Render** en production.

## Prérequis

- Node.js >= 20
- MySQL >= 8 (local : WAMP/XAMPP — production : Railway, PlanetScale, Clever Cloud)

## Installation locale

```bash
cd backend
npm install
cp .env.example .env   # puis remplir les valeurs
npm run dev            # démarre sur http://localhost:3001
```

## Déploiement sur Render

### 1. Base de données MySQL distante

Render ne fournit pas MySQL nativement. Utiliser un service externe :

| Service | Plan gratuit | Lien |
|---------|-------------|------|
| **Railway** | ✅ 500h/mois | https://railway.app |
| **PlanetScale** | ✅ 5 GB | https://planetscale.com |
| **Clever Cloud** | ✅ limité | https://clever-cloud.com |

Après création, récupérer : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`.

Puis exécuter le script `database.sql` sur cette base distante.

### 2. Déployer sur Render

1. Pousser le code sur GitHub
2. Aller sur [render.com](https://render.com) → **New Web Service**
3. Connecter le dépôt GitHub
4. Render détecte automatiquement `render.yaml` à la racine
5. Renseigner les variables d'environnement dans **Dashboard > Environment** :

| Variable | Valeur |
|----------|--------|
| `FRONTEND_URL` | URL de votre frontend (ex: `https://colitrack.vercel.app`) |
| `DB_HOST` | Hôte MySQL distant |
| `DB_PORT` | `3306` |
| `DB_USER` | Utilisateur MySQL |
| `DB_PASSWORD` | Mot de passe MySQL |
| `DB_NAME` | `colitrack` |
| `JWT_SECRET` | Généré automatiquement par Render |

6. Cliquer **Deploy** — le service sera disponible sur `https://colitrack-backend.onrender.com`

### 3. Connecter le frontend

Dans les variables d'environnement du frontend (Vercel/Netlify), ajouter :

```env
VITE_API_URL=https://colitrack-backend.onrender.com
```

## Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/health` | — | Health check Render |
| POST | `/api/auth/register` | — | Créer un compte |
| POST | `/api/auth/login` | — | Se connecter |
| GET | `/api/tracking/:number` | — | Suivi public |
| GET | `/api/commandes` | ✅ | Liste commandes |
| POST | `/api/commandes` | ✅ | Créer commande |
| PATCH | `/api/commandes/:id` | ✅ | Modifier commande |
| DELETE | `/api/commandes/:id` | Admin | Supprimer |
| POST | `/api/tracking/history` | Agent/Admin | Ajouter événement |
| GET | `/api/agents` | Admin | Liste agents |
