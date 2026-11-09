#!/usr/bin/env python3
"""Renseigne l'adresse publique définitive du site (aperçus WhatsApp/Facebook, sitemap, robots.txt).

Usage :
    python3 scripts/set-site-url.py https://MON-COMPTE.github.io/NOM-DU-DEPOT
    python3 scripts/set-site-url.py https://www.mon-domaine.ga          (domaine personnalisé)
    python3 scripts/set-site-url.py --check                             (vérifie la cohérence, ne modifie rien)

- Sans slash final. HTTPS obligatoire (WhatsApp et Facebook l'exigent pour l'image d'aperçu).
- Peut être relancé : l'ancienne adresse est mémorisée dans .site-url et remplacée (changement de
  dépôt, passage à un domaine personnalisé…).
- Les chemins du site sont tous RELATIFS : le site fonctionne dans un sous-dossier de dépôt
  (https://compte.github.io/depot/) sans autre réglage.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = ["index.html", "robots.txt", "sitemap.xml"]
TOKEN = "__SITE_URL__"
MEMO = ROOT / ".site-url"
URL_RE = re.compile(r"^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[A-Za-z0-9._~%-]+)*$")

def check():
    problems, current = [], MEMO.read_text().strip() if MEMO.exists() else None
    for name in FILES:
        text = (ROOT / name).read_text(encoding="utf-8")
        if TOKEN in text:
            problems.append(f"{name} contient encore {TOKEN} (adresse non renseignée)")
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    for prop in ("og:image", "og:url"):
        m = re.search(rf'<meta property="{prop}" content="([^"]+)"', html)
        if not m or not m.group(1).startswith("https://"):
            problems.append(f"{prop} n'est pas une URL absolue https : {m.group(1) if m else 'absente'}")
    for rel in re.findall(r'(?:src|href)="(assets/[^"]+|css/[^"]+|js/[^"]+|favicon\.svg)"', html):
        if not (ROOT / rel).exists():
            problems.append(f"fichier référencé introuvable (attention à la casse) : {rel}")
    if problems:
        print("À CORRIGER :"); [print(" -", p) for p in problems]; return 1
    print(f"OK : adresse {current or '(non mémorisée)'} appliquée, {len(FILES)} fichiers cohérents.")
    return 0

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    if sys.argv[1] == "--check":
        sys.exit(check())
    url = sys.argv[1].rstrip("/")
    if not URL_RE.match(url):
        sys.exit("Adresse invalide. Exemple : https://compte.github.io/depot (https obligatoire, sans slash final)")
    old = MEMO.read_text().strip() if MEMO.exists() else None
    changed = 0
    for name in FILES:
        p = ROOT / name
        s = p.read_text(encoding="utf-8")
        n = s.replace(TOKEN, url)
        if old and old != url:
            n = re.sub(re.escape(old) + r"(?=[/\"<\s]|$)", url, n)
        if n != s:
            p.write_text(n, encoding="utf-8"); changed += 1
    MEMO.write_text(url + "\n")
    print(f"OK : {changed} fichier(s) mis à jour avec {url}")
    sys.exit(check())

if __name__ == "__main__":
    main()
