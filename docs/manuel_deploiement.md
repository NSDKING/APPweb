# Manuel de Déploiement — ShoeBox

**Projet :** ShoeBox – Plateforme e-commerce de sneakers  
**Équipe :** APP Informatique 2025-2026 S2  
**Version :** 1.0  
**Date :** Juin 2026  
**Public cible :** Administrateur technique / Responsable de déploiement

---

## 1. Vue d'ensemble

ShoeBox est une application web composée de :
- Un **frontend** statique (HTML/CSS/JS) servi directement par Apache
- Un **backend** en PHP exposant une API REST
- Une **base de données** MySQL (schéma : `shoesboxdb`)

---

## 2. Prérequis techniques

### 2.1 Logiciels nécessaires

| Logiciel | Version minimale | Rôle |
|----------|-----------------|------|
| **Apache** | 2.4+ | Serveur web |
| **PHP** | 8.1+ | Langage backend |
| **MySQL** | 8.0+ ou MariaDB 10.6+ | Base de données |
| **Git** | 2.x | Récupération du code source |

### 2.2 Extensions PHP requises

Les extensions PHP suivantes doivent être activées :

- `pdo` — Accès base de données
- `pdo_mysql` — Driver MySQL pour PDO
- `mbstring` — Gestion des chaînes multi-octets
- `json` — Encodage/décodage JSON
- `openssl` — Cryptographie (JWT)
- `mail` ou **SMTP** — Envoi d'e-mails (optionnel)

### 2.3 Vérifier les extensions

```bash
php -m | grep -E "pdo|mbstring|json|openssl"
```

### 2.4 Environnement recommandé (développement local)

Pour Windows : **WampServer** (https://www.wampserver.com) ou **XAMPP**  
Pour Linux/macOS : **LAMP** (Apache + MySQL + PHP)

---

## 3. Installation

### Étape 1 — Récupérer le code source

```bash
git clone https://github.com/NSDKING/APPweb.git
cd APPweb
```

Ou téléchargez l'archive ZIP depuis GitHub et décompressez-la dans le répertoire de votre serveur web.

**Avec WampServer :** Placez le dossier dans `C:\wamp64\www\APPweb\`  
**Avec LAMP :** Placez le dossier dans `/var/www/html/APPweb/`

### Étape 2 — Créer la base de données

1. Démarrez votre serveur MySQL
2. Connectez-vous à phpMyAdmin (`http://localhost/phpmyadmin`) ou en ligne de commande :

```bash
mysql -u root -p
```

3. Créez la base de données :

```sql
CREATE DATABASE shoesboxdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Sélectionnez la base de données :

```sql
USE shoesboxdb;
```

5. Importez le schéma SQL :

```bash
mysql -u root -p shoesboxdb < shemas.sql
```

Ou via phpMyAdmin :
- Sélectionnez `shoesboxdb`
- Onglet **"Importer"**
- Sélectionnez le fichier `shemas.sql`
- Cliquez sur **"Exécuter"**

### Étape 3 — Configurer les variables d'environnement

Créez le fichier `backend/.env` en copiant le modèle :

```bash
cp backend/.env.example backend/.env
```

Si le fichier `.env.example` n'existe pas, créez `backend/.env` manuellement avec le contenu suivant :

```env
# Base de données
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=shoesboxdb
DB_USER=root
DB_PASS=

# Authentification JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
JWT_EXPIRY=86400

# Application
APP_URL=http://localhost
APP_ENV=production
```

> **Important :** Remplacez `JWT_SECRET` par une chaîne aléatoire longue et unique (minimum 32 caractères). Ne partagez jamais ce secret.

> **Pour WampServer :** Si votre MySQL a un mot de passe root, renseignez-le dans `DB_PASS`.

### Étape 4 — Configurer Apache (mod_rewrite)

Le backend utilise un point d'entrée unique (`index.php`) et nécessite la réécriture d'URL.

**Vérifier que mod_rewrite est activé :**
- WampServer : clic droit sur l'icône → Apache → Modules Apache → cocher `rewrite_module`
- LAMP : `sudo a2enmod rewrite && sudo service apache2 restart`

**Créer ou vérifier le fichier `backend/public/.htaccess` :**

```apache
Options -Indexes
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

**Configurer le VirtualHost Apache (optionnel mais recommandé) :**

```apache
<VirtualHost *:80>
    ServerName shoebox.local
    DocumentRoot "C:/wamp64/www/APPweb/frontend"

    Alias /api "C:/wamp64/www/APPweb/backend/public"
    <Directory "C:/wamp64/www/APPweb/backend/public">
        AllowOverride All
        Require all granted
    </Directory>

    <Directory "C:/wamp64/www/APPweb/frontend">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Ajoutez `127.0.0.1 shoebox.local` dans votre fichier `hosts` :
- Windows : `C:\Windows\System32\drivers\etc\hosts`
- Linux/macOS : `/etc/hosts`

### Étape 5 — Vérifier les permissions

**Linux/macOS :** Les dossiers de stockage doivent être accessibles en écriture par Apache :

```bash
chmod -R 755 backend/storage/
chown -R www-data:www-data backend/storage/
```

**Windows :** Vérifiez que Apache peut écrire dans le dossier `backend/storage/`.

### Étape 6 — Vérifier l'installation

1. Démarrez Apache et MySQL
2. Ouvrez votre navigateur et accédez à `http://localhost/APPweb/frontend/`
3. La page d'accueil de ShoeBox doit s'afficher
4. Vérifiez l'API : `http://localhost/APPweb/backend/public/api/ping`  
   Réponse attendue : `{ "success": true, "message": "pong" }`

---

## 4. Créer le premier compte administrateur

Après l'installation, créez un compte via l'interface puis accordez-lui le rôle admin directement en base :

```sql
UPDATE Users SET role = 'admin' WHERE email = 'votre@email.com';
```

Ou depuis phpMyAdmin :
1. Ouvrez la table `Users`
2. Trouvez votre utilisateur
3. Cliquez sur "Modifier"
4. Changez `role` de `customer` à `admin`
5. Sauvegardez

---

## 5. Configuration CORS

Par défaut, les requêtes cross-origin sont autorisées depuis `localhost`. En production, modifiez le middleware CORS dans `backend/public/index.php` :

```php
header("Access-Control-Allow-Origin: https://votre-domaine.com");
```

---

## 6. Mise en production

### 6.1 Recommandations de sécurité

- [ ] Changer le `JWT_SECRET` dans `.env` (jamais le laisser à la valeur par défaut)
- [ ] Désactiver `APP_ENV=development` → passer à `APP_ENV=production`
- [ ] Utiliser un utilisateur MySQL dédié (ne pas utiliser `root` en production)
- [ ] Activer HTTPS (certificat SSL/TLS)
- [ ] Restreindre l'accès à phpMyAdmin
- [ ] Supprimer le fichier `.env.example` du serveur

### 6.2 Utilisateur MySQL dédié

```sql
CREATE USER 'shoebox_user'@'localhost' IDENTIFIED BY 'motdepasse_fort';
GRANT SELECT, INSERT, UPDATE, DELETE ON shoesboxdb.* TO 'shoebox_user'@'localhost';
FLUSH PRIVILEGES;
```

Mettez à jour `.env` :
```env
DB_USER=shoebox_user
DB_PASS=motdepasse_fort
```

### 6.3 HTTPS (serveur de production)

Avec **Certbot** (Let's Encrypt) sur un serveur Linux :

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d votre-domaine.com
```

---

## 7. Structure des fichiers de configuration

| Fichier | Rôle | Modifier en prod ? |
|---------|------|--------------------|
| `backend/.env` | Variables d'environnement (BDD, JWT, URL) | **Oui** (obligatoire) |
| `backend/config/database.php` | Lecture du `.env` pour la connexion PDO | Non |
| `backend/config/app.php` | Paramètres applicatifs globaux | Optionnel |
| `backend/public/.htaccess` | Réécriture d'URL Apache | Non |
| `frontend/assets/js/api.js` | URL de base de l'API frontend | Oui si domaine change |

---

## 8. Identifiants par défaut

| Élément | Valeur par défaut |
|---------|------------------|
| Utilisateur MySQL | `root` |
| Mot de passe MySQL | *(vide avec WampServer)* |
| Base de données | `shoesboxdb` |
| JWT_SECRET | À définir dans `.env` |
| Compte admin | Créer manuellement via SQL |

---

## 9. Résolution des problèmes courants

### Erreur 404 sur les routes API

**Cause :** mod_rewrite non activé ou `.htaccess` absent  
**Solution :** Activer `mod_rewrite` et vérifier la présence de `.htaccess`

### Erreur de connexion à la base de données

**Cause :** Paramètres `.env` incorrects  
**Solution :** Vérifier `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`

### Erreur CORS (bloqué par le navigateur)

**Cause :** L'URL du frontend ne correspond pas à celle autorisée  
**Solution :** Mettre à jour `Access-Control-Allow-Origin` dans `index.php`

### Page blanche sans message d'erreur

**Cause :** Erreur PHP non affichée  
**Solution :** Temporairement, ajouter en haut de `index.php` :
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```
> Désactivez ces lignes après diagnostic en production.

### Les e-mails ne sont pas envoyés

**Cause :** Configuration `mail()` PHP absente ou serveur SMTP non configuré  
**Solution :** Configurer un serveur SMTP dans `php.ini` ou utiliser une bibliothèque comme PHPMailer

---

## 10. Sauvegarde et restauration

### Sauvegarder la base de données

```bash
mysqldump -u root -p shoesboxdb > backup_shoesboxdb_$(date +%Y%m%d).sql
```

### Restaurer la base de données

```bash
mysql -u root -p shoesboxdb < backup_shoesboxdb_YYYYMMDD.sql
```

---

## 11. Résumé des étapes d'installation

```
1. Cloner le dépôt GitHub
2. Créer la BDD shoesboxdb et importer shemas.sql
3. Créer backend/.env avec les paramètres de BDD et JWT
4. Activer mod_rewrite dans Apache
5. Configurer les permissions du dossier storage/
6. Démarrer Apache + MySQL
7. Vérifier http://localhost/APPweb/frontend/
8. Créer le premier compte admin via SQL
```
