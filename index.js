const fs = require('fs');
const path = require('path');
const { scrapeTerramont } = require('./scrapers/terramont');
const { scrapeCarCluj } = require('./scrapers/carcluj');

// Adaugă aici alte surse când le implementezi
// const { scrapeHaiLaMunte } = require('./scrapers/hailamunte');
// const { scrapeMontania } = require('./scrapers/montania');

const OUTPUT_FILE = path.join(__dirname, 'output', 'ture.json');
const NEWSLETTER_FILE = path.join(__dirname, 'output', 'newsletter.txt');

// Funcție pentru a genera newsletter-ul formatat
function generateNewsletter(ture) {
  const dataAcum = new Date().toLocaleDateString('ro-RO', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Separă ture plătite vs gratuite
  const turePlatite = ture.filter(t => t.pret && t.pret !== '0' && t.pret !== '0 RON');
  const tureGratuite = ture.filter(t => !t.pret || t.pret === '0' || t.pret === '0 RON');
  
  // Grupează pe dificultate
  const peIncepator = ture.filter(t => 
    t.dificultate && (t.dificultate.toLowerCase().includes('începător') || t.dificultate.toLowerCase().includes('incepator'))
  );
  const peIntermediar = ture.filter(t => 
    t.dificultate && t.dificultate.toLowerCase().includes('intermediar') && !t.dificultate.toLowerCase().includes('începător')
  );
  const peExperimentat = ture.filter(t => 
    t.dificultate && t.dificultate.toLowerCase().includes('experimentat')
  );
  
  // Formatare tură pentru secțiunea detaliată
  const formatTuraDetaliat = (t) => {
    let result = `## ${t.titlu}\n`;
    result += `🏔️ ${t.zona || 'N/A'}`;
    if (t.dificultate) result += ` | 📊 ${t.dificultate}`;
    if (t.pret) result += ` | 💰 ${t.pret}`;
    result += `\n`;
    if (t.perioada) result += `📅 ${t.perioada}\n`;
    result += `🔗 ${t.link}\n`;
    return result;
  };
  
  // Formatare tură pentru lista scurtă
  const formatTuraScurt = (t) => {
    let pret = t.pret ? `(${t.pret})` : '(gratis)';
    let data = t.perioada || '';
    return `• ${t.titlu} ${pret} - ${data}`;
  };
  
  // Construiește newsletter-ul
  let newsletter = `🏔️ UNDE MERGEM PE MUNTE?
${dataAcum}

━━━━━━━━━━━━━━━━━━━━━━━

📍 QUICK LINKS

• Ture cu ghid (plătite): ${turePlatite.length} ture
• Ture gratuite: ${tureGratuite.length} ture
• 🟢 Începător: ${peIncepator.length} ture
• 🟡 Intermediar: ${peIntermediar.length} ture
• 🔴 Experimentat: ${peExperimentat.length} ture

━━━━━━━━━━━━━━━━━━━━━━━

💰 TURE CU GHID (PLĂTITE)

`;

  if (turePlatite.length > 0) {
    turePlatite.forEach(t => {
      newsletter += formatTuraDetaliat(t) + '\n---\n\n';
    });
  } else {
    newsletter += 'Nicio tură plătită în această perioadă.\n\n';
  }

  newsletter += `━━━━━━━━━━━━━━━━━━━━━━━

🆓 TURE GRATUITE / ÎNTRE PRIETENI

`;

  if (tureGratuite.length > 0) {
    tureGratuite.forEach(t => {
      newsletter += formatTuraDetaliat(t) + '\n---\n\n';
    });
  } else {
    newsletter += 'Nicio tură gratuită în această perioadă.\n\n';
  }

  newsletter += `━━━━━━━━━━━━━━━━━━━━━━━

📊 PE DIFICULTATE

### 🟢 ÎNCEPĂTOR
`;
  if (peIncepator.length > 0) {
    peIncepator.forEach(t => {
      newsletter += formatTuraScurt(t) + '\n';
    });
  } else {
    newsletter += 'Nicio tură pentru începători.\n';
  }

  newsletter += `
### 🟡 INTERMEDIAR
`;
  if (peIntermediar.length > 0) {
    peIntermediar.forEach(t => {
      newsletter += formatTuraScurt(t) + '\n';
    });
  } else {
    newsletter += 'Nicio tură intermediară.\n';
  }

  newsletter += `
### 🔴 EXPERIMENTAT
`;
  if (peExperimentat.length > 0) {
    peExperimentat.forEach(t => {
      newsletter += formatTuraScurt(t) + '\n';
    });
  } else {
    newsletter += 'Nicio tură pentru experimentați.\n';
  }

  newsletter += `
━━━━━━━━━━━━━━━━━━━━━━━

Drum bun pe munte! 🥾

Verifică condițiile meteo înainte de plecare:
🌤️ MergLaMunte.ro
`;

  return newsletter;
}

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
  
  // Generează și salvează newsletter-ul formatat
  const newsletterContent = generateNewsletter(toateTurele);
  fs.writeFileSync(NEWSLETTER_FILE, newsletterContent, 'utf8');
  console.log(`✅ Newsletter salvat în: ${NEWSLETTER_FILE}`);
  
  return output;
}

// Rulează
runAllScrapers().catch(console.error);
