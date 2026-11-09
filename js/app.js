/* ==========================================================================
   « Si je tombe, relève-toi ! » — comportement du site
   Aucune dépendance. Lit la configuration dans js/config.js.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var STORE_KEY = 'sjt_order_v1';

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  function money(n) {
    try { return new Intl.NumberFormat('fr-FR').format(n) + ' ' + cfg.price.currency; }
    catch (e) { return n + ' ' + cfg.price.currency; }
  }
  function hasPrice() { return typeof cfg.price.amount === 'number' && cfg.price.amount > 0; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function cleanPhone(s) {
    s = String(s || '').trim();
    var plus = s.charAt(0) === '+';
    return (plus ? '+' : '') + digits(s);
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var t = el('textarea', { 'aria-hidden': 'true' });
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(t);
    });
  }
  function flash(btn, msg) {
    var old = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = old; }, 1800);
  }

  /* ------------------------------------------------------------------ */
  /* Habillage : informations issues de la configuration                 */
  /* ------------------------------------------------------------------ */
  function lowerFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function termsList() {
    var c = cfg.commerce, t = [];
    t.push(hasPrice()
      ? 'Prix : ' + money(cfg.price.amount) + ' par exemplaire' + (cfg.price.approxEur ? ' (≈ ' + String(cfg.price.approxEur.toFixed(2)).replace('.', ',') + '\u00a0€)' : '') + '.'
      : 'Prix : à communiquer.');
    t.push('Paiement intégral obligatoire par ' + cfg.payment.provider + ' au ' + cfg.payment.number +
      (hasPrice() ? ', soit ' + money(cfg.price.amount) + ' par exemplaire' : '') + '. Aucun paiement partiel ni acompte.');
    t.push('Disponibilité : ' + lowerFirst(cfg.availability.label) + ', dans ' + lowerFirst(c.zone) + '.');
    t.push(c.pickupNotice + (c.pickupPlace ? ' Lieu de retrait : ' + c.pickupPlace + '.' : ''));
    t.push('Votre commande n\'est validée qu\'après vérification manuelle de votre paiement par l\'éditeur : l\'envoi d\'une capture d\'écran ne vaut pas confirmation.');
    return t;
  }

  function bindConfig() {
    $$('[data-bind="availability"]').forEach(function (n) { n.textContent = cfg.availability.label; });
    $('#price-display').textContent = hasPrice()
      ? money(cfg.price.amount) + (cfg.price.approxEur ? ' (≈ ' + String(cfg.price.approxEur.toFixed(2)).replace('.', ',') + '\u00a0€)' : '')
      : 'À communiquer';
    $$('[data-bind="price"]').forEach(function (n) { n.textContent = hasPrice() ? money(cfg.price.amount) : 'À communiquer'; });
    $$('[data-bind="zone"]').forEach(function (n) { n.textContent = cfg.commerce.zone; });
    $$('[data-bind="pickup"]').forEach(function (n) { n.textContent = cfg.commerce.pickupShort; });
    $$('[data-bind="pickupPlace"]').forEach(function (n) { n.textContent = cfg.commerce.pickupPlace || 'À communiquer'; });
    $$('[data-bind="pickupHint"]').forEach(function (n) { n.textContent = cfg.commerce.pickupNotice; });
    var ul = $('#terms-list');
    termsList().forEach(function (t) { ul.appendChild(el('li', { text: t })); });
    $('#airtel-number').textContent = cfg.payment.number;
    var q = $('#f-qty'); q.max = cfg.form.maxQuantity;
  }

  /* ------------------------------------------------------------------ */
  /* Navigation, en-tête, révélations                                    */
  /* ------------------------------------------------------------------ */
  function initChrome() {
    var header = $('.site-header');
    function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    var burger = $('#burger'), nav = $('#nav');
    function setMenu(open) {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    }
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      $$('.reveal').forEach(function (n) { io.observe(n); });

      // CTA collant mobile : visible dès que les boutons du hero sont hors écran, caché sur la section précommande
      var vis = { hero: true, pre: false };
      var sticky = $('#sticky-cta');
      function upd() { sticky.classList.toggle('show', !vis.hero && !vis.pre); }
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { vis[e.target.id === 'precommande' ? 'pre' : 'hero'] = e.isIntersecting; });
        upd();
      }, { threshold: 0.05 });
      io2.observe($('.hero-actions')); io2.observe($('#precommande'));
    } else {
      $$('.reveal').forEach(function (n) { n.classList.add('in'); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Galeries + visionneuse                                              */
  /* ------------------------------------------------------------------ */
  var lb = { list: [], i: 0 };
  function buildGallery(container, items) {
    items.forEach(function (it, idx) {
      var img = el('img', { src: it.thumb || it.src, alt: it.alt || '', loading: 'lazy', decoding: 'async' });
      if (it.w && it.h) { img.setAttribute('width', it.w); img.setAttribute('height', it.h); }
      var b = el('button', { type: 'button', 'class': 'g-item reveal', role: 'listitem', 'aria-label': 'Agrandir : ' + (it.title || it.alt || 'image') }, [img]);
      if (it.title) b.appendChild(el('span', { 'class': 'g-cap', text: it.title }));
      b.style.setProperty('--d', (idx * 0.08) + 's');
      if (it.w && it.h) { b.style.setProperty('--ar', it.w + '/' + it.h); b.style.setProperty('--r', (it.w / it.h).toFixed(3)); }
      b.addEventListener('click', function () { openLb(items, idx); });
      container.appendChild(b);
    });
  }
  function openLb(list, i) {
    lb.list = list; lb.i = i; showLb();
    var d = $('#lightbox');
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  }
  function showLb() {
    var it = lb.list[lb.i];
    var img = $('#lb-img');
    img.src = it.src; img.alt = it.alt || '';
    $('#lb-cap').textContent = it.title || '';
    var multi = lb.list.length > 1;
    $('#lb-prev').hidden = !multi; $('#lb-next').hidden = !multi;
  }
  function stepLb(n) { lb.i = (lb.i + n + lb.list.length) % lb.list.length; showLb(); }
  function initGalleries() {
    buildGallery($('#gallery-book'), cfg.gallery);
    var ex = $('#gallery-excerpts');
    if (cfg.excerpts && cfg.excerpts.length) {
      buildGallery(ex, cfg.excerpts);
    } else {
      [1, 2, 3].forEach(function (n) {
        ex.appendChild(el('div', { 'class': 'ex-placeholder reveal', role: 'listitem' }, [
          el('b', { text: 'Extrait ' + n }), el('span', { text: 'Bientôt disponible' })
        ]));
      });
    }
    var d = $('#lightbox');
    $('#lb-close').addEventListener('click', function () { d.close ? d.close() : d.removeAttribute('open'); });
    $('#lb-prev').addEventListener('click', function () { stepLb(-1); });
    $('#lb-next').addEventListener('click', function () { stepLb(1); });
    d.addEventListener('click', function (e) { if (e.target === d) { d.close ? d.close() : d.removeAttribute('open'); } });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') stepLb(-1);
      if (e.key === 'ArrowRight') stepLb(1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Auteur                                                              */
  /* ------------------------------------------------------------------ */
  function initAuthor() {
    if (cfg.authorPortrait && cfg.authorPortrait.src) {
      var slot = $('#portrait-slot');
      var img = el('img', { src: cfg.authorPortrait.src, alt: cfg.authorPortrait.alt || '', loading: 'lazy', width: 800, height: 1000 });
      slot.replaceWith(img);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Partage                                                             */
  /* ------------------------------------------------------------------ */
  function initShare() {
    var url = location.href.split('#')[0];
    $('#share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(cfg.share.text + ' ' + url);
    $('#share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    $('#share-copy').addEventListener('click', function () {
      var b = this;
      copyText(url).then(function () { flash(b, 'Lien copié ✓'); }, function () { flash(b, 'Copie impossible'); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Client API (Google Apps Script)                                     */
  /* ------------------------------------------------------------------ */
  function ApiError(code, message, fields) {
    this.code = code; this.message = message; this.fields = fields || null;
  }
  function api(action, payload) {
    var endpoint = cfg.backend.endpoint;
    if (!endpoint) return Promise.reject(new ApiError('not_configured', 'Les précommandes ne sont pas encore ouvertes.'));
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, cfg.backend.timeoutMs || 25000);
    var body = JSON.stringify(Object.assign({ action: action }, payload));
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // évite la pré-requête CORS
      body: body,
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new ApiError('server', 'Le serveur a répondu avec une erreur (' + res.status + ').');
      return res.json().catch(function () { throw new ApiError('server', 'Réponse du serveur illisible.'); });
    }).then(function (json) {
      if (!json || json.ok !== true) {
        throw new ApiError((json && json.error) || 'server', (json && json.message) || 'Une erreur est survenue.', json && json.fields);
      }
      return json;
    }).catch(function (e) {
      clearTimeout(timer);
      if (e instanceof ApiError) throw e;
      if (e && e.name === 'AbortError') throw new ApiError('timeout', 'Le serveur met trop de temps à répondre.');
      throw new ApiError('network', 'Connexion impossible.');
    });
  }
  function friendly(e) {
    switch (e.code) {
      case 'not_configured': return 'Les précommandes ne sont pas encore ouvertes. Merci de revenir très bientôt.';
      case 'network': return 'Connexion impossible. Vérifiez votre connexion Internet puis réessayez : vos informations sont conservées.';
      case 'timeout': return 'Le serveur met trop de temps à répondre. Réessayez dans un instant : vos informations sont conservées et aucune commande en double ne sera créée.';
      case 'busy': return 'Le serveur est très sollicité. Réessayez dans quelques secondes : vos informations sont conservées.';
      case 'rate_limited': return 'Trop de tentatives. Patientez quelques minutes puis réessayez.';
      case 'not_found': return 'Aucune commande ne correspond à cette référence et ce numéro de téléphone.';
      default: return e.message || 'Une erreur est survenue. Réessayez.';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Précommande                                                         */
  /* ------------------------------------------------------------------ */
  var current = null;       // commande en cours { reference, ... }
  var requestId = uuid();   // identifiant d'idempotence du formulaire en cours
  var lastFp = null, sending = false;

  function saveCurrent() { try { localStorage.setItem(STORE_KEY, JSON.stringify(current)); } catch (e) {} }
  function loadSaved() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (o && o.savedAt && Date.now() - o.savedAt > 45 * 864e5) { localStorage.removeItem(STORE_KEY); return null; } // données personnelles : purge après 45 jours
      return o;
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }

  function showStep(name) {
    ['form', 'pay', 'done'].forEach(function (s) { $('#step-' + s).hidden = (s !== name); });
    var top = $('.order-panel');
    var y = top.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function setErr(form, name, msg) {
    var p = $('[data-err="' + name + '"]', form);
    if (p) p.textContent = msg || '';
    var input = form.elements[name];
    if (input && input.setAttribute) {
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
  }
  function clearErrs(form) { $$('[data-err]', form).forEach(function (p) { setErr(form, p.getAttribute('data-err'), ''); }); }

  function validateOrder(f) {
    var e = {};
    var name = f.fullName.value.trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.indexOf(' ') === -1) e.fullName = 'Indiquez votre nom et votre prénom.';
    var dg = digits(f.phone.value);
    if (dg.length < 8 || dg.length > 15) e.phone = 'Numéro invalide (8 à 15 chiffres, avec l\'indicatif si hors Gabon).';
    if (f.city.value.trim().length < 2) e.city = 'Indiquez votre ville de résidence.';
    var q = Number(f.quantity.value);
    if (!/^\d+$/.test(String(f.quantity.value).trim()) || q < 1 || q > cfg.form.maxQuantity) {
      e.quantity = 'Quantité : un nombre entre 1 et ' + cfg.form.maxQuantity + '.';
    }
    if (f.pickupNote.value.length > 240) e.pickupNote = '240 caractères maximum.';
    if (!f.consent.checked) e.consent = 'Veuillez accepter les conditions de précommande pour continuer.';
    return e;
  }
  function showErrors(form, errs) {
    clearErrs(form);
    var first = null;
    Object.keys(errs).forEach(function (k) {
      setErr(form, k, errs[k]);
      if (!first && form.elements[k]) first = form.elements[k];
    });
    if (first && first.focus) first.focus();
  }

  function updateTotal() {
    var q = Math.max(1, Math.min(cfg.form.maxQuantity, parseInt($('#f-qty').value, 10) || 1));
    var box = $('#total-box');
    box.innerHTML = '';
    if (hasPrice()) {
      box.appendChild(document.createTextNode('Total à payer : '));
      box.appendChild(el('b', { text: money(cfg.price.amount * q) }));
      box.appendChild(document.createTextNode(' (' + q + ' × ' + money(cfg.price.amount) + '). Paiement intégral, sans acompte. Aucun frais de livraison n\'est facturé.'));
    } else {
      box.textContent = 'Le prix de l\'exemplaire n\'est pas encore annoncé. Le montant exact vous sera communiqué avant tout paiement.';
    }
  }

  function renderPay() {
    var o = current;
    $('#ref-value').textContent = o.reference;
    $$('[data-bind="ref"]').forEach(function (n) { n.textContent = o.reference; });
    $('#stamp').textContent = o.statusPayment || 'Paiement en attente';
    renderDone();
    var rows = [
      ['Nom', o.fullName], ['Téléphone', o.phone], ['Ville', o.city],
      ['Quantité', String(o.quantity)]
    ];
    if (o.pickupNote) rows.push(['Remarque', o.pickupNote]);
    rows.push(['Montant attendu', typeof o.amount === 'number' ? money(o.amount) : 'À communiquer']);
    rows.push(['Statut de la commande', o.statusOrder || 'Commande créée']);
    rows.push(['Statut du paiement', o.statusPayment || 'Paiement en attente']);
    if (o.confirmedAt) rows.push(['Paiement confirmé le', fmtDate(o.confirmedAt)]);
    var dl = $('#recap'); dl.innerHTML = '';
    rows.forEach(function (r) {
      dl.appendChild(el('div', {}, [el('dt', { text: r[0] }), el('dd', { text: r[1] })]));
    });
    $('#pay-amount').textContent = typeof o.amount === 'number'
      ? 'Montant exact à transférer : ' + money(o.amount) + ' (paiement intégral, sans acompte)'
      : 'Le prix n\'est pas encore communiqué : attendez la confirmation du montant avant d\'effectuer le transfert.';
  }

  function submitOrder(ev) {
    ev.preventDefault();
    var f = ev.target, btn = $('#submit-btn'), errBox = $('#form-error');
    errBox.hidden = true;
    var errs = validateOrder(f);
    if (Object.keys(errs).length) { showErrors(f, errs); return; }
    clearErrs(f);
    if (sending) return;
    var payload = {
      fullName: f.fullName.value.trim().replace(/\s+/g, ' '),
      phone: cleanPhone(f.phone.value),
      city: f.city.value.trim(),
      quantity: Number(f.quantity.value),
      pickupNote: f.pickupNote.value.trim(),
      acceptedTerms: f.consent.checked === true,
      website: f.website.value // piège anti-robots : doit rester vide
    };
    // Même saisie = même identifiant (aucun doublon après une coupure) ; saisie modifiée = nouvel identifiant
    var fp = JSON.stringify([payload.fullName, payload.phone, payload.city, payload.quantity, payload.pickupNote]);
    if (fp !== lastFp) { requestId = uuid(); lastFp = fp; }
    payload.requestId = requestId;
    sending = true;
    btn.disabled = true; var old = btn.innerHTML; btn.textContent = 'ENVOI EN COURS…';
    api('create', payload).then(function (res) {
      var o = res.order;
      current = {
        reference: o.reference, fullName: payload.fullName, phone: payload.phone, city: payload.city,
        quantity: payload.quantity, pickupNote: payload.pickupNote, savedAt: Date.now(),
        amount: (typeof o.amount === 'number') ? o.amount : null,
        statusOrder: o.statusOrder, statusPayment: o.statusPayment, step: 'pay'
      };
      saveCurrent(); requestId = uuid(); lastFp = null; f.reset(); updateTotal();
      renderPay(); showStep('pay');
    }).catch(function (e) {
      if (e.fields) showErrors(f, e.fields);
      errBox.textContent = friendly(e); errBox.hidden = false;
    }).then(function () { sending = false; btn.disabled = false; btn.innerHTML = old; });
  }

  /* Compression de la capture d'écran (côté navigateur) */
  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('Le fichier doit être une image.'));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 1000, r = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var data = c.toDataURL('image/jpeg', 0.72);
        resolve(data.split(',')[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Image illisible.')); };
      img.src = url;
    });
  }

  function submitProof(ev) {
    ev.preventDefault();
    var f = ev.target, btn = $('#proof-btn'), errBox = $('#proof-error');
    errBox.hidden = true; clearErrs(f);
    var tx = f.transactionRef.value.trim();
    if (tx.length < 4 || !/^[A-Za-z0-9._\-\/ ]+$/.test(tx)) {
      showErrors(f, { transactionRef: 'Indiquez la référence de la transaction (lettres et chiffres).' }); return;
    }
    var file = f.proofImage.files && f.proofImage.files[0];
    btn.disabled = true; var old = btn.textContent; btn.textContent = 'ENVOI EN COURS…';
    var prep = file ? compressImage(file) : Promise.resolve(null);
    prep.catch(function (err) { throw new ApiError('validation', err.message, { proofImage: err.message }); })
      .then(function (b64) {
        return api('proof', { reference: current.reference, phone: current.phone, transactionRef: tx, imageBase64: b64 });
      }).then(function (res) {
        current.statusPayment = res.order.statusPayment; current.statusOrder = res.order.statusOrder;
        current.step = 'done'; saveCurrent(); f.reset();
        renderPay(); showStep('done');
      }).catch(function (e) {
        if (e.fields) showErrors(f, e.fields);
        errBox.textContent = friendly(e); errBox.hidden = false;
      }).then(function () { btn.disabled = false; btn.textContent = old; });
  }

  function fmtDate(t) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(t || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  function describe(o) {
    if (o.statusPayment === 'Paiement confirmé') {
      return 'Paiement confirmé' + (o.confirmedAt ? ' le ' + fmtDate(o.confirmedAt) : '') + '. Votre commande est validée.';
    }
    if (o.statusPayment === 'Paiement à vérifier') return 'Votre preuve de paiement est reçue : nous vérifions le transfert.';
    return 'Nous attendons votre paiement Airtel Money.';
  }
  function statusText(o) { return 'Commande : ' + o.statusOrder + ' · Paiement : ' + o.statusPayment + ' — ' + describe(o); }

  /* Met à jour la commande en cours avec le statut réel renvoyé par le serveur */
  function applyStatus(o) {
    if (!current || o.reference !== current.reference) return;
    current.statusOrder = o.statusOrder; current.statusPayment = o.statusPayment; current.confirmedAt = o.confirmedAt || null;
    if (o.statusPayment !== 'Paiement en attente') current.step = 'done';
    saveCurrent(); renderPay();
  }
  function renderDone() {
    if (!current) return;
    var ok = current.statusPayment === 'Paiement confirmé';
    var st = $('#stamp-done');
    st.textContent = current.statusPayment || 'Paiement à vérifier';
    st.className = 'stamp ' + (ok ? 'stamp-ok' : 'stamp-check');
    $('#stamp').className = 'stamp' + (ok ? ' stamp-ok' : '');
    $('#done-title').textContent = ok ? 'Paiement confirmé : commande validée' : 'Merci, votre preuve est bien reçue';
    var tx = $('#done-text'); tx.textContent = '';
    if (ok) {
      tx.appendChild(document.createTextNode('Votre commande '));
      tx.appendChild(el('b', { text: current.reference }));
      tx.appendChild(document.createTextNode(' est validée. ' + describe(current) + ' Les exemplaires seront disponibles ' + lowerFirst(cfg.availability.label) + '.'));
    } else {
      tx.appendChild(document.createTextNode('Votre commande '));
      tx.appendChild(el('b', { text: current.reference }));
      tx.appendChild(document.createTextNode(' est en attente de vérification manuelle du paiement. Elle sera confirmée une fois le transfert contrôlé.'));
    }
  }
  function checkStatus(reference, phone, out, errBox, btn, onOk) {
    if (errBox) errBox.hidden = true;
    out.textContent = 'Vérification…';
    if (btn) btn.disabled = true;
    api('status', { reference: reference, phone: phone }).then(function (res) {
      if (onOk) onOk(res.order);
      out.textContent = statusText(res.order);
    }).catch(function (e) {
      out.textContent = '';
      if (errBox) { errBox.textContent = friendly(e); errBox.hidden = false; } else out.textContent = friendly(e);
    }).then(function () { if (btn) btn.disabled = false; });
  }

  function initOrder() {
    var form = $('#order-form'), qty = $('#f-qty');
    var configured = !!cfg.backend.endpoint;
    $('#not-configured').hidden = configured;

    form.addEventListener('submit', submitOrder);
    form.addEventListener('input', function (e) {
      if (e.target.name) setErr(form, e.target.name, '');
    });
    qty.addEventListener('input', updateTotal);
    $('#qty-minus').addEventListener('click', function () { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); updateTotal(); });
    $('#qty-plus').addEventListener('click', function () { qty.value = Math.min(cfg.form.maxQuantity, (parseInt(qty.value, 10) || 0) + 1); updateTotal(); });
    updateTotal();

    $('#proof-form').addEventListener('submit', submitProof);
    $('#copy-ref').addEventListener('click', function () {
      var b = this; copyText(current.reference).then(function () { flash(b, 'Copié ✓'); }, function () { flash(b, 'Copie impossible'); });
    });
    $('#copy-number').addEventListener('click', function () {
      var b = this; copyText(cfg.payment.number.replace(/\s/g, '')).then(function () { flash(b, 'Numéro copié ✓'); }, function () { flash(b, 'Copie impossible'); });
    });
    function again() { current = null; clearSaved(); $('#resume-btn').hidden = true; showStep('form'); }
    $('#new-order').addEventListener('click', again);
    $('#new-order-2').addEventListener('click', again);

    $('#check-status').addEventListener('click', function () {
      checkStatus(current.reference, current.phone, $('#status-line'), null, this, applyStatus);
    });
    $('#lookup-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = ev.target, ref = f.reference.value.trim().toUpperCase(), ph = cleanPhone(f.phone.value);
      var errBox = $('#lookup-error'), out = $('#lookup-result');
      out.textContent = '';
      if (!/^SJT-[A-Z0-9-]{6,20}$/.test(ref) || digits(ph).length < 8) {
        errBox.textContent = 'Saisissez une référence valide (SJT-…) et le téléphone utilisé pour la commande.'; errBox.hidden = false; return;
      }
      checkStatus(ref, ph, out, errBox, ev.submitter || null);
    });

    // Reprise d'une commande déjà créée sur cet appareil
    var saved = loadSaved();
    if (saved && saved.reference) {
      current = saved;
      var rb = $('#resume-btn'); rb.hidden = false;
      var label = function () { rb.textContent = 'Reprendre ma commande ' + current.reference + (current.statusPayment ? ' (' + current.statusPayment.toLowerCase() + ')' : ''); };
      label();
      rb.addEventListener('click', function () { renderPay(); showStep(current.step === 'done' ? 'done' : 'pay'); });
      if (configured) { // état réel : la commande a peut-être été confirmée depuis
        api('status', { reference: current.reference, phone: current.phone }).then(function (res) { applyStatus(res.order); label(); }).catch(function () {});
      }
    }
  }

  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    bindConfig(); initGalleries(); initAuthor(); initShare(); initOrder(); initChrome();
  });
})();
