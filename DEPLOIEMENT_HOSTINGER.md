# Deploiement EHE sur Hostinger

## 1. Preparer Hostinger

1. Ouvrir hPanel Hostinger.
2. Creer ou connecter le domaine.
3. Aller dans **Bases de donnees MySQL**.
4. Creer une base, un utilisateur et un mot de passe.
5. Noter les informations MySQL.

## 2. Envoyer les fichiers

Envoyer le contenu du dossier `public_html` du paquet dans le dossier `public_html` de Hostinger.

Ne pas envoyer les sauvegardes locales inutiles en production.

## 3. Configuration hors public_html

Copier `hostinger-config.example.php` un niveau au-dessus de `public_html`, puis le renommer :

```text
ehe-config.php
```

Exemple :

```text
/home/u123456789/ehe-config.php
/home/u123456789/domains/votre-domaine.com/public_html/
```

Remplir les vraies valeurs :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_ehe_store');
define('DB_USER', 'u123456789_ehe_user');
define('DB_PASS', 'mot_de_passe');
```

## 4. Importer la base

1. Ouvrir phpMyAdmin sur Hostinger.
2. Choisir la base EHE.
3. Importer un fichier de sauvegarde SQL cree depuis l'admin local, ou laisser le site creer les tables automatiquement au premier chargement.

## 5. Securite

1. Activer SSL dans hPanel.
2. Forcer HTTPS si Hostinger le propose.
3. Se connecter a `/login.html`.
4. Changer le mot de passe admin dans `Securite`.
5. Supprimer ou transformer les produits de test.

## 6. Tests apres mise en ligne

- Accueil charge les produits.
- Recherche et categorie fonctionnent.
- Fiche produit fonctionne.
- Panier et WhatsApp fonctionnent.
- Formulaire contact arrive dans l'admin.
- Ajout produit + image fonctionne.
- Changement statut commande fonctionne.
- Sauvegarde SQL fonctionne.
