# Document de Conception — ShoeBox

**Projet :** ShoeBox – Plateforme e-commerce de sneakers  
**Équipe :** APP Informatique 2025-2026 S2  
**Version :** 1.0  
**Date :** Juin 2026  

---

## 1. Architecture globale

ShoeBox est une application web full-stack organisée selon une architecture **client-serveur** avec une séparation stricte entre le frontend et le backend.

```
┌──────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                        │
│                                                          │
│  HTML5 + CSS3 + JavaScript (Vanilla ES6+)               │
│  Pages : boutique, panier, commande, forum, admin…       │
│  Stockage local : localStorage (panier, token JWT)       │
└────────────────────────┬─────────────────────────────────┘
                         │  HTTP / JSON (fetch API)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    SERVEUR WEB (Apache)                  │
│                                                          │
│  Point d'entrée : backend/public/index.php              │
│  Middleware CORS → Router → Controller → Model           │
│  Authentification JWT                                    │
└────────────────────────┬─────────────────────────────────┘
                         │  PDO
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   BASE DE DONNÉES (MySQL)                │
│                                                          │
│  Base : shoesboxdb                                       │
│  16 tables relationnelles                               │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Architecture backend (MVC)

Le backend suit le patron **MVC (Modèle-Vue-Contrôleur)** adapté à une API REST. Il n'y a pas de Vue au sens classique : le contrôleur renvoie directement du JSON.

### 2.1 Structure des dossiers backend

```
backend/
├── public/
│   └── index.php          ← Point d'entrée unique (Front Controller)
├── config/
│   ├── app.php            ← Paramètres applicatifs
│   └── database.php       ← Connexion PDO
├── src/
│   ├── Core/
│   │   ├── Router.php     ← Routeur URL (GET/POST/PUT/DELETE)
│   │   ├── Database.php   ← Singleton PDO
│   │   ├── Request.php    ← Parsing des requêtes HTTP
│   │   ├── Response.php   ← Formatage des réponses JSON
│   │   └── JWT.php        ← Encodage/décodage des tokens
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── ProductController.php
│   │   ├── OrderController.php
│   │   ├── CartController.php
│   │   ├── FavouriteController.php
│   │   ├── CarouselController.php
│   │   ├── ForumController.php
│   │   ├── ReclamationController.php
│   │   ├── NewsletterController.php
│   │   └── Admin/         ← Contrôleurs réservés aux admins
│   ├── Models/
│   │   ├── User.php
│   │   ├── Product.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Favourite.php
│   │   ├── CarouselSlide.php
│   │   ├── Newsletter.php
│   │   ├── PasswordReset.php
│   │   ├── Reclamation.php
│   │   ├── Transaction.php
│   │   └── Forum/
│   └── Middleware/
│       ├── AuthMiddleware.php   ← Vérification du token JWT
│       ├── AdminMiddleware.php  ← Vérification du rôle admin
│       └── CorsMiddleware.php   ← Gestion des en-têtes CORS
└── .env                         ← Variables d'environnement
```

### 2.2 Flux de traitement d'une requête

```
Client HTTP
    │
    ▼
index.php
    │── CorsMiddleware (en-têtes CORS, gestion OPTIONS)
    │
    ▼
Router.php
    │── Correspondance URL + méthode HTTP
    │── Extraction des paramètres dynamiques {id}
    │
    ▼
Middleware (si route protégée)
    │── AuthMiddleware → vérifie token JWT
    │── AdminMiddleware → vérifie rôle admin
    │
    ▼
Controller.php
    │── Valide les données d'entrée
    │── Appelle le(s) Model(s)
    │
    ▼
Model.php
    │── Requêtes SQL via PDO
    │── Retourne les données
    │
    ▼
Response.php
    └── JSON { success, data, message } → Client
```

### 2.3 Format des réponses API

Toutes les réponses suivent une structure uniforme :

```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

En cas d'erreur :

```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

---

## 3. Architecture frontend

### 3.1 Structure des dossiers frontend

```
frontend/
├── index.html               ← Page d'accueil
├── assets/
│   ├── css/
│   │   ├── main.css         ← Styles globaux
│   │   ├── layout.css       ← Grille et mise en page
│   │   ├── components.css   ← Composants réutilisables
│   │   ├── shop.css         ← Page boutique
│   │   ├── cart.css         ← Page panier
│   │   ├── auth.css         ← Pages d'authentification
│   │   └── admin.css        ← Interface administrateur
│   ├── js/
│   │   ├── api.js           ← Fonctions utilitaires fetch
│   │   ├── auth.js          ← Gestion inscription/connexion
│   │   ├── boutique.js      ← Catalogue et filtres
│   │   ├── cart.js          ← Gestion du panier
│   │   ├── commande.js      ← Tunnel d'achat
│   │   ├── favourites.js    ← Gestion des favoris
│   │   ├── forum.js         ← Forum communautaire
│   │   ├── main.js          ← Page d'accueil
│   │   ├── navbar.js        ← Navigation
│   │   └── search.js        ← Recherche produits
│   └── img/                 ← Ressources images
└── pages/
    ├── auth/                ← Connexion, inscription, mdp oublié
    ├── boutique/            ← Catalogue produits
    ├── shop/                ← Produit, panier, favoris
    ├── checkout/            ← Commande et confirmation
    ├── account/             ← Profil et historique
    ├── forum/               ← Forum communautaire
    ├── reclamations/        ← Support client
    ├── admin/               ← Interface d'administration
    ├── Search/              ← Page de résultats de recherche
    └── legal/               ← CGU/CGV
```

### 3.2 Gestion de l'état côté client

| Donnée | Mécanisme de stockage |
|--------|----------------------|
| Token JWT | `localStorage` clé `token` |
| Panier | `localStorage` clé `cart` (tableau JSON) |
| Favoris | API backend (base de données) |
| Informations utilisateur | `localStorage` clé `user` |

---

## 4. Schéma Entités-Associations (E/A)

### Entités principales

| Entité | Attributs principaux |
|--------|---------------------|
| **Utilisateur** | id, nom, email, mot_de_passe, rôle, adresse |
| **Produit** | id, nom, description, prix, prix_promo, stock, taille, couleur, marque, genre, type, matière |
| **Commande** | id, montant_total, statut_paiement, statut_livraison, adresse_livraison, numéro_suivi |
| **LigneCommande** | id, quantité, prix_unitaire |
| **Paiement (Transaction)** | id, fournisseur, montant, devise, statut |
| **PartenaireLogistique** | id, nom, email, téléphone, site_web |
| **FilDiscussion** | id, titre, épinglé, verrouillé |
| **Publication** | id, corps_message, modifié |
| **Réclamation** | id, sujet, description, statut, priorité |
| **Newsletter** | id, email, statut |

### Associations

```
Utilisateur ──< passe >── Commande
Commande ──< contient >── LigneCommande
LigneCommande >── concerne ──< Produit
Commande >── gérée_par ──< PartenaireLogistique
Commande ──< génère >── Transaction
Utilisateur ──< met_en_favoris >── Produit  (N:N)
Utilisateur ──< crée >── FilDiscussion
FilDiscussion ──< contient >── Publication
Utilisateur ──< rédige >── Publication
Utilisateur ──< like >── Publication  (N:N)
FilDiscussion >── appartient_à ──< CatégorieForum
Utilisateur ──< soumet >── Réclamation
Réclamation >── concerne ──< Commande  (0,1)
Utilisateur ──< répond_à >── Réclamation
```

---

## 5. Schéma logique de la base de données

### Tables et attributs détaillés

**Users** (id PK, name, email UNIQUE, password_hash, role ENUM(customer/admin), adresse, created_at, updated_at)

**Products** (id PK, name, description, price, sale_price, img_url, stock_quantity, size, color, type, gender, fabrics, brand, created_at, updated_at)

**Orders** (id PK, user_id FK→Users, delivery_partner_id FK→DeliveryPartners, tracking_number, estimated_delivery, total_amount, payment_status ENUM(pending/paid/failed), shipping_status ENUM(pending/shipped/delivered/canceled), shipping_address, created_at, updated_at)

**OrderItems** (id PK, order_id FK→Orders, product_id FK→Products, quantity, price, created_at, updated_at)

**DeliveryPartners** (id PK, name, contact_email, contact_phone, website, is_active, created_at, updated_at)

**Transactions** (id PK, order_id FK→Orders, user_id FK→Users, provider ENUM(stripe/paypal/other), provider_transaction_id UNIQUE, amount, currency, status ENUM(pending/success/failed/refunded), created_at)

**PaymentMethods** (id PK, user_id FK→Users, provider, provider_customer_id, provider_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default, created_at)

**Favourites** (user_id FK→Users, product_id FK→Products) — clé primaire composite

**Newsletter** (id PK, email UNIQUE, subscribed_at, status ENUM(active/unsubscribed))

**PasswordResets** (token PK, email, expires_at, used)

**Reclamations** (id PK, user_id FK→Users, order_id FK→Orders, subject, description, status ENUM(open/in_progress/resolved/rejected), priority ENUM(low/medium/high), created_at, updated_at)

**ReclamationResponses** (id PK, reclamation_id FK→Reclamations, responder_id FK→Users, response_body, created_at)

**ForumCategories** (id PK, name, description, created_at)

**ForumThreads** (id PK, category_id FK→ForumCategories, user_id FK→Users, title, is_pinned, is_locked, created_at, updated_at)

**ForumPosts** (id PK, thread_id FK→ForumThreads, user_id FK→Users, body, is_edited, created_at, updated_at)

**ForumPostLikes** (id PK, post_id FK→ForumPosts, user_id FK→Users) — contrainte UNIQUE (post_id, user_id)

**InternalMessages** (id PK, sender_id FK→Users, receiver_id FK→Users, subject, message_body, read_status, sent_at)

**CarouselSlides** (id PK, title, subtitle, image_url, link, position, is_active, created_at, updated_at)

---

## 6. Routes API REST

### Authentification

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|-------------|
| POST | `/api/auth/register` | Créer un compte | Non |
| POST | `/api/auth/login` | Se connecter | Non |
| POST | `/api/auth/forgot-password` | Demande de réinitialisation | Non |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe | Non |

### Produits

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|-------------|
| GET | `/api/products` | Lister les produits (avec filtres) | Non |
| GET | `/api/products/{id}` | Détail d'un produit | Non |

### Panier et favoris

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|-------------|
| GET | `/api/cart` | Récupérer le panier | Oui |
| POST | `/api/cart` | Ajouter un article | Oui |
| PUT | `/api/cart/{id}` | Modifier la quantité | Oui |
| DELETE | `/api/cart/{id}` | Supprimer un article | Oui |
| GET | `/api/favourites` | Lister les favoris | Oui |
| POST | `/api/favourites` | Ajouter aux favoris | Oui |
| DELETE | `/api/favourites/{productId}` | Supprimer des favoris | Oui |

### Commandes

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|-------------|
| POST | `/api/orders` | Créer une commande | Oui |
| GET | `/api/orders` | Historique des commandes | Oui |

### Administration

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|-------------|
| GET/POST | `/api/admin/products` | Gestion produits | Admin |
| PUT/DELETE | `/api/admin/products/{id}` | Modifier/Supprimer produit | Admin |
| GET | `/api/admin/users` | Lister les utilisateurs | Admin |
| PUT | `/api/admin/users/{id}/role` | Modifier le rôle | Admin |
| GET/POST | `/api/admin/carousel` | Gestion du carrousel | Admin |
| GET | `/api/admin/orders` | Voir toutes les commandes | Admin |

---

## 7. Sécurité

### 7.1 Authentification JWT

```
Client                          Serveur
  │                               │
  │── POST /api/auth/login ──────►│
  │   { email, password }         │── Vérifie hash bcrypt
  │                               │── Génère JWT (HS256, 24h)
  │◄── { token: "eyJ..." } ──────│
  │                               │
  │── GET /api/orders ───────────►│
  │   Authorization: Bearer eyJ…  │── Décode JWT
  │                               │── Vérifie expiration + signature
  │◄── { orders: [...] } ────────│
```

### 7.2 Structure du token JWT

```json
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "user_id": 123, "role": "customer", "exp": 1748908800 }
Signature: HMAC-SHA256(base64(header) + "." + base64(payload), SECRET)
```

### 7.3 Hachage des mots de passe

Les mots de passe sont stockés avec `password_hash($password, PASSWORD_BCRYPT)` et vérifiés avec `password_verify()`. Aucun mot de passe n'est stocké en clair.

---

## 8. Diagramme de séquence — Passage de commande

```
Client          Frontend           API Backend          BDD MySQL
  │                │                    │                    │
  │ Valider panier │                    │                    │
  │───────────────►│                    │                    │
  │                │ POST /api/orders   │                    │
  │                │ + token JWT        │                    │
  │                │───────────────────►│                    │
  │                │                   │── AuthMiddleware    │
  │                │                   │   valide token      │
  │                │                   │── INSERT Orders ───►│
  │                │                   │── INSERT OrderItems►│
  │                │                   │◄── order_id ───────│
  │                │                   │── Envoie email      │
  │                │◄── { success } ───│                    │
  │ Confirmation   │                    │                    │
  │◄───────────────│                    │                    │
```
