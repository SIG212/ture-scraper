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
const BMAC_FILE = path.join(__dirname, 'output', 'ture-complete.html');

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

// Funcție pentru a genera versiunea Buy Me a Coffee (HTML frumos, printabil)
function generateBMAC(ture) {
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

  // Sortare după dată
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

  const formatTura = (t) => {
    return `
    <div style="background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid ${t.pret ? '#28a745' : '#17a2b8'};">
      <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px;">${t.titlu}</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <span style="background: #e9ecef; padding: 4px 12px; border-radius: 20px; font-size: 14px;">🏔️ ${t.zona || 'N/A'}</span>
        ${t.dificultate ? `<span style="background: #e9ecef; padding: 4px 12px; border-radius: 20px; font-size: 14px;">📊 ${t.dificultate}</span>` : ''}
        ${t.perioada ? `<span style="background: #fff3cd; padding: 4px 12px; border-radius: 20px; font-size: 14px;">📅 ${t.perioada}</span>` : ''}
        ${t.pret ? `<span style="background: #d4edda; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">💰 ${t.pret}</span>` : '<span style="background: #d1ecf1; padding: 4px 12px; border-radius: 20px; font-size: 14px;">🆓 Gratis</span>'}
      </div>
      <a href="${t.link}" style="color: #007bff; text-decoration: none; font-weight: 500;">🔗 Detalii și înscriere →</a>
    </div>`;
  };

  let html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ture Montane - ${dataAcum}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: #f8f9fa;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 { text-align: center; color: #1a1a1a; margin-bottom: 5px; }
    .date { text-align: center; color: #666; margin-bottom: 30px; }
    .quick-links {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .quick-links h2 { margin: 0 0 15px 0; font-size: 18px; }
    .quick-links a { color: white; text-decoration: none; }
    .quick-links a:hover { text-decoration: underline; }
    .quick-links p { margin: 8px 0; }
    .section-title {
      font-size: 22px;
      color: #1a1a1a;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin: 30px 0 20px 0;
    }
    .summary-section { background: #fff; border-radius: 12px; padding: 20px; margin-top: 30px; }
    .summary-section h2 { margin-top: 0; color: #1a1a1a; }
    .summary-section h3 { margin: 20px 0 10px 0; }
    .summary-section ul { padding-left: 20px; }
    .summary-section li { margin: 8px 0; }
    .summary-section a { color: #333; text-decoration: none; }
    .summary-section a:hover { color: #007bff; }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 30px;
      background: #fff;
      border-radius: 12px;
    }
    .footer-btn {
      display: inline-block;
      margin-top: 15px;
      padding: 14px 35px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      font-size: 16px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏔️ Ture Montane</h1>
    <p class="date">${dataAcum}</p>
    
    <div class="quick-links">
      <h2>📍 Quick Links</h2>
      <p>💰 <a href="#platite">Ture cu ghid (plătite)</a> - <strong>${turePlatite.length}</strong> ture</p>
      <p>🆓 <a href="#gratuite">Ture gratuite</a> - <strong>${tureGratuite.length}</strong> ture</p>
      <p>🟢 <a href="#incepator">Începător</a> - <strong>${peIncepator.length}</strong> ture</p>
      <p>🟡 <a href="#intermediar">Intermediar</a> - <strong>${peIntermediar.length}</strong> ture</p>
      <p>🔴 <a href="#experimentat">Experimentat</a> - <strong>${peExperimentat.length}</strong> ture</p>
    </div>

    <h2 id="platite" class="section-title">💰 Ture cu Ghid (Plătite)</h2>
`;

  turePlatite.forEach(t => { html += formatTura(t); });

  html += `
    <h2 id="gratuite" class="section-title">🆓 Ture Gratuite</h2>
`;

  tureGratuite.forEach(t => { html += formatTura(t); });

  html += `
    <div class="summary-section">
      <h2>📊 Rezumat pe Dificultate</h2>
      
      <h3 id="incepator">🟢 Începător (${peIncepator.length} ture)</h3>
      <ul>
`;
  peIncepator.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    html += `<li><a href="${t.link}">${t.titlu}</a> - ${pret}${t.perioada ? ' - ' + t.perioada : ''}</li>\n`;
  });

  html += `
      </ul>
      
      <h3 id="intermediar">🟡 Intermediar (${peIntermediar.length} ture)</h3>
      <ul>
`;
  peIntermediar.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    html += `<li><a href="${t.link}">${t.titlu}</a> - ${pret}${t.perioada ? ' - ' + t.perioada : ''}</li>\n`;
  });

  html += `
      </ul>
      
      <h3 id="experimentat">🔴 Experimentat (${peExperimentat.length} ture)</h3>
      <ul>
`;
  peExperimentat.forEach(t => {
    const pret = t.pret ? t.pret : 'gratis';
    html += `<li><a href="${t.link}">${t.titlu}</a> - ${pret}${t.perioada ? ' - ' + t.perioada : ''}</li>\n`;
  });

  html += `
      </ul>
    </div>

    <div class="footer">
      <p style="font-size: 24px; margin: 0;">Drum bun pe munte! 🥾</p>
      <p style="color: #666;">Verifică condițiile meteo înainte de plecare</p>
      <a href="https://merglamunte.ro" class="footer-btn">🌤️ MergLaMunte.ro</a>
    </div>
  </div>
</body>
</html>`;

  return html;
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
  
  // Generează și salvează versiunea Buy Me a Coffee
  const bmacContent = generateBMAC(toateTurele);
  fs.writeFileSync(BMAC_FILE, bmacContent, 'utf8');
  console.log(`✅ Buy Me a Coffee salvat în: ${BMAC_FILE}`);
  
  return output;
}

// Rulează
runAllScrapers().catch(console.error);
