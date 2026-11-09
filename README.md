# « Si je tombe, relève-toi ! » — Plateforme de précommande

Site statique (HTML / CSS / JavaScript natif, sans dépendance) hébergé gratuitement sur **GitHub Pages**.
Les commandes sont enregistrées dans un **Google Sheets** privé par un **Google Apps Script** (gratuit) ;
les captures de paiement vont dans un dossier **Google Drive** privé.
Paiement : **Airtel Money uniquement, vérification manuelle** — aucune API Airtel n'est utilisée ni simulée.

```
index.html               page unique (hero, roman, extraits, auteur, précommande)
css/style.css            direction artistique (ivoire, rouge #AC0605, encre)
js/config.js             ⭐ informations commerciales et réglages (prix, zone, retrait, URL du backend…)
js/app.js                formulaire, parcours de paiement, suivi, galerie, partage
apps-script/Code.gs      backend à coller dans Google Apps Script (non publié sur GitHub)
assets/img/              visuels fournis (WebP), extraits, portrait
scripts/set-site-url.py  renseigne l'adresse publique (aperçus WhatsApp/Facebook, sitemap, robots)
tests/                   tests automatiques (non publiés sur GitHub)
```

## Informations commerciales appliquées

| | |
|---|---|
| Prix | 10 000 FCFA par exemplaire (≈ 16,08 €), calculé **côté serveur** |
| Paiement | Intégral obligatoire, aucun acompte, par Airtel Money au **+241 77154415** |
| Disponibilité | Au plus tard le 25 novembre 2026, dans tout le Gabon |
| Livraison | Aucune : le lecteur organise lui-même la récupération (ses propres livreurs). Aucun frais de livraison n'est calculé ni facturé. Cette règle est affichée avant la validation et doit être acceptée par une case à cocher. |
| Notifications | Une adresse e-mail d'administration (réglée dans `Code.gs`) reçoit un message à chaque commande et à chaque preuve de paiement |

## Le parcours, en deux niveaux

**Niveau 1 — automatique (rien à faire)**
1. Le lecteur remplit le formulaire et accepte les conditions → ligne créée dans la feuille, **référence unique** `SJT-AAMMJJ-XXXXXX`, montant calculé par le serveur, statuts **Commande créée** / **Paiement en attente**, e-mail à l'administrateur.
2. Le lecteur paie par Airtel Money, puis envoie la référence de sa transaction (+ capture facultative, stockée en privé) → statut **Paiement à vérifier**, e-mail à l'administrateur.

**Niveau 2 — vous (aucun paiement n'est jamais confirmé automatiquement)**
3. Vous vérifiez dans **votre application Airtel Money** que le transfert est bien arrivé (montant + référence).
4. Dans la feuille « Commandes », vous passez `statut_paiement` à **Paiement confirmé** (liste déroulante, ou menu **Précommandes SJT → Confirmer le paiement**). Automatiquement : `statut_commande` devient **Commande validée** et `date_confirmation` est enregistrée.
5. Le lecteur voit le nouvel état en cliquant sur « Vérifier l'état de ma commande » ou « Suivre une commande existante » (référence + téléphone).

Seul le propriétaire de la feuille peut modifier les colonnes de statut (elles sont protégées) ; le Web App public ne contient aucune action capable d'écrire « Paiement confirmé ».

## 1. Mettre en place Google Sheets + Apps Script (≈ 10 minutes)

1. Connectez-vous au compte Google qui sera l'**administrateur** (celui dont l'e-mail est dans `Code.gs`), puis créez un Google Sheets vide nommé « Précommandes SJT ». Ne le partagez avec personne.
2. Menu **Extensions → Apps Script**. Supprimez le code par défaut, collez **tout** le contenu de `apps-script/Code.gs`, cliquez sur 💾 *Enregistrer*.
3. Vérifiez en haut du fichier `CONFIG` : `PRIX_UNITAIRE: 10000` et `ADMIN_EMAIL` (déjà renseignés).
4. Dans la barre d'outils, choisissez la fonction **`setup`** puis ▶ **Exécuter**. Google demande des autorisations (feuille, Drive pour les captures, envoi d'e-mails) : *Examiner les autorisations* → votre compte → *Paramètres avancés* → *Accéder à … (non sécurisé)* → *Autoriser*. (Cet écran est normal pour un script personnel non publié.) La feuille « Commandes » est créée avec ses colonnes, formats texte, listes déroulantes et protections.
5. **Déployer → Nouveau déploiement → ⚙ Application Web** : *Exécuter en tant que* **Moi** ; *Qui a accès* **Tout le monde** ; *Déployer*. Copiez l'**URL de l'application Web** (elle se termine par `/exec`).
6. Ouvrez `js/config.js` et collez cette URL dans `backend.endpoint` : `endpoint: "https://script.google.com/macros/s/…/exec"`.
7. Vérification : ouvrez cette URL dans un navigateur → vous devez voir `{"ok":true,"service":"sjt-precommandes"}`.

> Après **toute** modification de `Code.gs`, refaites **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer**. Sans cela, l'ancienne version reste en ligne. L'URL ne change pas.

« Tout le monde » signifie seulement que le site peut appeler le script ; la feuille, le dossier Drive et les e-mails restent privés. Le script ne renvoie que le statut d'une commande à qui fournit la référence **et** le téléphone (8 essais ratés bloquent le numéro 15 minutes).

## 2. Gérer les commandes au quotidien

Colonnes : référence, date, nom, téléphone, ville, quantité, remarque de retrait, prix unitaire, **montant attendu**, statuts, référence de transaction Airtel, date de la preuve, **lien de la capture** (privé, ouvrable avec votre compte), notes admin (libre), date de confirmation.

| Étape | `statut_commande` | `statut_paiement` | Qui |
|---|---|---|---|
| Formulaire envoyé | Commande créée | Paiement en attente | automatique |
| Preuve envoyée | Commande créée | Paiement à vérifier | automatique |
| Transfert vérifié dans Airtel Money | **Commande validée** (auto) | **Paiement confirmé** | **vous** |

- Rapprochement : comparez le **montant attendu** et la **référence de transaction** de la ligne avec l'historique de votre compte Airtel Money.
- Une commande ne peut pas être « validée » sans paiement confirmé : le script la remet aussitôt à « créée ».
- Si vous vous trompez, remettez le paiement à « à vérifier » : la commande repasse à « créée » et la date est effacée.
- La confirmation par la liste déroulante fonctionne dans le navigateur **et** dans l'application mobile Google Sheets. Si vous modifiez la feuille par un script, utilisez le menu.

## 3. Compléter les informations restantes

Dans **`js/config.js`** :
- `commerce.pickupPlace` : **lieu / modalités de retrait des exemplaires** — *non communiqué à ce jour* : le site affiche « À communiquer » tant que cette valeur est `null`. À renseigner avant la mise en ligne (ex. `"Libreville, … (adresse précise)"`).
- Si le prix change : modifiez-le **aux deux endroits** (`price.amount` dans `config.js` **et** `PRIX_UNITAIRE` dans `Code.gs`, puis nouveau déploiement). Le montant réellement attendu est toujours celui du serveur.
- Extraits : déposez l'image dans `assets/img/` (WebP ~1100 px + miniature ~600 px) et ajoutez-la à `excerpts`.

## 4. Publier sur GitHub Pages

Le dépôt est déjà créé. Le dossier `apps-script/` et `tests/` sont dans `.gitignore` : ils contiennent l'e-mail d'administration et n'ont pas à être publiés (le script vit dans Google).

1. Décompressez le zip, puis envoyez le contenu du dossier dans votre dépôt (glisser-déposer via *Add file → Upload files* sur github.com, ou `git add . && git commit && git push`). Vérifiez que `index.html` est **à la racine** du dépôt.
2. Dépôt → **Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : `main` / `(root)` → Save**. Après 1 à 2 minutes, l'adresse s'affiche en haut de la page : `https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT/`.
3. En local, lancez **une fois** : `python3 scripts/set-site-url.py https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT` (sans slash final), puis envoyez à nouveau `index.html`, `robots.txt`, `sitemap.xml` et le fichier `.site-url` vers le dépôt. Cela fixe les adresses des aperçus WhatsApp/Facebook (obligatoirement absolues et en https). `python3 scripts/set-site-url.py --check` vérifie la cohérence. Tous les chemins du site sont relatifs : il fonctionne dans un sous-dossier de dépôt sans autre réglage.
4. Testez l'aperçu : collez le lien dans WhatsApp (à vous-même) ; sur Facebook, utilisez le *Sharing Debugger*. Les aperçus sont mis en cache : ajoutez `?v=2` au lien après un changement.

## 5. Essai réel obligatoire avant d'annoncer le site

Les tests automatiques simulent Google ; ils ne remplacent pas un essai réel (compte Google requis, donc à faire par vous) :
1. Sur le site publié, passez **une commande de test** (1 exemplaire) avec votre propre numéro → vous devez recevoir la référence, voir la ligne dans la feuille et recevoir l'e-mail.
2. Envoyez une preuve (référence quelconque + une capture) → statut « Paiement à vérifier », e-mail reçu, fichier visible dans Drive → « SJT - Preuves de paiement ».
3. Passez `statut_paiement` à « Paiement confirmé » → la commande doit passer à « Commande validée » avec une date ; sur le site, « Suivre une commande existante » doit l'afficher.
4. Vérifiez que le dossier Drive n'est pas partagé et que la feuille l'est avec personne, puis **supprimez les lignes et fichiers de test**.
Si l'une de ces étapes échoue, ne lancez pas la campagne et signalez-le.

## 6. Tests automatiques

`bash tests/run-tests.sh` (≈ 6 à 8 minutes ; Node 20+, Python 3, Playwright/Chromium) :
- **31 tests backend** : le vrai `Code.gs` exécuté dans un bac à sable avec des doubles des services Google.
- **227 contrôles navigateur** (Chromium) : parcours complet, sécurité côté navigateur, erreurs réseau et doubles clics, 18 tailles d'écran (petits Android, iPhone, tablettes, paysage, portable, Full HD, grand écran).
- **26 contrôles « GitHub Pages »** : site servi sous un sous-dossier, `set-site-url.py`, balises d'aperçu.

**Limites** : Google est simulé ; le navigateur est Chromium (émulation d'iPhone/Android, pas Safari ni de vrais téléphones) ; aucun déploiement réel n'a été effectué ; l'aperçu WhatsApp/Facebook n'est vérifiable qu'une fois le site en ligne.

## Notes
- Polices : Fraunces + Manrope via Google Fonts (repli sur Georgia/système si indisponibles).
- Visuels : fournis par l'auteur, utilisés tels quels (conversion WebP + redimensionnement). Sur mobile, la couverture est un recadrage du visuel « livres debout ».
- Le numéro Airtel Money est public par nature (il doit être affiché aux acheteurs).
- Quotas gratuits : largement suffisants pour une campagne de deux mois ; l'envoi d'e-mails est limité à ~100/jour sur un compte Google gratuit.
- Données personnelles : le navigateur du lecteur garde sa dernière commande (nom, téléphone) 45 jours pour lui permettre de la retrouver ; « Faire une autre commande » l'efface.
