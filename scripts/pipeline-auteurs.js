#!/usr/bin/env node

/**
 * pipeline-auteurs.js
 * BooksVersusMovies.com — The Auteurs hub + individual director pages
 *
 * Stage 1: Scans pipeline/2-revised/ and groups pages by director.
 *           Directors with 2+ pages qualify as auteurs.
 * Stage 2: For each qualifying director, generates a 2-3 sentence
 *           critical description via Claude Sonnet based on their
 *           actual record on the site.
 * Stage 3: Saves descriptions to config/auteurs.json for editorial review.
 * Stage 4: Renders /auteurs.html hub page + individual /auteur/*.html pages.
 *
 * Usage:
 *   node pipeline-auteurs.js --generate    (Stage 1+2: scan + generate descriptions)
 *   node pipeline-auteurs.js --render      (Stage 3+4: render pages from config)
 *   node pipeline-auteurs.js --all         (run all stages)
 *   node pipeline-auteurs.js --dry         (scan only, no API calls or rendering)
 *   node pipeline-auteurs.js --min 2       (minimum pages to qualify, default 2)
 *
 * After --generate, review config/auteurs.json before running --render.
 * Destination: scripts/pipeline-auteurs.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const DO_GENERATE = hasFlag('--generate') || hasFlag('--all');
const DO_RENDER   = hasFlag('--render')   || hasFlag('--all');
const DRY_RUN     = hasFlag('--dry');
const MIN_PAGES   = parseInt(get('--min', '2'));

const ROOT         = path.resolve(__dirname, '..');

// ── Render nav from config/nav.json ──────────────────────────────────────────

function renderNav() {
  const navPath = path.join(ROOT, 'config', 'nav.json');
  if (!fs.existsSync(navPath)) {
    return `<a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/upcoming-adaptations">Upcoming</a> &nbsp;&middot;&nbsp;
      <a href="/spotlight-lonesome-dove">Featured</a> &nbsp;&middot;&nbsp;
      <a href="/auteurs">The Auteurs</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>`;
  }
  const items = JSON.parse(fs.readFileSync(navPath, 'utf8')).items;
  return items
    .map((item, i) => {
      const mid = i < items.length - 1 ? ` &nbsp;&middot;&nbsp;` : '';
      return `<a href="${item.href}">${item.label}</a>${mid}`;
    })
    .join('\n      ');
}

const SRC_DIR      = path.join(ROOT, 'pipeline', '2-revised');
const OUT_DIR      = path.join(ROOT, 'pipeline', '3-rendered', 'auteur');
const AUTEURS_CFG  = path.join(ROOT, 'data', 'auteurs.json');
const SITE_URL     = 'https://booksversusmovies.com';
const GA_ID        = 'G-P0DY0XDWVV';
const YEAR         = new Date().getFullYear();

const esc = s => (s || '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY = process.env.OPENROUTER_API_KEY;

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Stage 1: Scan and group by director ──────────────────────────────────────

function scanDirectors() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  const map   = {};

  for (const file of files) {
    try {
      const r = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
      if (!r.director) continue;

      const key = r.director;
      if (!map[key]) map[key] = { director: r.director, slug: toSlug(r.director), pages: [] };

      map[key].pages.push({
        slug:        r.slug,
        bookTitle:   r.bookTitle,
        filmYear:    r.filmYear,
        verdictText: r.verdictText,
        verdictClass: r.verdictClass,
        oneLineReason: r.quickAnswer?.oneLineReason || '',
        verdictBox:  r.verdictBox || '',
        genre:       r.genre || '',
      });
    } catch { /* skip */ }
  }

  // Filter to minimum pages
  return Object.values(map)
    .filter(d => d.pages.length >= MIN_PAGES)
    .sort((a, b) => b.pages.length - a.pages.length || a.director.localeCompare(b.director));
}

// ── Stage 2: Generate description via Sonnet ─────────────────────────────────

function buildPrompt(directorData) {
  const record = directorData.pages.map(p =>
    `- ${p.bookTitle} (${p.filmYear || 'TBA'}) — ${p.verdictText}. ${p.oneLineReason}`
  ).join('\n');

  const bookWins  = directorData.pages.filter(p => p.verdictClass === 'verdict-book').length;
  const filmWins  = directorData.pages.filter(p => p.verdictClass === 'verdict-film').length;
  const ties      = directorData.pages.filter(p => p.verdictClass === 'verdict-tie').length;

  return `You are writing a critical director profile for BooksVersusMovies.com — a book-to-film comparison site with a sharp, opinionated voice.

SITE VOICE:
- Precise, critical, no hedging
- Writes like a knowledgeable film critic
- Strong opinions defended with specific evidence
- Never generic ("known for visual style") — always specific

DIRECTOR: ${directorData.director}
RECORD ON THIS SITE: ${bookWins} book win(s), ${filmWins} film win(s), ${ties} tie(s)

THEIR ADAPTATIONS ON THIS SITE:
${record}

Write a 2-3 sentence critical description of this director's relationship with source material. Base it entirely on the evidence above — their actual record, the specific verdicts, the oneLineReasons. Make a specific claim about what they do well or badly as an adaptor. Be opinionated.

Return ONLY the description. No heading, no director name, no preamble.`;
}

async function callSonnet(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      'anthropic/claude-sonnet-4-5',
      max_tokens: 300,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'openrouter.ai',
      path:     '/api/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   SITE_URL,
        'X-Title':        'BooksVersusMovies Auteurs',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { reject(new Error(parsed.error.message)); return; }
          resolve(parsed.choices?.[0]?.message?.content?.trim() || '');
        } catch (e) { reject(e); }
      });
    });

    req.setTimeout(60000, () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Stage 3: Load/save config ─────────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(AUTEURS_CFG)) return {};
  return JSON.parse(fs.readFileSync(AUTEURS_CFG, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(AUTEURS_CFG, JSON.stringify(config, null, 2), 'utf8');
}

// ── Stage 4: Render individual auteur page ────────────────────────────────────

function verdictLabel(verdictClass) {
  if (verdictClass === 'verdict-book') return 'Book Wins';
  if (verdictClass === 'verdict-film') return 'Film Wins';
  return 'Tie';
}

function renderAuteurPage(directorData, description) {
  const bookWins = directorData.pages.filter(p => p.verdictClass === 'verdict-book').length;
  const filmWins = directorData.pages.filter(p => p.verdictClass === 'verdict-film').length;
  const ties     = directorData.pages.filter(p => p.verdictClass === 'verdict-tie').length;

  const filmRows = directorData.pages
    .sort((a, b) => (parseInt(b.filmYear) || 0) - (parseInt(a.filmYear) || 0))
    .map(p => `
    <a class="auteur-film" href="${SITE_URL}/${esc(p.slug)}">
      <div class="auteur-film-title">${esc(p.bookTitle)}</div>
      <div class="auteur-film-year">${esc(String(p.filmYear || 'TBA'))}</div>
      <div class="auteur-film-verdict">
        <span class="verdict-badge ${esc(p.verdictClass)}">${esc(verdictLabel(p.verdictClass))}</span>
      </div>
      <div class="auteur-film-reason">${esc(p.oneLineReason)}</div>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(directorData.director)}: Book Adaptations — BooksVersusMovies.com</title>
  <meta name="description" content="${esc(directorData.director)}'s adaptation record: ${bookWins} book win(s), ${filmWins} film win(s), ${ties} tie(s). Full breakdown of every adaptation on BooksVersusMovies.com.">
  <link rel="canonical" href="${SITE_URL}/auteur/${esc(directorData.slug)}">
  <link rel="stylesheet" href="/css/style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <style>
    .auteur-hero { background: var(--ink); color: var(--cream); padding: 3rem 2rem 2.5rem; text-align: center; border-bottom: 3px solid var(--gold); }
    .auteur-hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700; margin-bottom: 0.5rem; }
    .auteur-hero .label { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.75rem; }
    .auteur-record { display: flex; gap: 2rem; justify-content: center; margin: 1.5rem 0 0; flex-wrap: wrap; }
    .auteur-record-item { text-align: center; font-size: 0.78rem; color: #888; letter-spacing: 0.06em; }
    .auteur-record-item strong { display: block; font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--gold); margin-bottom: 0.1rem; }
    .auteur-wrap { max-width: var(--max-w); margin: 0 auto; padding: 2.5rem 2rem 4rem; }
    .auteur-bio { font-size: 1.05rem; line-height: 1.75; color: var(--ink-light); font-style: italic; border-left: 3px solid var(--gold); padding-left: 1.25rem; margin-bottom: 2.5rem; }
    .auteur-films-heading { font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: #999; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--rule); }
    .auteur-film { display: grid; grid-template-columns: 1fr auto auto; grid-template-rows: auto auto; gap: 0.2rem 1.5rem; padding: 1.1rem 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); align-items: center; transition: background 0.15s; border-radius: 3px; }
    .auteur-film:hover { background: #faf7f2; padding-left: 0.5rem; }
    .auteur-film:last-child { border-bottom: none; }
    .auteur-film-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; grid-column: 1; grid-row: 1; }
    .auteur-film-reason { font-size: 0.85rem; color: var(--ink-light); font-style: italic; grid-column: 1; grid-row: 2; }
    .auteur-film-year { font-size: 0.8rem; color: #999; grid-column: 2; grid-row: 1; text-align: right; }
    .auteur-film-verdict { grid-column: 3; grid-row: 1 / 3; display: flex; align-items: center; }
    .back-link { display: inline-block; font-size: 0.8rem; color: var(--gold); text-decoration: none; letter-spacing: 0.06em; margin-bottom: 2rem; }
    .back-link:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .auteur-film { grid-template-columns: 1fr auto; }
      .auteur-film-year { display: none; }
    }
  </style>
</head>
<body>
<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
      ${renderNav()}
    </nav>
  </div>
</header>

<div class="auteur-hero">
  <div class="label">The Auteurs</div>
  <h1>${esc(directorData.director)}</h1>
  <div class="auteur-record">
    <div class="auteur-record-item"><strong>${directorData.pages.length}</strong>adaptations</div>
    <div class="auteur-record-item"><strong>${bookWins}</strong>book wins</div>
    <div class="auteur-record-item"><strong>${filmWins}</strong>film wins</div>
    <div class="auteur-record-item"><strong>${ties}</strong>ties</div>
  </div>
</div>

<div class="auteur-wrap">
  <a class="back-link" href="/auteurs">← All Auteurs</a>
  ${description ? `<div class="auteur-bio">${esc(description)}</div>` : ''}
  <div class="auteur-films-heading">Adaptations on this site</div>
  ${filmRows}
</div>

<footer>
  <p>&copy; ${YEAR} RavensEdge AI, LLC &nbsp;&mdash;&nbsp; operating BooksVersusMovies.com</p>
  <p style="margin-top:0.5rem;font-size:0.75rem;">RavensEdge AI, LLC is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.</p>
</footer>
</body>
</html>`;
}

// ── Render single auteurs page ───────────────────────────────────────────────

function renderAuteursPage(auteurs, config) {
  const tableRows = auteurs.map(d => {
    const bw = d.pages.filter(p => p.verdictClass === 'verdict-book').length;
    const fw = d.pages.filter(p => p.verdictClass === 'verdict-film').length;
    const tw = d.pages.filter(p => p.verdictClass === 'verdict-tie').length;
    const titles = d.pages.map(p => `<a href="${SITE_URL}/${esc(p.slug)}">${esc(p.bookTitle)}</a>`).join(', ');

    return `    <tr>
      <td class="at-name">${esc(d.director)}</td>
      <td class="at-count">${d.pages.length}</td>
      <td class="at-stat">${bw}</td>
      <td class="at-stat">${fw}</td>
      <td class="at-stat">${tw}</td>
      <td class="at-titles">${titles}</td>
    </tr>`;
  }).join('\n');

  const profiles = auteurs
    .filter(d => config[d.slug]?.description)
    .map(d => {
      const desc = config[d.slug].description;
      const bw = d.pages.filter(p => p.verdictClass === 'verdict-book').length;
      const fw = d.pages.filter(p => p.verdictClass === 'verdict-film').length;
      const tw = d.pages.filter(p => p.verdictClass === 'verdict-tie').length;
      return `  <div class="ap-profile">
    <h2 class="ap-name">${esc(d.director)}</h2>
    <div class="ap-record">${d.pages.length} adaptations &nbsp;&middot;&nbsp; ${bw} book &nbsp;&middot;&nbsp; ${fw} film &nbsp;&middot;&nbsp; ${tw} tie</div>
    <p class="ap-bio">${esc(desc)}</p>
  </div>`;
    }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Auteurs — Directors and Their Adaptations — BooksVersusMovies.com</title>
  <meta name="description" content="Directors who keep coming back to the page. Adaptation records and critical profiles for ${auteurs.length} directors on BooksVersusMovies.com.">
  <link rel="canonical" href="${SITE_URL}/auteurs">
  <link rel="stylesheet" href="css/style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <style>
    .auteurs-hero { background: var(--ink); color: var(--cream); padding: 3rem 2rem 2.5rem; text-align: center; border-bottom: 3px solid var(--gold); }
    .auteurs-hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 700; margin-bottom: 0.5rem; }
    .auteurs-hero h1 em { font-style: italic; color: var(--gold); }
    .auteurs-hero p { font-size: 1rem; color: #a09888; max-width: 480px; margin: 0 auto; }
    .auteurs-wrap { max-width: var(--max-w); margin: 0 auto; padding: 2.5rem 2rem 4rem; }
    .at-section-label { font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: #999; margin-bottom: 1rem; }
    .at-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-bottom: 3.5rem; }
    .at-table th { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: #999; font-weight: 400; text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid var(--rule); }
    .at-table th.at-stat, .at-table td.at-stat { text-align: center; }
    .at-table tr:hover td { background: #faf7f2; }
    .at-table td { padding: 0.75rem; border-bottom: 1px solid var(--rule); vertical-align: top; }
    .at-name { font-family: 'Playfair Display', serif; font-weight: 700; white-space: nowrap; }
    .at-count { color: #999; text-align: center; }
    .at-stat { color: #666; }
    .at-titles { font-size: 0.8rem; color: var(--ink-light); }
    .at-titles a { color: var(--gold); text-decoration: none; }
    .at-titles a:hover { text-decoration: underline; }
    .ap-divider { border: none; border-top: 2px solid var(--rule); margin-bottom: 3rem; }
    .ap-profile { margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--rule); }
    .ap-profile:last-child { border-bottom: none; }
    .ap-name { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; margin-bottom: 0.25rem; }
    .ap-record { font-size: 0.75rem; color: #999; letter-spacing: 0.06em; margin-bottom: 0.75rem; }
    .ap-bio { font-size: 0.95rem; line-height: 1.75; color: var(--ink-light); font-style: italic; border-left: 3px solid var(--gold); padding-left: 1.25rem; margin: 0; }
    @media (max-width: 700px) {
      .at-titles { display: none; }
      .at-table th:last-child { display: none; }
    }
  </style>
</head>
<body>
<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
      ${renderNav()}
    </nav>
  </div>
</header>

<div class="auteurs-hero">
  <h1>The <em>Auteurs</em></h1>
  <p>Directors who keep coming back to the page — and their honest adaptation record.</p>
</div>

<div class="auteurs-wrap">

  <div class="at-section-label">Adaptation record</div>
  <table class="at-table">
    <thead>
      <tr>
        <th>Director</th>
        <th class="at-stat">Pages</th>
        <th class="at-stat">Book</th>
        <th class="at-stat">Film</th>
        <th class="at-stat">Tie</th>
        <th>Adaptations</th>
      </tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>

  <hr class="ap-divider">
  <div class="at-section-label">Critical profiles</div>

${profiles}

</div>

<footer>
  <p>&copy; ${YEAR} RavensEdge AI, LLC &nbsp;&mdash;&nbsp; operating BooksVersusMovies.com</p>
  <p style="margin-top:0.5rem;font-size:0.75rem;">RavensEdge AI, LLC is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.</p>
</footer>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const auteurs = scanDirectors();

  console.log(`\npipeline-auteurs.js`);
  console.log(`Qualifying directors (${MIN_PAGES}+ pages): ${auteurs.length}`);
  auteurs.forEach(d => {
    const bw = d.pages.filter(p => p.verdictClass === 'verdict-book').length;
    const fw = d.pages.filter(p => p.verdictClass === 'verdict-film').length;
    const tw = d.pages.filter(p => p.verdictClass === 'verdict-tie').length;
    console.log(`  ${d.director.padEnd(30)} ${d.pages.length} pages  ${bw}B ${fw}F ${tw}T`);
  });

  if (DRY_RUN) { console.log('\n[DRY] Stopping here.'); return; }

  // Stage 2: Generate descriptions
  let config = loadConfig();

  if (DO_GENERATE) {
    if (!API_KEY) { console.error('✗ OPENROUTER_API_KEY not set'); process.exit(1); }
    console.log(`\nGenerating descriptions for ${auteurs.length} directors...`);

    for (const d of auteurs) {
      if (config[d.slug]?.description) {
        console.log(`  → ${d.director} — already in config, skipping`);
        continue;
      }
      process.stdout.write(`  ↻  ${d.director}...`);
      try {
        const prompt = buildPrompt(d);
        const desc   = await callSonnet(prompt);
        config[d.slug] = { director: d.director, slug: d.slug, description: desc };
        process.stdout.write(` ✓\n`);
      } catch (e) {
        process.stdout.write(` ✗ ${e.message}\n`);
        config[d.slug] = { director: d.director, slug: d.slug, description: '' };
      }
    }

    saveConfig(config);
    console.log(`\n✓ Descriptions saved to config/auteurs.json`);
    console.log(`  Review and edit before running --render`);
  }

  // Stage 4: Render pages
  if (DO_RENDER) {
    config = loadConfig();
    const rootOut = path.join(ROOT, 'pipeline', '3-rendered');

    // Render single auteurs page
    console.log(`\nRendering auteurs page...`);
    const html    = renderAuteursPage(auteurs, config);
    const outPath = path.join(rootOut, 'auteurs.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  ✓  /auteurs`);

    console.log(`\n✓ Done`);
    console.log(`\nNext: xcopy pipeline\\3-rendered\\auteurs.html . /Y`);
  }
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
