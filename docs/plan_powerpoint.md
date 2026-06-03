# Plan du PowerPoint — Soutenance finale ShoeBox

**Projet :** ShoeBox – Plateforme e-commerce de sneakers  
**Équipe :** APP Informatique 2025-2026 S2  
**Durée estimée :** 15-20 minutes de présentation  

---

## Structure recommandée (12-15 diapositives)

---

### Diapositive 1 — Page de titre

**Titre :** ShoeBox  
**Sous-titre :** Plateforme e-commerce de sneakers  
**Visuels :** Logo ShoeBox + screenshot de la page d'accueil  
**Infos :** Nom de l'équipe · APP Informatique 2025-2026 S2 · Juin 2026

---

### Diapositive 2 — Sommaire

1. Présentation du projet et contexte
2. Fonctionnalités réalisées
3. Architecture technique
4. Base de données
5. Démonstration live
6. Difficultés rencontrées
7. Bilan et perspectives

---

### Diapositive 3 — Contexte et objectifs

**Titre :** Pourquoi ShoeBox ?

- Marché des sneakers en forte croissance
- Besoin d'une boutique en ligne moderne et communautaire
- Objectifs du client :
  - Site marchand complet (catalogue, panier, commandes)
  - Espace communautaire (forum)
  - Support client intégré (réclamations)
  - Back-office pour les administrateurs

**Visuels :** Icônes représentant chaque objectif

---

### Diapositive 4 — Fonctionnalités côté client

**Titre :** Ce que peut faire un utilisateur

Deux colonnes :

**Colonne gauche — Achat**
- ✅ Créer un compte / se connecter
- ✅ Parcourir et filtrer le catalogue
- ✅ Rechercher un produit
- ✅ Consulter les fiches produits
- ✅ Gérer son panier
- ✅ Passer une commande
- ✅ Consulter l'historique des commandes

**Colonne droite — Communauté & Plus**
- ✅ Ajouter des produits en favoris
- ✅ Participer au forum
- ✅ Soumettre des réclamations
- ✅ S'abonner à la newsletter
- ✅ Réinitialiser son mot de passe

---

### Diapositive 5 — Fonctionnalités côté administrateur

**Titre :** Interface d'administration

- 📦 **Gestion du catalogue** : créer, modifier, supprimer des produits
- 👥 **Gestion des utilisateurs** : voir les comptes, attribuer le rôle admin
- 📋 **Gestion des commandes** : suivre et mettre à jour les statuts de livraison
- 🖼️ **Carrousel** : gérer les bannières de la page d'accueil
- 🎫 **Réclamations** : traiter les tickets de support client

**Visuels :** Screenshot du tableau de bord admin

---

### Diapositive 6 — Architecture technique

**Titre :** Stack technologique

```
Frontend                    Backend                  Base de données
──────────                  ───────                  ───────────────
HTML5 + CSS3           →    PHP (vanilla)        →   MySQL
JavaScript ES6+        →    API REST JSON        →   16 tables
(sans framework)       →    Pattern MVC          →   PDO
LocalStorage           →    JWT (HS256)          →   shoesboxdb
```

**Schéma simplifié :**

`Navigateur ──(fetch/JSON)──► Apache + PHP ──(PDO/SQL)──► MySQL`

---

### Diapositive 7 — Organisation du code

**Titre :** Architecture MVC

Montrer la structure dossiers backend :

```
backend/
  src/
    Core/      ← Router, JWT, Request, Response
    Controllers/ ← Un par fonctionnalité
    Models/      ← Un par table BDD
    Middleware/  ← Auth, Admin, CORS
```

Points clés :
- **Routeur custom** : gère GET/POST/PUT/DELETE avec paramètres dynamiques
- **JWT maison** : pas de bibliothèque externe, implémentation HS256
- **Singleton PDO** : une seule connexion par requête

---

### Diapositive 8 — Base de données

**Titre :** Schéma de la base de données (16 tables)

Schéma visuel simplifié des relations principales :

```
Users ──< Orders ──< OrderItems >── Products
  │                                    │
  └──< Favourites >──────────────────┘
  │
  └──< ForumThreads ──< ForumPosts ──< ForumPostLikes
  │
  └──< Reclamations ──< ReclamationResponses
```

Tables secondaires : Newsletter, PasswordResets, Transactions, PaymentMethods, DeliveryPartners, CarouselSlides, ForumCategories, InternalMessages

---

### Diapositive 9 — Sécurité

**Titre :** Mesures de sécurité

- 🔐 **Mots de passe** : hachage bcrypt (irréversible)
- 🎫 **Authentification** : tokens JWT (expiration 24h)
- 🛡️ **Routes protégées** : vérification du token à chaque requête
- 👮 **Rôles** : middleware admin pour les routes sensibles
- 🕐 **Réinitialisation** : tokens de reset expirés après 1h
- 🌐 **CORS** : contrôle des origines autorisées

---

### Diapositive 10 — Démonstration

**Titre :** Démonstration live

Scénario de démonstration (à adapter) :

1. **Page d'accueil** → carrousel + produits vedettes
2. **Inscription** → créer un compte
3. **Boutique** → filtrer les produits, rechercher
4. **Fiche produit** → ajouter au panier + favoris
5. **Panier** → modifier les quantités
6. **Commande** → passer et confirmer
7. **Forum** → créer un fil de discussion
8. **Admin** → ajouter un produit, gérer les commandes

---

### Diapositive 11 — Difficultés rencontrées

**Titre :** Challenges techniques

Exemples (à personnaliser selon votre vécu) :

- **Routeur PHP custom** : gérer les paramètres dynamiques (`/api/products/{id}`) sans framework
- **Implémentation JWT** : encodage base64url, signature HMAC-SHA256 sans librairie
- **Gestion des favoris** : synchronisation entre localStorage et API
- **CORS** : configuration des en-têtes pour les requêtes cross-origin en développement
- **Responsive design** : adaptation de l'interface aux différentes tailles d'écran

---

### Diapositive 12 — Bilan

**Titre :** Ce que nous avons accompli

**Réalisé ✅**
- Site e-commerce complet et fonctionnel
- 30+ fonctionnalités implémentées
- API REST avec 20+ endpoints
- Base de données relationnelle (16 tables)
- Interface responsive mobile/desktop
- Back-office complet pour les admins
- Forum communautaire
- Système de support (réclamations)

**Non réalisé / Améliorable 🔜**
- Paiement en ligne réel (Stripe/PayPal à brancher)
- Suivi de livraison en temps réel
- Application mobile
- Tests automatisés

---

### Diapositive 13 — Perspectives

**Titre :** Et la suite ?

- Intégration d'un vrai prestataire de paiement (Stripe)
- Développement d'une application mobile (React Native)
- Mise en place de tests unitaires et d'intégration
- Déploiement sur un serveur cloud (AWS, OVH…)
- Optimisation des performances (cache, CDN)
- Fonctionnalités avancées : avis clients, programme fidélité

---

### Diapositive 14 — Conclusion

**Titre :** Merci pour votre attention

- Projet ambitieux mené de bout en bout
- Compétences développées : PHP, MySQL, JS vanilla, architecture MVC, API REST, sécurité web
- Expérience de travail en équipe sur un projet réel avec un client

**Questions ?**

---

## Conseils pour la présentation

- **Ne pas lire les diapositives** : parler à l'audience, les slides sont un support
- **Avoir la démonstration prête** avant de commencer (onglets ouverts, données test en BDD)
- **Préparer des données de test** : un compte client et un compte admin créés en avance
- **Anticiper les questions** sur les choix techniques (pourquoi PHP vanilla ? pourquoi JWT maison ?)
- **Répartir la parole** équitablement entre les membres de l'équipe
- **Durée** : ~2 min par diapositive, garder du temps pour la démo et les questions
