const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TERRAMONT_CALENDAR_URL = 'https://terramont.ro/ture-organizate-prin-romania-si-extern/calendar-ture/calendar-ture-romania-drumetie/';

// URL-uri și titluri de exclus (nu sunt ture reale)
const EXCLUDE_URLS = [
  '/echipamente-montane/',
  '/ghid-de-calatorie/',
  '/personalizeaza-ti-tura/',
  '/pregatire-si-organizare/',
  '/siguranta-pe-munte/',
  '/drumetie-romania/',
  '/contact/',
  '/shop/',
  '/povestea-noastra/'
];

const EXCLUDE_TITLES = [
  'echipamente montane',
  'ghid de călătorie',
  'personalizează-ți tura',
  'pregătire și organizare',
  'siguranță pe munte',
  'drumeție românia'
];

function shouldExclude(url, titlu) {
  for (const excludeUrl of EXCLUDE_URLS) {
    if (url.includes(excludeUrl)) return true;
  }
  const titluLower = titlu.toLowerCase();
  for (const excludeTitle of EXCLUDE_TITLES) {
    if (titluLower === excludeTitle || titluLower.includes(excludeTitle)) return true;
  }
  return false;
}

// Mapare zone din titlu
const ZONE_KEYWORDS = {
  'bucegi': 'Bucegi',
  'făgăraș': 'Făgăraș',
  'fagaras': 'Făgăraș',
  'retezat': 'Retezat',
  'piatra craiului': 'Piatra Craiului',
  'rodnei': 'Rodnei',
  'călimani': 'Călimani',
  'calimani': 'Călimani',
  'parâng': 'Parâng',
  'parang': 'Parâng',
  'cindrel': 'Cindrel',
  'ceahlău': 'Ceahlău',
  'ceahlau': 'Ceahlău',
  'ciucaș': 'Ciucaș',
  'ciucas': 'Ciucaș',
  'apuseni': 'Apuseni',
  'hășmaș': 'Hășmaș',
  'hasmas': 'Hășmaș',
  'via transilvanica': 'Via Transilvanica',
  'cozia': 'Cozia',
  'iezer': 'Iezer-Păpușa',
  'trascău': 'Trascău',
  'trascau': 'Trascău'
};

// Mapare dificultate din titlu
const DIFICULTATE_KEYWORDS = {
  'începător - intermediar': 'Începător-Intermediar',
  'începător-intermediar': 'Începător-Intermediar',
  'începător – intermediar': 'Începător-Intermediar',
  'incepator - intermediar': 'Începător-Intermediar',
  'incepator-intermediar': 'Începător-Intermediar',
  'intermediar - experimentat': 'Intermediar-Experimentat',
  'intermediar-experimentat': 'Intermediar-Experimentat',
  'intermediar – experimentat': 'Intermediar-Experimentat',
  'începător': 'Începător',
  'incepator': 'Începător',
  'intermediar': 'Intermediar',
  'experimentat': 'Experimentat'
};

function extractZona(titlu) {
  const titluLower = titlu.toLowerCase();
  for (const [keyword, zona] of Object.entries(ZONE_KEYWORDS)) {
    if (titluLower.includes(keyword)) {
      return zona;
    }
  }
  return 'Altele';
}

function extractDificultate(titlu) {
  const titluLower = titlu.toLowerCase();
  for (const [keyword, dif] of Object.entries(DIFICULTATE_KEYWORDS)) {
    if (titluLower.includes(keyword)) {
      return dif;
    }
  }
  return null;
}

function extractLuna(sectionTitle) {
  const luni = {
    'ianuarie': 'Ianuarie',
    'februarie': 'Februarie',
    'martie': 'Martie',
    'aprilie': 'Aprilie',
    'mai': 'Mai',
    'iunie': 'Iunie',
    'iulie': 'Iulie',
    'august': 'August',
    'septembrie': 'Septembrie',
    'octombrie': 'Octombrie',
    'noiembrie': 'Noiembrie',
    'decembrie': 'Decembrie'
  };
  
  const lower = sectionTitle.toLowerCase().trim();
  return luni[lower] || null;
}

// Funcție pentru a extrage detalii de pe pagina turei
async function fetchTuraDetails(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TureScraper/1.0)'
      }
    });
    
    if (!response.ok) {
      return { pret: null, perioada: null, ghid: null };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let pret = null;
    let perioada = null;
    let ghid = null;
    
    const pageText = $('body').text();
    
    // Metoda 1: Caută pattern "Preț" urmat de număr și RON/lei
    // Formatul pe site: "Preț\n\n367 RON" sau "Preț 196 RON"
    const pretMatch1 = pageText.match(/Preț\s*[\n\s]*(\d{2,4})\s*(?:RON|lei)/i);
    if (pretMatch1) {
      pret = pretMatch1[1] + ' RON';
    }
    
    // Metoda 2: Caută "XXX lei" sau "XXX RON" standalone (minim 50, max 9999)
    if (!pret) {
      const pretMatch2 = pageText.match(/\b(\d{2,4})\s*(?:lei|RON)\b/i);
      if (pretMatch2 && parseInt(pretMatch2[1]) >= 50) {
        pret = pretMatch2[1] + ' RON';
      }
    }
    
    // Metoda 3: Caută în elementele cu class care conțin "price" sau "pret"
    if (!pret) {
      $('[class*="price"], [class*="pret"], [class*="cost"]').each((i, el) => {
        if (!pret) {
          const text = $(el).text();
          const match = text.match(/(\d{2,4})\s*(?:lei|RON)/i);
          if (match && parseInt(match[1]) >= 50) {
            pret = match[1] + ' RON';
          }
        }
      });
    }
    
    // Perioada - caută după "Perioada" label
    const perioadaMatch = pageText.match(/Perioada\s*[\n\s]*([0-9]{1,2}(?:\s*[-–]\s*[0-9]{1,2})?\s+[A-Za-zĂÎÂȘȚăîâșț]+)/i);
    if (perioadaMatch) {
      perioada = perioadaMatch[1].trim();
    }
    
    // Ghid - caută pattern "Ghid" urmat de nume și telefon
    const ghidMatch = pageText.match(/Ghid\s*[\n\s]*([0-9]{10})\s+([A-Za-zăîâșțĂÎÂȘȚ]+)/i);
    if (ghidMatch) {
      ghid = ghidMatch[2] + ' - ' + ghidMatch[1];
    } else {
      // Alternativ: Ghid Nume - telefon
      const ghidMatch2 = pageText.match(/Ghid[:\s]+([A-Za-zăîâșțĂÎÂȘȚ]+(?:\s+[A-Za-zăîâșțĂÎÂȘȚ]+)?)\s*[-–]?\s*([0-9\s]{10,})/i);
      if (ghidMatch2) {
        ghid = ghidMatch2[1].trim() + ' - ' + ghidMatch2[2].replace(/\s/g, '');
      }
    }
    
    return { pret, perioada, ghid };
    
  } catch (error) {
    console.error(`    ⚠️ Nu am putut extrage detalii de pe ${url}: ${error.message}`);
    return { pret: null, perioada: null, ghid: null };
  }
}

async function scrapeTerramont() {
  console.log('🏔️ Scraping Terramont...');
  
  try {
    const response = await fetch(TERRAMONT_CALENDAR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TureScraper/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const ture = [];
    let currentLuna = null;
    
    // Parcurge conținutul paginii
    $('h2, .elementor-widget-container a[href*="terramont.ro"]').each((i, el) => {
      const tag = $(el).prop('tagName').toLowerCase();
      
      if (tag === 'h2') {
        const h2Text = $(el).text().trim();
        const luna = extractLuna(h2Text);
        if (luna) {
          currentLuna = luna;
          console.log(`  📅 ${currentLuna}`);
        }
      } else if (tag === 'a') {
        const href = $(el).attr('href');
        
        if (href && href.includes('terramont.ro/') && 
            (href.includes('drumetie') || href.includes('tura') || href.includes('muntii'))) {
          
          let titlu = $(el).find('h3').text().trim();
          if (!titlu) {
            titlu = $(el).text().trim();
          }
          
          titlu = titlu.replace(/\s+/g, ' ').trim();
          
          if (titlu && titlu.length > 5 && !shouldExclude(href, titlu)) {
            const tura = {
              titlu: titlu,
              zona: extractZona(titlu),
              dificultate: extractDificultate(titlu),
              luna: currentLuna,
              link: href,
              sursa: 'Terramont',
              pret: null,
              perioada: null,
              ghid: null
            };
            
            const exists = ture.some(t => t.link === href);
            if (!exists) {
              ture.push(tura);
              console.log(`    ✅ ${titlu.substring(0, 50)}...`);
            }
          }
        }
      }
    });
    
    // Metodă alternativă
    if (ture.length === 0) {
      console.log('  🔄 Încercare metodă alternativă...');
      
      $('a[href*="terramont.ro/drumetie"]').each((i, el) => {
        const href = $(el).attr('href');
        let titlu = $(el).find('h3').text().trim() || 
                    $(el).find('h2').text().trim() || 
                    $(el).text().trim();
        
        titlu = titlu.replace(/\s+/g, ' ').trim();
        
        if (href && titlu && titlu.length > 10 && !shouldExclude(href, titlu)) {
          const exists = ture.some(t => t.link === href);
          if (!exists) {
            ture.push({
              titlu: titlu,
              zona: extractZona(titlu),
              dificultate: extractDificultate(titlu),
              luna: null,
              link: href,
              sursa: 'Terramont',
              pret: null,
              perioada: null,
              ghid: null
            });
          }
        }
      });
    }
    
    // Acum extragem detaliile pentru fiecare tură
    console.log(`\n📦 Extragere detalii pentru ${ture.length} ture...`);
    
    for (let i = 0; i < ture.length; i++) {
      const tura = ture[i];
      console.log(`  [${i + 1}/${ture.length}] ${tura.titlu.substring(0, 40)}...`);
      
      const details = await fetchTuraDetails(tura.link);
      tura.pret = details.pret;
      tura.perioada = details.perioada;
      tura.ghid = details.ghid;
      
      if (details.pret) {
        console.log(`         💰 ${details.pret}`);
      }
      
      // Mică pauză între requesturi pentru a nu supraîncărca serverul
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Total ture Terramont: ${ture.length}`);
    return ture;
    
  } catch (error) {
    console.error('❌ Eroare scraping Terramont:', error.message);
    return [];
  }
}

module.exports = { scrapeTerramont };

// Rulează direct dacă e executat ca script
if (require.main === module) {
  scrapeTerramont().then(ture => {
    console.log('\n📋 Rezultate:');
    console.log(JSON.stringify(ture, null, 2));
  });
}
