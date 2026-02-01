const fetch = require('node-fetch');
const cheerio = require('cheerio');

const CARCLUJ_URL = 'https://carcluj.ro/activitati';

// Mapare zone din titlu
const ZONE_KEYWORDS = {
  'bucegi': 'Bucegi',
  'făgăraș': 'Făgăraș',
  'fagaras': 'Făgăraș',
  'retezat': 'Retezat',
  'piatra craiului': 'Piatra Craiului',
  'rodnei': 'Rodnei',
  'pietrosul': 'Rodnei',
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
  'padiș': 'Apuseni',
  'padis': 'Apuseni',
  'hășmaș': 'Hășmaș',
  'hasmas': 'Hășmaș',
  'via transilvanica': 'Via Transilvanica',
  'transilvanica': 'Via Transilvanica',
  'cozia': 'Cozia',
  'iezer': 'Iezer-Păpușa',
  'trascău': 'Trascău',
  'trascau': 'Trascău',
  'măcin': 'Măcin',
  'macin': 'Măcin',
  'pădurea craiului': 'Pădurea Craiului',
  'padurea craiului': 'Pădurea Craiului',
  'buscat': 'Buscat',
  'târgu mureș': 'Târgu Mureș',
  'targu mures': 'Târgu Mureș',
  'balea': 'Făgăraș',
  'cluj': 'Cluj'
};

// Mapare dificultate
const DIFICULTATE_MAP = {
  'ușor': 'Începător',
  'usor': 'Începător',
  'mediu': 'Intermediar',
  'dificil': 'Experimentat'
};

// Categorii care nu sunt drumeții clasice (le includem dar notăm tipul)
const ACTIVITY_TYPES = {
  'alpinism': 'Alpinism',
  'escaladă': 'Escaladă',
  'escalada': 'Escaladă',
  'mountain-bike': 'Mountain Bike',
  'mtb': 'Mountain Bike',
  'schi': 'Schi',
  'via ferrata': 'Via Ferrata',
  'atelier': 'Atelier/Workshop',
  'workshop': 'Atelier/Workshop',
  'cățărat': 'Escaladă',
  'catarat': 'Escaladă'
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

function extractActivityType(titlu) {
  const titluLower = titlu.toLowerCase();
  for (const [keyword, type] of Object.entries(ACTIVITY_TYPES)) {
    if (titluLower.includes(keyword)) {
      return type;
    }
  }
  return 'Drumeție';
}

function extractLunaFromDate(dateStr) {
  const luni = {
    'ian': 'Ianuarie',
    'feb': 'Februarie',
    'mar': 'Martie',
    'apr': 'Aprilie',
    'mai': 'Mai',
    'iun': 'Iunie',
    'iul': 'Iulie',
    'aug': 'August',
    'sep': 'Septembrie',
    'oct': 'Octombrie',
    'noi': 'Noiembrie',
    'dec': 'Decembrie'
  };
  
  const lower = dateStr.toLowerCase();
  for (const [abbrev, luna] of Object.entries(luni)) {
    if (lower.includes(abbrev)) {
      return luna;
    }
  }
  return null;
}

// Funcție pentru a extrage detalii de pe pagina activității
async function fetchActivityDetails(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TureScraper/1.0)'
      }
    });
    
    if (!response.ok) {
      return { pret: null, dificultate: null, descriere: null };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let pret = null;
    let dificultate = null;
    let descriere = null;
    
    // Caută prețul
    const pageText = $('body').text();
    
    // Pattern pentru preț: "150 lei", "150 RON", "Preț: 150"
    const pretPatterns = [
      /(?:preț|pret|cost|taxă|taxa|contribuție|contributie)[:\s]*(\d{1,4})\s*(?:lei|ron)/gi,
      /(\d{2,4})\s*(?:lei|ron)(?:\s*\/\s*(?:persoană|pers))?/gi
    ];
    
    for (const pattern of pretPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const numMatch = match[0].match(/\d+/);
        if (numMatch) {
          pret = numMatch[0] + ' RON';
          break;
        }
      }
    }
    
    // Caută dificultatea
    const difMatch = pageText.match(/dificultate[:\s]*(ușor|usor|mediu|dificil)/i);
    if (difMatch) {
      dificultate = DIFICULTATE_MAP[difMatch[1].toLowerCase()] || difMatch[1];
    }
    
    // Extrage prima parte a descrierii
    const descEl = $('.field--name-body p').first().text().trim();
    if (descEl && descEl.length > 20) {
      descriere = descEl.substring(0, 200) + (descEl.length > 200 ? '...' : '');
    }
    
    return { pret, dificultate, descriere };
    
  } catch (error) {
    console.error(`    ⚠️ Nu am putut extrage detalii de pe ${url}: ${error.message}`);
    return { pret: null, dificultate: null, descriere: null };
  }
}

async function scrapeCarCluj() {
  console.log('🏔️ Scraping CAR Cluj...');
  
  const ture = [];
  let currentPage = 0;
  let hasMorePages = true;
  
  try {
    while (hasMorePages && currentPage < 5) { // Max 5 pagini pentru siguranță
      const url = currentPage === 0 
        ? CARCLUJ_URL 
        : `${CARCLUJ_URL}?page=${currentPage}`;
      
      console.log(`  📄 Pagina ${currentPage + 1}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TureScraper/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let pageHasTure = false;
      
      // Selectează cardurile de activități
      $('a[href^="/activitati/"]').each((i, el) => {
        const href = $(el).attr('href');
        
        // Skip dacă e link de paginare sau filtru
        if (!href || href === '/activitati' || href.includes('?') || href.includes('page=')) {
          return;
        }
        
        const fullUrl = 'https://carcluj.ro' + href;
        
        // Extrage titlul din h3 sau text
        let titlu = $(el).find('h3').text().trim();
        if (!titlu) {
          titlu = $(el).text().trim();
        }
        
        // Curăță titlul
        titlu = titlu.replace(/\s+/g, ' ').trim();
        
        // Extrage data din elementul adiacent sau din card
        let perioada = null;
        const card = $(el).closest('.views-row') || $(el).parent();
        const dateText = card.text().match(/(\d{1,2}(?:\s*-\s*\d{1,2})?\s+(?:ian|feb|mar|apr|mai|iun|iul|aug|sep|oct|noi|dec))/i);
        if (dateText) {
          perioada = dateText[1].trim();
        }
        
        if (titlu && titlu.length > 5) {
          const exists = ture.some(t => t.link === fullUrl);
          if (!exists) {
            const tura = {
              titlu: titlu,
              zona: extractZona(titlu),
              tip_activitate: extractActivityType(titlu),
              dificultate: null,
              luna: perioada ? extractLunaFromDate(perioada) : null,
              perioada: perioada,
              link: fullUrl,
              sursa: 'CAR Cluj',
              pret: null
            };
            
            ture.push(tura);
            pageHasTure = true;
            console.log(`    ✅ ${titlu.substring(0, 50)}...`);
          }
        }
      });
      
      // Verifică dacă mai sunt pagini
      hasMorePages = $('.pager__item--next').length > 0;
      currentPage++;
      
      if (!pageHasTure && currentPage > 1) {
        hasMorePages = false;
      }
      
      // Pauză între pagini
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Extrage detalii pentru fiecare activitate
    console.log(`\n📦 Extragere detalii pentru ${ture.length} activități...`);
    
    for (let i = 0; i < ture.length; i++) {
      const tura = ture[i];
      console.log(`  [${i + 1}/${ture.length}] ${tura.titlu.substring(0, 40)}...`);
      
      const details = await fetchActivityDetails(tura.link);
      if (details.pret) tura.pret = details.pret;
      if (details.dificultate) tura.dificultate = details.dificultate;
      
      // Pauză între requesturi
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Total activități CAR Cluj: ${ture.length}`);
    return ture;
    
  } catch (error) {
    console.error('❌ Eroare scraping CAR Cluj:', error.message);
    return ture; // Returnează ce am reușit să extragem
  }
}

module.exports = { scrapeCarCluj };

// Rulează direct dacă e executat ca script
if (require.main === module) {
  scrapeCarCluj().then(ture => {
    console.log('\n📋 Rezultate:');
    console.log(JSON.stringify(ture, null, 2));
  });
}
