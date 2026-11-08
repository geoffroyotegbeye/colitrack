# ColiTrack — État actuel de l'application

> Ce document décrit **ce que le code fait réellement aujourd'hui**, indépendamment du
> cahier des charges (`cdc.md`). Il sert de base pour décider ensuite quoi ajouter ou aligner.
> Dernière mise à jour : 2026-11-08.

---

## 1. En bref

ColiTrack est une plateforme web (PWA) de **suivi de colis import Chine → Afrique**, couplée à
une **marketplace d'affiliation**. Trois rôles : **admin**, **agent** (affilié), **client**.

**Différence majeure avec le CDC** : le CDC prévoit une **boutique par agent**. Le code a
**pivoté** vers un modèle **type Amazon Affiliés** :
- l'**admin possède tout le catalogue** (plus de boutique ni de produits propres à chaque agent) ;
- il existe **une seule marketplace centrale** publique ;
- un **agent** fait de la **promotion** via un **lien d'affiliation par produit** et touche une
  **commission** quand la commande est **livrée** ;
- on devient agent via une **candidature avec pièce d'identité**, validée par l'admin.

---

## 2. Stack technique

| Côté | Technologies |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript, React Router, TanStack Query, Tailwind + shadcn/ui, PWA (installable). 33 pages. |
| **Backend** | Node.js + Express, PostgreSQL (`pg`), JWT (bcrypt), WebSocket (`ws`) pour le temps réel, upload via `multer`. |
| **Base de données** | PostgreSQL. En local : Docker (`docker-compose.yml`, port 5438). 20 tables. |
| **Déploiement** | Une seule origine : le backend sert le frontend compilé. Config Railway (`railway.json`). Voir `RAILWAY.md`. |

**Authentification** : jeton JWT (7 jours) stocké côté navigateur. Le backend **revérifie le
compte en base à chaque requête** → un compte suspendu ou supprimé est coupé immédiatement.

---

## 3. Les trois rôles

### Admin
Accès complet : catalogue produits, commandes, colis, utilisateurs, agents, candidatures,
catégories, taxes, tarifs de transport, commissions, statistiques globales, journal d'activité,
centre de formation.

### Agent (affilié)
- Génère un **lien d'affiliation par produit** du catalogue.
- Touche une **commission** (créditée à la **livraison** de la commande).
- Consulte ses commandes, ses clients, ses statistiques, ses commissions.
- Ne touche **pas** au stock, aux prix ni au catalogue.
- Peut créer/suivre des commandes et colis qui lui sont rattachés.

### Client
- Crée un compte, parcourt la marketplace, commande (ou commande **sans compte**).
- Suit ses commandes et colis, consulte son historique, modifie son profil.

---

## 4. Modules réellement implémentés

### 4.1 Commandes (cœur de l'app)
- Création **manuelle** (page Nouvelle commande) et **depuis la marketplace** (panier).
- **Création rapide par collage d'un texte WhatsApp** : `parseQuickOrder` extrait nom, téléphone,
  adresse, produit, quantité… avec **aperçu avant validation**.
- **Numéro de suivi aléatoire** non devinable (`DHH-AAAA-XXXXXXXX`).
- **Prix calculé côté serveur** : produit + **taxe** (taux global admin) + **transport**
  (poids × tarif du mode choisi). Le prix envoyé par le navigateur est ignoré pour les commandes
  publiques/affiliées (anti-fraude).
- **Photos** de commande, **notes**, rattachement **client** et **agent**.
- **Historique des changements de statut** (qui, quand, commentaire) — quelle que soit la route.
- **Recherche et filtres** (agent, client, date, statut), **pagination**.
- **Duplication** d'une commande, **facture PDF**, **conversion en colis**.
- **Limite connue** : **un seul produit par commande** (pas de panier multi-lignes au niveau d'une
  même commande ; un panier de plusieurs produits crée plusieurs commandes).

**Statuts de commande** (en base) :
`registered` (enregistrée) · `validated` (confirmée) · `purchased` (achat effectué) ·
`in_china` (en Chine) · `shipped` (expédiée) · `in_transit` (en transit) ·
`arrived_benin` (arrivée au dépôt) · `delivering` (en livraison) · `delivered` (livrée) ·
`refused` (refusée). Modifiables uniquement par l'admin ou l'agent responsable.

### 4.2 Colis
- Créé à partir d'une **commande confirmée** (une commande = au plus un colis).
- **Numéro de suivi**, **QR code**, photo, poids, dimensions, destination, transporteur, agent.
- **Historique des déplacements**, recherche, consultation par le client propriétaire.

**Statuts de colis** :
`recu` · `en_attente` · `emballe` · `en_transit` · `arrive_agence` · `en_livraison` ·
`livre` · `retourne` · `perdu`.

### 4.3 Produits (catalogue)
- **Catalogue géré par l'admin uniquement** (produits « globaux », visibles de tous).
- Champs : image principale + galerie, nom, description, catégorie, prix, stock, poids,
  dimensions, taxe, **taux de commission**, statut (actif/masqué), **modes de transport** proposés.
- **Pas de produits propres à chaque agent** (contrairement au CDC — effet du pivot).

### 4.4 Marketplace & affiliation
- **Marketplace centrale publique** : liste des produits, page produit.
- **Lien d'affiliation par produit** (`/p/:code`) généré par un agent.
- **Commande sans compte** possible depuis la marketplace / un lien affilié.
- **Commission** : calculée sur le prix, **créditée à la livraison** (jamais sur une commande
  annulée), payable par l'admin (page Paiements).

### 4.5 Candidature agent (DigiMarket)
- Un client postule pour devenir agent : **pièce d'identité**, numéro, selfie.
- L'admin **valide** ou **rejette** depuis la page des candidatures ; la validation passe le
  compte en rôle `agent`.

### 4.6 Taxes & transport
- **Taxe** : taux global défini par l'admin, **appliqué automatiquement**. Les agents ne peuvent
  pas le modifier. Taxes collectées visibles au tableau de bord.
- **Transport** : 4 modes (`standard`, `express`, `maritime`, `aerien`), chacun avec un
  **tarif au kg** et un **délai** éditables par l'admin ; coût calculé automatiquement.

### 4.7 Tableau de bord & statistiques
- Tableau de bord **adapté au rôle** : nombre de commandes, commandes du jour, en transit,
  colis livrés, chiffre d'affaires, taxes collectées.
- Page Statistiques : CA, meilleurs agents, **meilleures ventes** (produits).

### 4.8 Clients
- Compte, **historique des commandes et colis**, suivi, **modification du profil**.
- *Pas de carnet d'adresses.*

### 4.9 Centre de formation
- Cours avec leçons **vidéo / PDF / quiz**, **progression** de l'apprenant, **certificat PDF**.
- Champ gratuit/payant présent, **sans paiement** branché.

### 4.10 Notifications
- **Internes, en temps réel** (cloche + WebSocket) : nouvelle commande, changement de statut, etc.
- **E-mail : non branché** (reporté). WhatsApp/SMS : prévus V2.

### 4.11 Administration
- Gestion des **utilisateurs** et **rôles**, **journal d'activité**, **catégories**, taxes,
  tarifs de transport.
- *Pas de* sauvegardes, *ni* paramétrage dynamique des statuts, *ni* page de réglages généraux.

### 4.12 Suivi public
- Suivi d'un colis par son numéro **sans compte** : seuls **statuts et dates** sont visibles ;
  nom, adresses, prix sont **masqués** sauf pour le propriétaire connecté.

---

## 5. Structure du code

### Backend — routes (`backend/src/routes/`)
`/api/auth` · `/api/commandes` · `/api/tracking` · `/api/colis` · `/api/produits` ·
`/api/agents` · `/api/affiliate` · `/api/digimarket` · `/api/taxes` · `/api/categories` ·
`/api/clients` · `/api/users` · `/api/courses` · `/api/notifications` · `/api/activity` ·
`/api/upload` · `/api/health`.

### Base de données — 20 tables
`users`, `commandes`, `commande_images`, `tracking_history`, `colis`, `colis_history`,
`saved_products`, `saved_product_images`, `product_transport_modes`, `transport_rates`,
`affiliate_links`, `digimarket_profiles`, `tax_settings`, `categories`, `notifications`,
`notification_subscriptions`, `courses`, `course_lessons`, `course_progress`, `certificates`.

### Frontend — pages clés (`frontend/src/pages/`)
Marketplace, Produit, Panier (public) · Commandes, Nouvelle commande, Détail commande · Colis,
Détail colis · Produits, Catégories, Taxes · Agents, Candidatures agents, Clients, Utilisateurs ·
Affiliation, Paiements, DigiMarket · Formation, Détail cours · Statistiques, Tableau de bord,
Journal d'activité, Notifications, Profil · Suivi, Connexion/Inscription.

**Protection** : toutes les pages du back-office sont **verrouillées par défaut** (une seule garde
`RequireAuth`). Pages publiques : authentification, marketplace/produit/panier, suivi, pages info.

---

## 6. Sécurité (déjà en place)

- Mots de passe **hachés** (bcrypt), requêtes SQL **paramétrées**, CORS en liste blanche.
- Contrôles d'accès aux commandes/colis (propriétaire, agent responsable ou admin).
- Suivi public **sans fuite** de données personnelles.
- Un **agent affilié** ne peut pas modifier le prix/statut de sa propre commande affiliée
  (anti-fraude aux commissions).
- Tests automatiques backend (`npm test`, contrôle d'accès).

*Reste à faire côté sécurité* (voir audit) : limites de débit, en-têtes `helmet`, validation
d'entrées (zod), durcissement des uploads, verrouillage après échecs de connexion, stockage des
fichiers hors du serveur.

---

## 7. Écarts connus avec le CDC (`cdc.md`)

| Sujet CDC | Dans le code |
|---|---|
| Boutique par agent | ❌ remplacée par marketplace centrale + affiliation |
| Produits personnels d'agent | ❌ catalogue admin uniquement |
| Commande multi-produits | ❌ un seul produit par commande |
| Mode de paiement par commande | ❌ non géré (payable à la réception) |
| Carnet d'adresses client | ❌ absent |
| E-mail (notifs, mot de passe oublié) | ❌ non branché |
| Sauvegardes, paramétrage des statuts | ❌ absents |
| **Ajouts hors CDC** | ✅ marketplace d'affiliation, commission par produit + paiement, candidature agent avec pièce d'identité, modes/tarifs de transport |

---

## 8. En cours / à venir
- **Déploiement Railway** (une seule origine) — préparé, à lancer.
- **Webhook WooCommerce** : import automatique des commandes depuis le site WordPress du client
  (vêtements/chaussures : tailles, pointures, photos) — à construire.
- Suite de l'**audit sécurité**.
