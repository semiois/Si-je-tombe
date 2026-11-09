/* ==========================================================================
   CONFIGURATION CENTRALE — « Si je tombe, relève-toi ! »
   Tout ce qui reste à renseigner se trouve ICI. Une valeur à `null` (ou
   vide) signifie « information pas encore communiquée » : le site affiche
   alors un message neutre et n'invente rien.
   ========================================================================== */
window.SITE_CONFIG = {

  /* ---- Livre (données fournies par l'auteur / visibles sur la couverture) ---- */
  book: {
    title: "Si je tombe, relève-toi !",
    author: "Benicien Bouschedy",
    publisher: "Le Gabonais Éditions",
    genre: "Roman",
    isbn: "978-2-493721-00-5"
  },

  /* ---- Disponibilité ---- */
  availability: {
    label: "Au plus tard le 25 novembre 2026",
    country: "Gabon"
  },

  /* ---- Prix ---- (définitif)
     Le même prix est saisi côté serveur dans apps-script/Code.gs (PRIX_UNITAIRE) :
     c'est le serveur qui calcule le montant attendu. En cas de changement, modifier les deux. */
  price: {
    amount: 10000,
    currency: "FCFA",
    approxEur: 16.08         // équivalent indicatif affiché à côté du prix
  },

  /* ---- Conditions commerciales (définitives) ----
     Paiement intégral obligatoire par exemplaire, aucun acompte, aucun frais de livraison facturé. */
  commerce: {
    zone: "Tout le Gabon",
    paymentMode: "integral",
    pickupShort: "À votre charge",
    pickupNotice: "Vous organisez vous-même la récupération de vos exemplaires, en mandatant vos propres livreurs. Aucun frais de livraison n'est facturé ni calculé par ce site.",
    pickupPlace: null        // À COMPLÉTER : lieu / modalités de retrait (affiché « À communiquer » tant que null)
  },

  /* ---- Paiement manuel Airtel Money (aucune API, vérification manuelle) ---- */
  payment: {
    provider: "Airtel Money",
    number: "+241 77154415"
  },

  /* ---- Stockage des commandes ----
     URL de déploiement du Web App Google Apps Script (voir README.md).
     Tant qu'elle est vide, le formulaire affiche honnêtement que les
     précommandes ne sont pas encore ouvertes : aucune commande n'est simulée. */
  backend: {
    endpoint: "",
    timeoutMs: 25000
  },

  /* ---- Extraits (images promotionnelles fournies) ----
     Ajouter un objet par visuel, par exemple :
     { src: "assets/extraits/extrait-1.webp", thumb: "assets/extraits/extrait-1-600.webp",
       alt: "Extrait du roman — ...", title: "Extrait 1" }              */
  excerpts: [
    { src: "assets/img/Extrait-1.webp", thumb: "assets/img/Extrait-1-600.webp", w: 1100, h: 1561,
      alt: "Extrait 1 du roman : « Swana agonise sous le joug d'une dictature héréditaire et sanguinaire. »", title: "Extrait 1" },
    { src: "assets/img/Extrait-2.webp", thumb: "assets/img/Extrait-2-600.webp", w: 1100, h: 1561,
      alt: "Extrait 2 du roman : « Swana agonise sous le joug d'une dictature héréditaire et sanguinaire. »", title: "Extrait 2" },
    { src: "assets/img/Extrait-3.webp", thumb: "assets/img/Extrait-3-600.webp", w: 1100, h: 1561,
      alt: "Extrait 3 du roman : « Swana agonise sous le joug d'une dictature héréditaire et sanguinaire. »", title: "Extrait 3" }
  ],

  /* ---- Portrait de l'auteur (fourni) ---- */
  authorPortrait: {
    src: "assets/img/auteur.webp",
    alt: "Portrait de Benicien Bouschedy"
  },

  /* ---- Visuels du livre (fournis) — utilisés tels quels ---- */
  gallery: [
    { src: "assets/img/hero-livre.webp",  thumb: "assets/img/hero-livre-800.webp",
      alt: "Première et quatrième de couverture du roman Si je tombe, relève-toi !", title: "Première et quatrième de couverture", w: 1536, h: 1024 },
    { src: "assets/img/visuel-plat.webp", thumb: "assets/img/visuel-plat-800.webp",
      alt: "Quatrième de couverture, dos et première de couverture posés à plat", title: "Couverture complète", w: 1536, h: 1024 },
    { src: "assets/img/visuel-pile.webp", thumb: "assets/img/visuel-pile-800.webp",
      alt: "Cinq exemplaires du roman alignés sur une table", title: "Les exemplaires", w: 1312, h: 1199 }
  ],

  /* ---- Partage ---- */
  share: {
    text: "Je vous recommande de précommander « Si je tombe, relève-toi ! », le roman de Benicien Bouschedy (Le Gabonais Éditions)."
  },

  /* ---- Règles du formulaire ---- */
  form: { maxQuantity: 20 }
};
