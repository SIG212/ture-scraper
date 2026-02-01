# 🏔️ Ture Scraper

Scraper automat pentru ture montane organizate în România.

## 📋 Surse

| Sursă | Status | URL |
|-------|--------|-----|
| Terramont | ✅ Activ | [terramont.ro](https://terramont.ro/ture-organizate-prin-romania-si-extern/calendar-ture/calendar-ture-romania-drumetie/) |
| Hai La Munte | 🔜 Planned | - |
| Montania | 🔜 Planned | - |

## 📊 Output

Datele sunt salvate în [`output/ture.json`](output/ture.json) cu următoarea structură:

```json
{
  "ultima_actualizare": "2026-02-01T09:00:00.000Z",
  "total_ture": 25,
  "surse": ["Terramont"],
  "statistici": {
    "pe_sursa": { "Terramont": 25 },
    "pe_zona": { "Făgăraș": 5, "Bucegi": 4, ... }
  },
  "ture": [
    {
      "titlu": "Drumeție: Munții Bucegi – Cabana Mălăiești",
      "zona": "Bucegi",
      "dificultate": "Intermediar",
      "luna": "Februarie",
      "link": "https://terramont.ro/...",
      "sursa": "Terramont"
    }
  ]
}
```

## 🚀 Utilizare

### Local

```bash
# Instalare dependențe
npm install

# Rulare scraper
npm run scrape

# Sau doar Terramont
npm run scrape:terramont
```

### Automat (GitHub Actions)

Scraperul rulează automat **în fiecare luni la 09:00** (ora României).

Pentru rulare manuală: Actions → Scrape Ture Montane → Run workflow

## 🔗 Integrare

### URL Raw JSON (pentru Make/Airtable/etc)

```
https://raw.githubusercontent.com/SIG212/ture-scraper/main/output/ture.json
```

### Exemplu fetch în JavaScript

```javascript
const response = await fetch('https://raw.githubusercontent.com/SIG212/ture-scraper/main/output/ture.json');
const data = await response.json();
console.log(`${data.total_ture} ture disponibile`);
```

## ➕ Adăugare sursă nouă

1. Creează fișier în `scrapers/numesite.js`
2. Exportă funcție `async scrapeNumeSite()` care returnează array de ture
3. Importă și apelează în `index.js`

## 📝 Licență

MIT
