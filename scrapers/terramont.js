const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TERRAMONT_CALENDAR_URL = 'https://terramont.ro/ture-organizate-prin-romania-si-extern/calendar-ture/calendar-ture-romania-drumetie/';

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
  // Verifică mai întâi combinațiile (să nu matchuiască parțial)
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
    // Structura: H2 cu luna, apoi div-uri/link-uri cu turele
    $('h2, .elementor-widget-container a[href*="terramont.ro"]').each((i, el) => {
      const tag = $(el).prop('tagName').toLowerCase();
      
      if (tag === 'h2') {
        // Extrage luna din H2
        const h2Text = $(el).text().trim();
        const luna = extractLuna(h2Text);
        if (luna) {
          currentLuna = luna;
          console.log(`  📅 ${currentLuna}`);
        }
      } else if (tag === 'a') {
        // Extrage tura din link
        const href = $(el).attr('href');
        
        // Verifică să fie link de tură (nu alte link-uri)
        if (href && href.includes('terramont.ro/') && 
            (href.includes('drumetie') || href.includes('tura') || href.includes('muntii'))) {
          
          // Caută titlul în H3 din interiorul link-ului sau în text
          let titlu = $(el).find('h3').text().trim();
          if (!titlu) {
            titlu = $(el).text().trim();
          }
          
          // Curăță titlul
          titlu = titlu.replace(/\s+/g, ' ').trim();
          
          if (titlu && titlu.length > 5) {
            const tura = {
              titlu: titlu,
              zona: extractZona(titlu),
              dificultate: extractDificultate(titlu),
              luna: currentLuna,
              link: href,
              sursa: 'Terramont'
            };
            
            // Evită duplicate
            const exists = ture.some(t => t.link === href);
            if (!exists) {
              ture.push(tura);
              console.log(`    ✅ ${titlu.substring(0, 50)}...`);
            }
          }
        }
      }
    });
    
    // Metodă alternativă - caută direct link-urile către ture
    if (ture.length === 0) {
      console.log('  🔄 Încercare metodă alternativă...');
      
      $('a[href*="terramont.ro/drumetie"]').each((i, el) => {
        const href = $(el).attr('href');
        let titlu = $(el).find('h3').text().trim() || 
                    $(el).find('h2').text().trim() || 
                    $(el).text().trim();
        
        titlu = titlu.replace(/\s+/g, ' ').trim();
        
        if (href && titlu && titlu.length > 10) {
          const exists = ture.some(t => t.link === href);
          if (!exists) {
            ture.push({
              titlu: titlu,
              zona: extractZona(titlu),
              dificultate: extractDificultate(titlu),
              luna: null,
              link: href,
              sursa: 'Terramont'
            });
          }
        }
      });
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
