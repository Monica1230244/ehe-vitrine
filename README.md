# EHE - Site vitrine et boutique

Site vitrine dynamique pour la marque EHE, avec catalogue produits, fiche produit, commande via WhatsApp, formulaire de contact et tableau de bord administrateur.

## Fonctionnalites

- Pages publiques : accueil, boutique, fiche produit, FAQ, notre histoire, contact.
- Catalogue dynamique depuis MySQL.
- Produits disponibles, indisponibles ou sur commande.
- Commande via WhatsApp avec enregistrement en base.
- Formulaire de contact relie au tableau de bord.
- Espace administrateur avec authentification, deconnexion et changement de mot de passe.
- Gestion des produits : ajout, modification, suppression/archive, upload image.
- Gestion des commandes et messages clients.
- Sauvegarde SQL depuis l'administration.

## Technologies

- HTML
- CSS
- JavaScript
- PHP
- MySQL

## Installation locale

1. Copier le dossier dans `C:\xampp\htdocs\ventes`.
2. Demarrer Apache et MySQL avec XAMPP.
3. Ouvrir `http://localhost/ventes/`.
4. Ouvrir l'administration avec `http://localhost/ventes/login.html`.

Compte admin initial :

- Email : `admin@ehe.local`
- Mot de passe : `admin123`

Changer ce mot de passe apres la premiere connexion.

## Deploiement Hostinger

Voir le fichier `DEPLOIEMENT_HOSTINGER.md`.

La configuration de production doit etre placee hors du dossier `public_html`, dans un fichier `ehe-config.php`, en se basant sur `hostinger-config.example.php`.

## Note GitHub

GitHub sert ici de sauvegarde et de suivi du code. GitHub Pages ne permet pas d'executer PHP/MySQL, donc la version complete avec administration et base de donnees doit etre hebergee sur Hostinger ou un hebergeur compatible PHP/MySQL.
