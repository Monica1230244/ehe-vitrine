# Guide d'utilisation et de deploiement - Site EHE

Ce guide explique comment utiliser, tester et mettre en ligne le site EHE.

Le site est fonctionnel en local avec XAMPP. La version complete avec administration, base de donnees, messages clients, commandes WhatsApp et upload d'images doit etre hebergee sur un serveur compatible PHP/MySQL, par exemple Hostinger.

## 1. Liens importants

- Depot GitHub : https://github.com/Monica1230244/ehe-vitrine
- Site local : http://localhost/ventes/
- Connexion admin locale : http://localhost/ventes/login.html
- Futur hebergement : Hostinger

## 2. Fonctionnalites disponibles

### Cote client

- Page d'accueil professionnelle.
- Boutique dynamique.
- Recherche de produits.
- Filtre par categorie.
- Pagination des produits.
- Fiche produit detaillee.
- Choix de pointure et couleur.
- Produits disponibles, indisponibles ou sur commande.
- Panier.
- Commande via WhatsApp.
- Formulaire de contact.
- Pages FAQ, Notre histoire et Contact.

### Cote administrateur

- Connexion securisee.
- Deconnexion.
- Changement de mot de passe.
- Ajout de produit.
- Modification de produit.
- Suppression/archive de produit.
- Importation d'image produit.
- Gestion du stock global.
- Gestion des tailles et couleurs.
- Gestion du statut : disponible, sur commande, indisponible.
- Consultation des commandes.
- Changement de statut de commande.
- Consultation des messages clients.
- Sauvegarde SQL de la base de donnees.

## 3. Utilisation en local avec XAMPP

### 3.1 Demarrer le serveur local

1. Ouvrir XAMPP.
2. Demarrer Apache.
3. Demarrer MySQL.
4. Verifier que le dossier du site se trouve ici :

```text
C:\xampp\htdocs\ventes
```

5. Ouvrir le site :

```text
http://localhost/ventes/
```

### 3.2 Acceder au tableau de bord admin

Ouvrir :

```text
http://localhost/ventes/login.html
```

Identifiants initiaux :

```text
Email : admin@ehe.local
Mot de passe : admin123
```

Important : changer ce mot de passe apres la premiere connexion.

## 4. Utilisation de l'administration

### 4.1 Ajouter un produit

1. Se connecter a l'administration.
2. Aller dans la section Produits.
3. Remplir le nom du produit.
4. Ajouter la description.
5. Mettre le prix.
6. Choisir ou saisir la categorie.
7. Indiquer le stock.
8. Ajouter les pointures disponibles.
9. Ajouter les couleurs disponibles.
10. Choisir le statut :
    - Disponible
    - Sur commande
    - Indisponible
11. Importer une image du produit.
12. Enregistrer.

### 4.2 Modifier un produit

1. Cliquer sur Modifier.
2. Changer les informations necessaires.
3. Ajouter une nouvelle image si besoin.
4. Enregistrer.

### 4.3 Supprimer ou archiver un produit

1. Cliquer sur Supprimer.
2. Confirmer l'action.
3. Le produit ne doit plus apparaitre dans la boutique publique.

### 4.4 Gerer les commandes

1. Aller dans la section Commandes.
2. Ouvrir les details de la commande.
3. Verifier les produits, quantites, pointures et couleurs.
4. Changer le statut si necessaire :
    - En attente
    - Confirmee
    - Preparation
    - Livree
    - Annulee

### 4.5 Lire les messages clients

1. Aller dans la section Messages.
2. Lire les messages envoyes depuis le formulaire de contact.
3. Repondre au client par telephone, email ou WhatsApp selon les informations fournies.

### 4.6 Changer le mot de passe admin

1. Aller dans la section Securite.
2. Entrer l'ancien mot de passe.
3. Entrer le nouveau mot de passe.
4. Confirmer le nouveau mot de passe.
5. Enregistrer.

### 4.7 Creer une sauvegarde SQL

1. Aller dans la section Securite.
2. Cliquer sur Creer une sauvegarde.
3. Le fichier SQL sera cree dans le dossier `backups`.

## 5. Tests avant mise en ligne

Avant de publier le site, verifier :

- La page d'accueil s'ouvre correctement.
- Les produits s'affichent depuis la base de donnees.
- La recherche fonctionne.
- Le filtre par categorie fonctionne.
- La pagination fonctionne.
- La fiche produit s'ouvre.
- Les tailles et couleurs s'affichent.
- Le bouton WhatsApp fonctionne.
- Une commande apparait dans l'administration.
- Le formulaire de contact enregistre un message.
- Le message apparait dans l'administration.
- L'admin peut ajouter un produit avec image.
- L'admin peut modifier un produit.
- L'admin peut supprimer ou archiver un produit.
- L'admin peut changer le statut d'une commande.
- L'admin peut changer son mot de passe.
- Les pages FAQ, Notre histoire et Contact s'affichent.
- Le site est lisible sur telephone.

## 6. Deploiement sur Hostinger

### 6.1 Acheter ou activer l'hebergement

1. Acheter le plan Hostinger Business.
2. Choisir ou connecter le nom de domaine.
3. Activer SSL/HTTPS.

### 6.2 Creer la base de donnees

Dans hPanel Hostinger :

1. Aller dans Bases de donnees MySQL.
2. Creer une base de donnees.
3. Creer un utilisateur MySQL.
4. Noter :
    - le nom de la base ;
    - le nom utilisateur ;
    - le mot de passe ;
    - l'hote MySQL.

### 6.3 Envoyer les fichiers

Envoyer le contenu du site dans :

```text
public_html
```

Ne pas envoyer les fichiers inutiles suivants :

- sauvegardes locales SQL inutiles ;
- fichiers temporaires ;
- vrais fichiers de configuration contenant des mots de passe.

### 6.4 Configurer la base en production

Copier le fichier :

```text
hostinger-config.example.php
```

Le placer un niveau au-dessus de `public_html`, puis le renommer :

```text
ehe-config.php
```

Exemple :

```text
/home/u123456789/ehe-config.php
/home/u123456789/domains/votre-domaine.com/public_html/
```

Remplir les vraies informations MySQL :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'nom_de_la_base');
define('DB_USER', 'nom_utilisateur');
define('DB_PASS', 'mot_de_passe_mysql');
```

### 6.5 Importer la base

Deux options sont possibles :

1. Importer le fichier SQL depuis phpMyAdmin.
2. Laisser le site creer automatiquement les tables au premier chargement, puis ajouter les produits depuis l'administration.

### 6.6 Changer le mot de passe admin

Apres la premiere connexion en ligne :

1. Aller sur `/login.html`.
2. Se connecter avec les identifiants initiaux.
3. Changer le mot de passe dans la section Securite.

## 7. Securite

Apres mise en ligne :

- Activer HTTPS.
- Changer le mot de passe admin.
- Ne jamais publier `ehe-config.php`.
- Ne jamais publier les sauvegardes SQL.
- Utiliser un mot de passe fort.
- Faire des sauvegardes regulieres.
- Garder le depot GitHub propre.

## 8. GitHub

Le depot GitHub sert a sauvegarder et suivre le code :

```text
https://github.com/Monica1230244/ehe-vitrine
```

Important : GitHub Pages ne permet pas d'executer PHP/MySQL. Le lien GitHub permet de voir le code, mais pas d'utiliser completement le site dynamique.

Pour voir le vrai site fonctionnel, utiliser :

- XAMPP en local ;
- Hostinger en production.

## 9. Limites actuelles

- Le paiement en ligne n'est pas encore integre.
- La livraison automatisee n'est pas encore integree.
- Le stock par pointure/couleur peut etre ameliore dans une future version.
- GitHub Pages ne peut pas faire fonctionner l'administration PHP/MySQL.

## 10. Conclusion

Le site EHE est pret pour une utilisation locale et pour une preparation de mise en ligne sur Hostinger. Avant publication officielle, il faut finaliser l'hebergement, configurer la base de donnees Hostinger, activer HTTPS, changer le mot de passe admin et refaire les tests finaux en ligne.
