const fs = require('fs');
const path = require('path');
const { scrapeTerramont } = require('./scrapers/terramont');
const { scrapeCarCluj } = require('./scrapers/carcluj');

// Adaugă aici alte surse când le implementezi
// const { scrapeHaiLaMunte } = require('./scrapers/hailamunte');
// const { scrapeMontania } = require('./scrapers/montania');

const OUTPUT_FILE = path.join(__dirname, 'output', 'ture.json');
const NEWSLETTER_FILE = path.join(__dirname, 'output', 'newsletter.html');
const SUBSTACK_FILE = path.join(__dirname, 'output', 'substack.md');

// Funcție pentru a genera newsletter-ul formatat HTML
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
  
  // Formatare tură pentru secțiunea detaliată (HTML)
  const formatTuraDetaliat = (t) => {
    let html = `<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">`;
    html += `<h3 style="margin: 0 0 10px 0; color: #333;">${t.titlu}</h3>`;
    html += `<p style="margin: 5px 0; color: #666;">`;
    html += `🏔️ <strong>${t.zona || 'N/A'}</strong>`;
    if (t.dificultate) html += ` &nbsp;|&nbsp; 📊 ${t.dificultate}`;
    if (t.pret) html += ` &nbsp;|&nbsp; 💰 <strong style="color: #28a745;">${t.pret}</strong>`;
    html += `</p>`;
    if (t.perioada) html += `<p style="margin: 5px 0; color: #666;">📅 ${t.perioada}</p>`;
    html += `<a href="${t.link}" style="color: #007bff; text-decoration: none;">🔗 Detalii și înscriere →</a>`;
    html += `</div>`;
    return html;
  };
  
  // Formatare tură pentru lista scurtă (HTML)
  const formatTuraScurt = (t) => {
    let pret = t.pret ? `<span style="color: #28a745;">(${t.pret})</span>` : '<span style="color: #6c757d;">(gratis)</span>';
    let data = t.perioada ? ` - ${t.perioada}` : '';
    return `<li style="margin: 8px 0;"><a href="${t.link}" style="color: #333; text-decoration: none;">${t.titlu}</a> ${pret}${data}</li>`;
  };
  
  // Construiește newsletter-ul HTML
  let newsletter = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">

<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2d5016; margin: 0;">🏔️ UNDE MERGEM PE MUNTE?</h1>
  <p style="color: #666; margin: 10px 0;">${dataAcum}</p>
</div>

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
  <h2 style="margin: 0 0 15px 0; font-size: 18px;">📍 QUICK LINKS</h2>
  <p style="margin: 5px 0;">• <a href="#platite" style="color: white;">Ture cu ghid (plătite)</a>: <strong>${turePlatite.length}</strong> ture</p>
  <p style="margin: 5px 0;">• <a href="#gratuite" style="color: white;">Ture gratuite</a>: <strong>${tureGratuite.length}</strong> ture</p>
  <p style="margin: 5px 0;">• 🟢 <a href="#incepator" style="color: white;">Începător</a>: <strong>${peIncepator.length}</strong> ture</p>
  <p style="margin: 5px 0;">• 🟡 <a href="#intermediar" style="color: white;">Intermediar</a>: <strong>${peIntermediar.length}</strong> ture</p>
  <p style="margin: 5px 0;">• 🔴 <a href="#experimentat" style="color: white;">Experimentat</a>: <strong>${peExperimentat.length}</strong> ture</p>
</div>

<div id="platite" style="margin-bottom: 30px;">
  <h2 style="color: #2d5016; border-bottom: 2px solid #28a745; padding-bottom: 10px;">💰 TURE CU GHID (PLĂTITE)</h2>
`;

  if (turePlatite.length > 0) {
    turePlatite.forEach(t => {
      newsletter += formatTuraDetaliat(t);
    });
  } else {
    newsletter += '<p style="color: #666;">Nicio tură plătită în această perioadă.</p>';
  }

  newsletter += `</div>

<div id="gratuite" style="margin-bottom: 30px;">
  <h2 style="color: #2d5016; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">🆓 TURE GRATUITE / ÎNTRE PRIETENI</h2>
`;

  if (tureGratuite.length > 0) {
    tureGratuite.forEach(t => {
      newsletter += formatTuraDetaliat(t);
    });
  } else {
    newsletter += '<p style="color: #666;">Nicio tură gratuită în această perioadă.</p>';
  }

  newsletter += `</div>

<div style="margin-bottom: 30px;">
  <h2 style="color: #2d5016; border-bottom: 2px solid #6c757d; padding-bottom: 10px;">📊 PE DIFICULTATE</h2>
  
  <div id="incepator" style="margin-bottom: 20px;">
    <h3 style="color: #28a745;">🟢 ÎNCEPĂTOR</h3>
    <ul style="list-style: none; padding: 0;">
`;
  if (peIncepator.length > 0) {
    peIncepator.forEach(t => {
      newsletter += formatTuraScurt(t);
    });
  } else {
    newsletter += '<li style="color: #666;">Nicio tură pentru începători.</li>';
  }

  newsletter += `
    </ul>
  </div>
  
  <div id="intermediar" style="margin-bottom: 20px;">
    <h3 style="color: #ffc107;">🟡 INTERMEDIAR</h3>
    <ul style="list-style: none; padding: 0;">
`;
  if (peIntermediar.length > 0) {
    peIntermediar.forEach(t => {
      newsletter += formatTuraScurt(t);
    });
  } else {
    newsletter += '<li style="color: #666;">Nicio tură intermediară.</li>';
  }

  newsletter += `
    </ul>
  </div>
  
  <div id="experimentat" style="margin-bottom: 20px;">
    <h3 style="color: #dc3545;">🔴 EXPERIMENTAT</h3>
    <ul style="list-style: none; padding: 0;">
`;
  if (peExperimentat.length > 0) {
    peExperimentat.forEach(t => {
      newsletter += formatTuraScurt(t);
    });
  } else {
    newsletter += '<li style="color: #666;">Nicio tură pentru experimentați.</li>';
  }

  newsletter += `
    </ul>
  </div>
</div>

<div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 30px;">
  <p style="font-size: 24px; margin: 0 0 10px 0;">Drum bun pe munte! 🥾</p>
  <p style="color: #666; margin: 0;">Verifică condițiile meteo înainte de plecare:</p>
  <a href="https://merglamunte.ro" style="display: inline-block; margin-top: 15px; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold;">🌤️ MergLaMunte.ro</a>
</div>

</body>
</html>
`;

  return newsletter;
}

// Funcție pentru a genera versiunea Substack (Markdown simplu)
function generateSubstack(ture) {
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

  // Sortare după dată (cele mai apropiate primele)
  const sortByDate = (a, b) => {
    const getMonth = (str) => {
      if (!str) return 99;
      const lower = str.toLowerCase();
      if (lower.includes('ian')) return 1;
      if (lower.includes('feb')) return 2;
      if (lower.includes('mar')) return 3;
      if (lower.includes('apr')) return 4;
      if (lower.includes('mai')) return 5;
      if (lower.includes('iun')) return 6;
      if (lower.includes('iul')) return 7;
      if (lower.includes('aug')) return 8;
      if (lower.includes('sep')) return 9;
      if (lower.includes('oct')) return 10;
      if (lower.includes('noi')) return 11;
      if (lower.includes('dec')) return 12;
      return 99;
    };
    return getMonth(a.perioada) - getMonth(b.perioada);
  };

  turePlatite.sort(sortByDate);
  tureGratuite.sort(sortByDate);

  let md = `# 🏔️ Ture Montane - ${dataAcum}

Salut!

Săptămâna asta am găsit **${ture.length} ture** organizate în munții României:

## 📍 Quick Links

- 💰 [Ture cu ghid (plătite)](#ture-cu-ghid-plătite) - **${turePlatite.length}** ture
- 🆓 [Ture gratuite](#ture-gratuite) - **${tureGratuite.length}** ture
- 🟢 [Începător](#-începător-${peIncepator.length}-ture) - **${peIncepator.length}** ture
- 🟡 [Intermediar](#-intermediar-${peIntermediar.length}-ture) - **${peIntermediar.length}** ture
- 🔴 [Experimentat](#-experimentat-${peExperimentat.length}-ture) - **${peExperimentat.length}** ture

---

## 💰 Ture cu Ghid (Plătite)

`;

  turePlatite.forEach(t => {
    md += `### ${t.titlu}\n\n`;
    md += `🏔️ **${t.zona || 'N/A'}**`;
    if (t.dificultate) md += ` • ${t.dificultate}`;
    md += `\n\n`;
    if (t.perioada) md += `📅 ${t.perioada}\n\n`;
    if (t.pret) md += `💰 **${t.pret}**\n\n`;
    md += `[Detalii și înscriere →](${t.link})\n\n`;
    md += `---\n\n`;
  });

  md += `## 🆓 Ture Gratuite

`;

  tureGratuite.forEach(t => {
    md += `### ${t.titlu}\n\n`;
    md += `🏔️ **${t.zona || 'N/A'}**`;
    if (t.dificultate) md += ` • ${t.dificultate}`;
    md += `\n\n`;
    if (t.perioada) md += `📅 ${t.perioada}\n\n`;
    md += `[Detalii →](${t.link})\n\n`;
    md += `---\n\n`;
  });

  md += `## 📊 Rezumat pe Dificultate

### 🟢 Începător (${peIncepator.length} ture)
`;
  peIncepator.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    md += `- [${t.titlu}](${t.link}) - ${pret}${t.perioada ? ' - ' + t.perioada : ''}\n`;
  });

  md += `
### 🟡 Intermediar (${peIntermediar.length} ture)
`;
  peIntermediar.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    md += `- [${t.titlu}](${t.link}) - ${pret}${t.perioada ? ' - ' + t.perioada : ''}\n`;
  });

  md += `
### 🔴 Experimentat (${peExperimentat.length} ture)
`;
  peExperimentat.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    md += `- [${t.titlu}](${t.link}) - ${pret}${t.perioada ? ' - ' + t.perioada : ''}\n`;
  });

  md += `
---

**Drum bun pe munte!** 🥾

Verifică mereu condițiile meteo pe [MergLaMunte.ro](https://merglamunte.ro) înainte de plecare.
`;

  return md;
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
  
  // Generează și salvează versiunea Substack
  const substackContent = generateSubstack(toateTurele);
  fs.writeFileSync(SUBSTACK_FILE, substackContent, 'utf8');
  console.log(`✅ Substack salvat în: ${SUBSTACK_FILE}`);
  
  return output;
}

// Rulează
runAllScrapers().catch(console.error);
