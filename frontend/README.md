# ColiTrack — Suivi de colis Chine → Afrique

Application web de suivi de colis en temps réel pour les importations depuis la Chine vers l'Afrique.

## Technologies

- **Frontend** : React + TypeScript + Vite
- **UI** : shadcn/ui + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth)
- **Backend local** : Node.js + Express + MySQL (dossier `backend/`)

## Démarrage rapide

```sh
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application tourne sur **http://localhost:5173**

## Structure

```
src/
├── components/   # Composants réutilisables
├── pages/        # Pages de l'application
├── hooks/        # Hooks React personnalisés
├── lib/          # Types et utilitaires
└── integrations/ # Client Supabase

backend/          # API Node.js + MySQL (optionnel)
supabase/         # Migrations SQL
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualiser le build |
| `npm run test` | Lancer les tests |
