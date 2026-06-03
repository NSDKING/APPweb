# Document de Spécifications — ShoeBox

**Projet :** ShoeBox – Plateforme e-commerce de sneakers  
**Équipe :** APP Informatique 2025-2026 S2  
**Version :** 2.0 (mis à jour après RDV client — phase de spécification)  
**Date :** Juin 2026  

---

## 1. Contexte et objectifs du projet

### 1.1 Contexte

Le projet ShoeBox est né du besoin d'un client souhaitant créer une boutique en ligne spécialisée dans la vente de sneakers. Le marché des sneakers connaît une croissance importante, notamment auprès des jeunes adultes passionnés par la culture streetwear et la mode urbaine. Le client souhaite proposer une expérience d'achat moderne, simple et engageante, combinant une boutique en ligne classique et une dimension communautaire via un forum intégré.

### 1.2 Objectifs principaux

- Permettre aux clients de parcourir et d'acheter des sneakers en ligne
- Offrir un espace communautaire (forum) pour les passionnés
- Fournir un back-office complet aux administrateurs pour gérer le catalogue et les commandes
- Assurer un système de support client via un système de réclamations
- Mettre en place un système d'authentification sécurisé

### 1.3 Périmètre du projet

Le projet couvre :
- Le développement d'une interface web responsive (frontend)
- Le développement d'une API REST (backend)
- La conception et gestion d'une base de données relationnelle
- Le déploiement sur un serveur web local (phase de développement)

---

## 2. Acteurs du système

| Acteur | Description |
|--------|-------------|
| **Visiteur** | Utilisateur non connecté, peut consulter les produits |
| **Client** | Utilisateur inscrit et connecté, peut acheter et interagir |
| **Administrateur** | Gestionnaire du site avec accès complet au back-office |

---

## 3. Exigences fonctionnelles

### 3.1 Gestion des comptes utilisateurs

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F01 | Inscription avec nom, e-mail, mot de passe et adresse | Haute |
| F02 | Connexion par e-mail et mot de passe | Haute |
| F03 | Déconnexion | Haute |
| F04 | Réinitialisation du mot de passe par e-mail | Moyenne |
| F05 | Consultation et modification du profil | Moyenne |

### 3.2 Catalogue produits

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F06 | Affichage de la liste des produits | Haute |
| F07 | Filtrage par marque, genre, type et couleur | Haute |
| F08 | Recherche textuelle sur les produits | Haute |
| F09 | Affichage de la fiche détaillée d'un produit | Haute |
| F10 | Affichage du prix et du prix promotionnel | Moyenne |
| F11 | Affichage du stock disponible | Moyenne |

### 3.3 Panier et commandes

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F12 | Ajout d'un produit au panier | Haute |
| F13 | Modification de la quantité d'un article dans le panier | Haute |
| F14 | Suppression d'un article du panier | Haute |
| F15 | Passage de commande avec adresse de livraison | Haute |
| F16 | Confirmation de commande par e-mail | Moyenne |
| F17 | Consultation de l'historique des commandes | Moyenne |

### 3.4 Favoris

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F18 | Ajout d'un produit aux favoris | Moyenne |
| F19 | Suppression d'un produit des favoris | Moyenne |
| F20 | Affichage de la liste des favoris | Moyenne |

### 3.5 Forum communautaire

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F21 | Consultation des catégories et fils de discussion | Basse |
| F22 | Création d'un nouveau fil de discussion | Basse |
| F23 | Réponse à un fil de discussion existant | Basse |
| F24 | Like/réaction sur une publication | Basse |

### 3.6 Réclamations et support

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F25 | Soumission d'une réclamation (sujet, description, priorité) | Moyenne |
| F26 | Suivi du statut d'une réclamation | Moyenne |
| F27 | Réponse de l'administrateur à une réclamation | Moyenne |

### 3.7 Newsletter

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F28 | Inscription à la newsletter par e-mail | Basse |
| F29 | Désabonnement de la newsletter | Basse |

### 3.8 Administration

| ID | Fonctionnalité | Priorité |
|----|---------------|----------|
| F30 | Gestion du catalogue produits (CRUD) | Haute |
| F31 | Gestion des utilisateurs et des rôles | Haute |
| F32 | Gestion des commandes et des statuts de livraison | Haute |
| F33 | Gestion du carrousel de la page d'accueil | Moyenne |
| F34 | Traitement des réclamations clients | Moyenne |

---

## 4. Exigences non fonctionnelles

### 4.1 Sécurité

- Les mots de passe sont hachés avec l'algorithme **bcrypt**
- L'authentification repose sur des **tokens JWT** (JSON Web Token, HS256)
- Les routes protégées vérifient systématiquement la validité du token
- Les routes d'administration vérifient le rôle `admin` de l'utilisateur
- Les tokens de réinitialisation de mot de passe expirent après **1 heure**

### 4.2 Performance

- Chargement de la page d'accueil en moins de 3 secondes
- Réponse de l'API en moins de 500 ms pour les requêtes courantes
- Pagination des listes de produits pour limiter la charge

### 4.3 Compatibilité

- Compatible avec les navigateurs modernes : Chrome, Firefox, Edge, Safari
- Interface responsive adaptée aux mobiles, tablettes et ordinateurs de bureau

### 4.4 Disponibilité

- Le site doit être accessible 24h/24, 7j/7 en production

### 4.5 Maintenabilité

- Code organisé selon le patron MVC
- API REST documentée et versionnée
- Séparation claire entre frontend et backend

---

## 5. Cas d'utilisation principaux

### UC01 — S'inscrire

**Acteur :** Visiteur  
**Précondition :** L'utilisateur n'a pas de compte  
**Scénario nominal :**
1. L'utilisateur accède à la page d'inscription
2. Il saisit son nom, son e-mail, son adresse et son mot de passe
3. Il soumet le formulaire
4. Le système crée le compte et retourne un token JWT
5. L'utilisateur est redirigé vers la boutique

**Scénario alternatif :** L'e-mail est déjà utilisé → message d'erreur affiché

---

### UC02 — Passer une commande

**Acteur :** Client  
**Précondition :** L'utilisateur est connecté et a des articles dans son panier  
**Scénario nominal :**
1. L'utilisateur consulte son panier
2. Il accède à la page de commande
3. Il confirme son adresse de livraison
4. Il valide la commande
5. Le système enregistre la commande en base de données
6. Un e-mail de confirmation est envoyé
7. Le panier est vidé

---

### UC03 — Gérer le catalogue (Admin)

**Acteur :** Administrateur  
**Précondition :** L'administrateur est connecté  
**Scénario nominal :**
1. L'administrateur accède au tableau de bord
2. Il navigue vers la gestion des produits
3. Il peut créer, modifier ou supprimer un produit
4. Les modifications sont immédiatement visibles sur la boutique

---

## 6. Contraintes techniques

- **Langage backend :** PHP (sans framework tiers)
- **Base de données :** MySQL / MariaDB
- **Frontend :** HTML5, CSS3, JavaScript ES6+ (vanilla, sans framework)
- **Serveur web :** Apache (WAMP/LAMP) ou équivalent
- **Authentification :** JWT (implémentation maison)
- **Communication :** API RESTful JSON

---

## 7. Livrables prévus

| Livrable | Description |
|----------|-------------|
| Site web fonctionnel | Frontend + Backend déployés |
| Base de données | Script SQL d'initialisation (`shemas.sql`) |
| Document de spécifications | Ce document |
| Document de conception | Schémas BDD et architecture |
| Manuel utilisateur | Guide d'utilisation du site |
| Manuel de déploiement | Guide d'installation technique |
| Présentation PowerPoint | Support de soutenance |
