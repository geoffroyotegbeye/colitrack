# 🚀 ColiTrack — Guide de Déploiement

Stack : **Frontend → Vercel** | **Backend → Render** | **Base de données → Neon (PostgreSQL)**

---

## ✅ Prérequis accomplis

- [x] Base de données Neon créée et initialisée (`npm run db:init`)
- [x] Tables créées : `users`, `commandes`, `tracking_history`, `notifications`, `notification_subscriptions`
- [x] Admin par défaut : `admin@colitrack.com` / `<mot de passe défini au déploiement>`
- [x] `render.yaml` configuré à la racine
- [x] `vercel.json` configuré à la racine
- [x] Build frontend vérifié (`npm run build` ✅)

---

## ÉTAPE 1 — Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "feat: initial deployment setup"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/colitrack.git
git push -u origin main
```

> Si le dépôt existe déjà, juste :
> ```bash
> git add .
> git commit -m "feat: neon + render + vercel config"
> git push
> ```

---

## ÉTAPE 2 — Déployer le Backend sur Render

### 2.1 Créer le service

1. Aller sur **[render.com](https://render.com)** → Se connecter
2. Cliquer **New +** → **Web Service**
3. Connecter votre compte GitHub → Sélectionner le dépôt `colitrack`
4. Render détecte automatiquement `render.yaml`

### 2.2 Renseigner les variables d'environnement

Dans **Dashboard → colitrack-backend → Environment**, ajouter :

| Clé | Valeur |
|-----|--------|
| `DATABASE_URL` | `postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require` |
| `FRONTEND_URL` | *(à remplir après déploiement Vercel — ex: `https://colitrack.vercel.app`)* |
| `JWT_SECRET` | *(généré automatiquement par Render)* |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

### 2.3 Lancer le déploiement

Cliquer **Deploy Web Service**

Le backend sera disponible sur :
```
https://colitrack-backend.onrender.com
```

Vérifier que le service est vivant :
```
https://colitrack-backend.onrender.com/api/health
```
→ Réponse attendue : `{ "status": "ok", "timestamp": "..." }`

---

## ÉTAPE 3 — Déployer le Frontend sur Vercel

### 3.1 Créer le projet

1. Aller sur **[vercel.com](https://vercel.com)** → Se connecter
2. Cliquer **Add New → Project**
3. Importer le dépôt GitHub `colitrack`
4. Vercel détecte automatiquement Vite

### 3.2 Configurer le build

| Paramètre | Valeur |
|-----------|--------|
| Framework Preset | `Vite` |
| Root Directory | `.` *(racine)* |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 3.3 Renseigner les variables d'environnement

Dans **Settings → Environment Variables** :

| Clé | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://ogmknpqzjmfqkpazfxes.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(clé anon Supabase)* |

### 3.4 Déployer

Cliquer **Deploy**

Le frontend sera disponible sur :
```
https://colitrack.vercel.app
```
*(ou un sous-domaine généré par Vercel)*

---

## ÉTAPE 4 — Connecter Frontend ↔ Backend

### 4.1 Mettre à jour FRONTEND_URL sur Render

Une fois l'URL Vercel connue, retourner sur **Render → Environment** et mettre à jour :

```
FRONTEND_URL=https://colitrack.vercel.app
```

Puis cliquer **Save Changes** → Render redéploie automatiquement.

### 4.2 (Optionnel) Ajouter VITE_API_URL sur Vercel

Si vous souhaitez que le frontend appelle le backend Node au lieu de Supabase :

```
VITE_API_URL=https://colitrack-backend.onrender.com
```

---

## ÉTAPE 5 — Vérifications finales

```bash
# 1. Health check backend
curl https://colitrack-backend.onrender.com/api/health

# 2. Test login admin
curl -X POST https://colitrack-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@colitrack.com","password":"<votre-mot-de-passe>"}'

# 3. Test tracking public
curl https://colitrack-backend.onrender.com/api/tracking/DHH-2026-000001
```

---

## 🗂️ Récapitulatif des URLs

| Service | URL |
|---------|-----|
| Frontend | `https://colitrack.vercel.app` |
| Backend API | `https://colitrack-backend.onrender.com` |
| Health check | `https://colitrack-backend.onrender.com/api/health` |
| Base de données | Neon Dashboard → [console.neon.tech](https://console.neon.tech) |
| Supabase Auth | [supabase.com/dashboard](https://supabase.com/dashboard) |

---

## ⚠️ Notes importantes

- **Render plan gratuit** : le service se met en veille après 15 min d'inactivité → premier appel lent (~30s). Passer au plan **Starter ($7/mois)** pour éviter ça.
- **Neon plan gratuit** : 0.5 GB de stockage, largement suffisant pour démarrer.
- **Changer le mot de passe admin** après le premier déploiement.
- Ne jamais committer `.env` ou `.env.production` sur GitHub (déjà dans `.gitignore`).
