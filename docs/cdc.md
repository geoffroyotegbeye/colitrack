# Cahier des charges fonctionnel – ColicTrack (MVP) PWA web, appli mobile ios et android

## Objectif

ColicTrack est une plateforme web permettant aux agents, clients et administrateurs de gérer les commandes, le suivi des colis et la vente de produits depuis une seule interface.

L'objectif principal de la première version est de centraliser la création des commandes, le suivi des colis et la gestion des boutiques des agents.



# 1. Gestion des utilisateurs

Le système comporte trois types d'utilisateurs.

## Administrateur

L'administrateur dispose d'un accès complet à la plateforme.

Il peut :

* gérer les agents
* gérer les clients
* gérer les colis
* gérer les commandes
* gérer les produits
* gérer les catégories
* définir les taxes
* consulter toutes les statistiques
* modifier tous les statuts
* créer les produits visibles par tous les agents
* gérer la boutique principale

---

## Agent

Chaque agent possède :

* son propre compte
* sa boutique en ligne
* un lien public partageable
* son catalogue personnalisé

L'agent peut :

* modifier les informations de sa boutique
* ajouter ses propres produits
* vendre les produits créés par l'administrateur
* recevoir des commandes
* créer une commande
* suivre les colis
* consulter ses statistiques
* gérer ses clients

---

## Client

Le client peut :

* créer un compte
* consulter les boutiques
* commander des produits
* suivre ses commandes
* suivre ses colis
* consulter son historique

---

# 2. Gestion des boutiques

Chaque agent dispose automatiquement d'une boutique.

La boutique possède :

* nom
* logo
* bannière
* description
* numéro WhatsApp
* adresse
* lien personnalisé
* catalogue

Chaque boutique est accessible publiquement.

Exemple :

colictrack.com/boutique/elyna-market

---

# 3. Gestion des produits

Deux types de produits existent.

## Produits globaux

Créés uniquement par l'administrateur.

Ils sont automatiquement disponibles dans toutes les boutiques des agents.

Les agents peuvent les vendre sans devoir les recréer.

---

## Produits personnels

Créés uniquement par chaque agent.

Ils sont visibles uniquement dans sa propre boutique.

---

Chaque produit possède :

* photo principale
* plusieurs images
* nom
* description
* catégorie
* prix
* quantité disponible
* état du stock
* poids
* dimensions
* taxe applicable
* statut (Actif / Masqué)

---

# 4. Gestion des commandes

Une commande peut être créée :

* par un client
* par un agent
* par l'administrateur

Chaque commande contient :

* numéro unique
* client
* agent responsable
* liste des produits
* photo du produit
* quantité
* prix unitaire
* montant total
* taxe
* frais éventuels
* montant final
* mode de paiement
* adresse de livraison
* observations

---

## Création rapide d'une commande

Le système doit permettre de coller un texte provenant de WhatsApp ou d'un autre canal.

À partir d'un format prédéfini, ColicTrack extrait automatiquement :

* le nom du client
* le numéro
* l'adresse
* les produits
* les quantités
* les montants
* les remarques

Une prévisualisation est affichée avant validation.

---

# 5. Gestion des colis

Chaque commande peut générer un colis.

Chaque colis possède :

* numéro de suivi
* QR Code
* photo
* poids
* dimensions
* destination
* transporteur
* agent responsable
* date de création
* historique

---

# 6. Statuts

## Statuts de commande

* Brouillon
* Nouvelle commande
* Confirmée
* En préparation
* Expédiée
* Livrée
* Annulée
* Retournée

---

## Statuts du colis

* Reçu
* En attente
* Emballé
* En transit
* Arrivé en agence
* En cours de livraison
* Livré
* Retourné
* Perdu

Chaque changement de statut est enregistré avec :

* la date
* l'heure
* l'utilisateur
* un commentaire facultatif

---

# 7. Tableau de bord

Chaque utilisateur dispose d'un tableau de bord adapté à son rôle.

Les indicateurs comprennent notamment :

* nombre de commandes
* commandes du jour
* commandes en attente
* colis en transit
* colis livrés
* chiffre d'affaires
* taxes collectées
* produits les plus vendus

---

# 8. Notifications

Le système envoie automatiquement des notifications lors des événements importants :

* nouvelle commande
* changement de statut
* colis expédié
* colis livré
* commande annulée

Les notifications pourront être envoyées par :

* notification interne
* e-mail
* WhatsApp (V2)
* SMS (V2)

---

# 9. Fonctionnalités prévues pour la V2

Les fonctionnalités suivantes sont prévues dans une version ultérieure :

* messagerie interne entre utilisateurs
* communauté de discussion
* commentaires
* fidélité et récompenses
* paiement Mobile Money intégré



 Modules fonctionnels de ColicTrack

Module 1 – Gestion des commandes (Priorité Critique ⭐⭐⭐⭐⭐)

C'est le cœur de la plateforme.

### Fonctionnalités

* Création d'une commande manuellement
* Création d'une commande par collage d'un texte suivant un format prédéfini
* Génération automatique des informations de la commande
* Attribution de la commande à un agent
* Association d'un ou plusieurs produits
* Ajout de photos
* Calcul automatique du montant
* Affichage de la taxe définie par l'administrateur
* Historique des modifications
* Recherche et filtrage des commandes
* Duplication d'une commande
* Impression ou téléchargement de la facture
* Génération d'un numéro de commande
* Conversion de la commande en colis

Statuts d'une commande

Les statuts peuvent être modifiés uniquement par l'administrateur ou l'agent responsable.

Exemples :

* Nouvelle
* Confirmée
* Achat effectué
* En préparation
* Expédiée
* Arrivée au dépôt/cargo
* En cours de livraison
* Livrée
* Annulée
* Retournée


# Module 2 – Gestion des agents (Priorité Critique ⭐⭐⭐⭐)

### Fonctionnalités

* Création d'un agent
* Suspension d'un agent
* Réactivation
* Attribution d'un rôle
* Attribution d'une boutique
* Gestion des permissions
* Consultation des performances
* Nombre de commandes
* Nombre de colis
* Chiffre d'affaires
* Taxes générées
* Historique des activités

Chaque agent possède automatiquement :

* une boutique
* un catalogue
* un lien public
* son espace de gestion

---

# Module 3 – Gestion des colis (⭐⭐⭐⭐)

* Création d'un colis ( un commande confirmée devient colis)
* Génération d'un numéro de suivi
* Historique des déplacements
* Gestion des différents statuts
* Recherche rapide
* Consultation par le client

---

# Module 4 – Gestion des produits (⭐⭐⭐⭐)

Deux catalogues existent.

### Produits administrateur

Créés par l'administrateur.

Ils sont visibles automatiquement chez tous les agents.

### Produits des agents

Chaque agent peut créer ses propres produits.

Ils ne sont visibles que dans sa boutique.

Chaque produit contient :

* photo
* nom
* description
* prix
* stock
* catégorie
* poids
* dimensions
* statut

---

# Module 5 – Gestion des taxes (⭐⭐⭐⭐)

Accessible uniquement à l'administrateur.

L'administrateur peut :

* définir le montant de la taxe
* modifier la taxe
* consulter les taxes collectées
* appliquer automatiquement la taxe aux commandes/ colis 

Les agents ne peuvent pas modifier le montant de la taxe.

---

# Module 6 – Gestion des boutiques (⭐⭐⭐)

Chaque agent possède une boutique avec :

* logo
* bannière
* description
* numéro WhatsApp
* catalogue
* lien personnalisé
* informations de contact

---

# Module 7 – Gestion des clients (⭐⭐⭐)

* Création de compte
* Historique des commandes
* Historique des colis
* Suivi des livraisons
* Modification du profil
* Gestion des adresses

---

# Module 8 – Tableau de bord (⭐⭐⭐)

Selon le rôle, affichage de :

* commandes
* colis
* ventes
* revenus
* taxes
* agents actifs
* meilleures ventes
* statistiques journalières

---

# Module 9 – Centre de formation (⭐⭐⭐)

La plateforme intègre un espace de formation dédié à l'importation et au commerce.

Fonctionnalités :

* catalogue des formations
* vidéos
* documents PDF
* quiz
* progression de l'apprenant
* certificats
* catégories de formations
* formations gratuites et payantes
* espace personnel de l'apprenant

---

# Module 10 – Notifications (⭐⭐)

* Nouvelle commande
* Changement de statut
* Nouveau colis
* Validation d'une commande
* Notifications internes


---

# Module 11 – Administration (⭐⭐⭐⭐)

* Gestion des utilisateurs
* Gestion des rôles
* Paramètres de la plateforme
* Journal des activités
* Sauvegardes
* Configuration générale
* Gestion des catégories
* Gestion des taxes
* Paramétrage des statuts

---

# Fonctionnalités prévues pour les prochaines versions

* Messagerie interne
* Communauté de discussion
* Paiement Mobile Money
* API publique
* Application mobile
* Programme de fidélité
* Marketplace entre agents
* Intelligence artificielle pour la lecture automatique des commandes

ColicTrack – Sprint 2 semaines : Module Commandes & Enregistrement

 Objectif principal

Permettre à l'administrateur et aux agents d'enregistrer, consulter et suivre toutes les commandes des clients depuis une interface centralisée.

---

# 1. Enregistrement des commandes (Priorité maximale)

## Création d'une commande

L'agent ou l'administrateur peut créer une commande avec :

* Nom du client
* Numéro WhatsApp / téléphone
* Adresse du client
* Photo du produit
* Nom du produit
* Prix du produit
* Quantité
* Taxe applicable
* Montant total
* Notes / informations supplémentaires

---

# 2. Création rapide par format texte

Permettre de copier un message provenant de WhatsApp ou autre source.

Exemple de format :

CLIENT :
Nom :
Téléphone :
Adresse :

COMMANDE :
Produit :
Prix :
Quantité :

Le système transforme automatiquement le texte en commande enregistrée.

Avant validation :

* aperçu des informations détectées
* possibilité de corriger
* validation finale

---

# 3. Gestion des clients

Chaque commande est liée à un client.

Le système doit permettre :

* création automatique d'un numéro de suivi lors d'une nouvelle commande
* historique de toutes ses commandes
* nombre total de commandes
* montant total dépensé
* statut des commandes en cours

 4. Vue globale des commandes (Dashboard principal)

L'administrateur voit toutes les commandes de tous les agents.

Informations affichées :

* Numéro commande
* Client
* Agent responsable
* Produit
* Montant
* Taxe
* Date
* Statut

Filtres :

* Par agent
* Par client
* Par date
* Par statut

---

 5. Gestion des statuts

Une commande possède un statut modifiable par :

* Administrateur
* Agent concerné

Statuts initiaux :

* Nouvelle
* En attente
* Confirmée
* En traitement
* Expédiée
* Livrée
* Annulée

Chaque changement est enregistré.

---

# 6. Fiche détaillée d'une commande

Une page doit afficher :

* Informations client
* Informations produit
* Photo
* Prix
* Taxe
* Historique des changements
* Agent responsable
* Statut actuel

---

# 7. Vue agent

Chaque agent voit :

* ses commandes uniquement
* ses clients
* ses statistiques simples

---

# 8. Vue administrateur

L'administrateur voit :

* toutes les commandes
* tous les clients
* tous les agents
* toutes les activités

---

# Résultat attendu après 2 semaines

Un agent peut :

1. Enregistrer un client.
2. Créer une commande rapidement.
3. Suivre son évolution.

L'administrateur peut :

1. Voir toutes les commandes de tous les agents.
2. Rechercher un client.
3. Contrôler les statuts.
4. Avoir une vision globale de l'activité.
