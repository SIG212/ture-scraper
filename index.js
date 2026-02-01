const fs = require('fs');
const path = require('path');
const { scrapeTerramont } = require('./scrapers/terramont');
const { scrapeCarCluj } = require('./scrapers/carcluj');

// Adaugă aici alte surse când le implementezi
// const { scrapeHaiLaMunte } = require('./scrapers/hailamunte');
// const { scrapeMontania } = require('./scrapers/montania');

const OUTPUT_FILE = path.join(__dirname, 'output', 'ture.json');

async function runAllScrapers() {
  console.log('🚀 Start scraping ture montane...\n');
  console.log('=' .repeat(50));
  
  const toateTurele = [];
  
  // Terramont
  try {
    const tureTerramont = await scrapeTerramont();
    toateTurele.push(...tureTerramont);
  } catch (error) {
    console.error('Eroare Terramont:', error);
  }
  
  // CAR Cluj
  try {
    const tureCarCluj = await scrapeCarCluj();
    toateTurele.push(...tureCarCluj);
  } catch (error) {
    console.error('Eroare CAR Cluj:', error);
  }
  
  // Adaugă aici alte surse
  // try {
  //   const tureHaiLaMunte = await scrapeHaiLaMunte();
  //   toateTurele.push(...tureHaiLaMunte);
  // } catch (error) {
  //   console.error('Eroare HaiLaMunte:', error);
  // }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 TOTAL TURE GĂSITE: ${toateTurele.length}`);
  
  // Sortează după sursă și apoi după titlu
  toateTurele.sort((a, b) => {
    if (a.sursa !== b.sursa) return a.sursa.localeCompare(b.sursa);
    return a.titlu.localeCompare(b.titlu);
  });
  
  // Statistici pe surse
  const statsBySursa = {};
  toateTurele.forEach(t => {
    statsBySursa[t.sursa] = (statsBySursa[t.sursa] || 0) + 1;
  });
  
  console.log('\n📈 Statistici pe surse:');
  Object.entries(statsBySursa).forEach(([sursa, count]) => {
    console.log(`   ${sursa}: ${count} ture`);
  });
  
  // Statistici pe zone
  const statsByZona = {};
  toateTurele.forEach(t => {
    const zona = t.zona || 'Necunoscut';
    statsByZona[zona] = (statsByZona[zona] || 0) + 1;
  });
  
  console.log('\n🏔️ Statistici pe zone:');
  Object.entries(statsByZona)
    .sort((a, b) => b[1] - a[1])
    .forEach(([zona, count]) => {
      console.log(`   ${zona}: ${count} ture`);
    });
  
  // Creează output
  const output = {
    ultima_actualizare: new Date().toISOString(),
    total_ture: toateTurele.length,
    surse: Object.keys(statsBySursa),
    statistici: {
      pe_sursa: statsBySursa,
      pe_zona: statsByZona
    },
    ture: toateTurele
  };
  
  // Asigură-te că există directorul output
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Scrie JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ Output salvat în: ${OUTPUT_FILE}`);
  
  return output;
}

// Rulează
runAllScrapers().catch(console.error);
