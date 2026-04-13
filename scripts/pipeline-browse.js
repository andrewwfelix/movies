#!/usr/bin/env node

/**
 * pipeline-browse.js
 * BooksVersusMovies.com — browse page (index.html) generator
 *
 * Reads all JSON files from pipeline/2-revised/ and generates a complete
 * index.html browse page. Same template pattern as pipeline-render.js —
 * data injected into structure, no LLM involved.
 *
 * Usage:
 *   node pipeline-browse.js
 *   node pipeline-browse.js --out ../index.html
 *   node pipeline-browse.js --sort alpha       (alphabetical, default)
 *   node pipeline-browse.js --sort genre       (grouped by genre)
 *   node pipeline-browse.js --sort verdict     (Book Wins first)
 *   node pipeline-browse.js --dry              (print without writing)
 *
 * Output: index.html at project root (or --out path)
 * Run after pipeline-render.js, before deployment.
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SRC_DIR  = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_PATH = path.resolve(__dirname, get('--out', '../index.html'));
const SORT     = get('--sort', 'alpha');
const DRY_RUN  = hasFlag('--dry');

const SITE_URL = 'https://booksversusmovies.com';
const GA_ID    = 'G-P0DY0XDWVV';
const YEAR     = new Date().getFullYear();

const esc = s => (s || '')
  .replace(/&/g,  '&amp;')
  .replace(/</g,  '&lt;')
  .replace(/>/g,  '&gt;')
  .replace(/"/g,  '&quot;');

// ── Load and sort records ─────────────────────────────────────────────────────

function loadRecords() {
  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(file => {
    try {
      return JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    } catch (e) {
      console.error(`Warning: failed to parse ${file} — ${e.message}`);
      return null;
    }
  }).filter(Boolean);
}

function sortRecords(records) {
  switch (SORT) {
    case 'genre':
      return [...records].sort((a, b) => {
        const g = (a.genre || '').localeCompare(b.genre || '');
        return g !== 0 ? g : (a.bookTitle || '').localeCompare(b.bookTitle || '');
      });
    case 'verdict':
      const order = { 'Book Wins': 0, 'Movie Wins': 1, 'Screen Wins': 1, 'Too Close to Call': 2 };
      return [...records].sort((a, b) => {
        const v = (order[a.verdictText] ?? 3) - (order[b.verdictText] ?? 3);
        return v !== 0 ? v : (a.bookTitle || '').localeCompare(b.bookTitle || '');
      });
    default: // alpha
      return [...records].sort((a, b) =>
        (a.bookTitle || '').localeCompare(b.bookTitle || '')
      );
  }
}

// ── Row renderer ──────────────────────────────────────────────────────────────

function renderRow(r) {
  const blurb = (r.storyBrief || '').split('\n\n')[0];
  const mediaYear = r.filmYear && r.filmYear !== 'TBA'
    ? `${esc(r.mediaLabel || 'Film')}: ${esc(String(r.filmYear))}`
    : r.filmYear === 'TBA'
    ? `${esc(r.mediaLabel || 'Film')}: upcoming`
    : esc(r.mediaLabel || 'Film');

  const trailerThumb = r.youtubeId ? `
    <div class="row-trailer">
      <div class="trailer-thumb">
        <img src="https://img.youtube.com/vi/${esc(r.youtubeId)}/mqdefault.jpg"
             alt="${esc(r.bookTitle)} trailer" loading="lazy">
        <div class="play-icon"></div>
        <div class="trailer-label">Official Trailer</div>
      </div>
    </div>` : '';

  return `  <a class="row" href="/${esc(r.slug)}">
    <div class="row-book">
      <img src="images/${esc(r.bookCoverImage)}" alt="${esc(r.bookTitle)} book cover" loading="lazy">
    </div>
    <div class="row-content">
      <span class="row-genre">${esc(r.genre || 'Fiction')}</span>
      <div class="row-title">${esc(r.bookTitle)}</div>
      <div class="row-byline">${esc(r.author)}${r.director ? ` &mdash; ${esc(r.director)}` : ''}</div>
      <p class="row-blurb">${esc(blurb)}</p>
      <div class="row-meta">
        <span class="verdict-badge ${esc(r.verdictClass)}">${esc(r.verdictText)}</span>
        <span class="row-dates">${mediaYear}</span>
      </div>
    </div>${trailerThumb}
    <span class="row-arrow">&#8594;</span>
  </a>`;
}

// ── Genre section headers (for --sort genre) ──────────────────────────────────

function renderRows(records) {
  if (SORT !== 'genre') {
    return records.map(renderRow).join('\n');
  }

  // Group by genre
  const groups = {};
  for (const r of records) {
    const genre = r.genre || 'Other';
    if (!groups[genre]) groups[genre] = [];
    groups[genre].push(r);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([genre, recs]) => `  <div class="genre-section">
    <h2 class="genre-heading">${esc(genre)}</h2>
  </div>
${recs.map(renderRow).join('\n')}`)
    .join('\n\n');
}

// ── Full page ─────────────────────────────────────────────────────────────────

function renderPage(records) {
  const sorted   = sortRecords(records);
  const rowsHtml = renderRows(sorted);

  const verdictCounts = {
    book:  records.filter(r => r.verdictClass === 'verdict-book').length,
    film:  records.filter(r => r.verdictClass === 'verdict-film').length,
    tie:   records.filter(r => r.verdictClass === 'verdict-tie').length,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book vs Movie Comparisons — BooksVersusMovies.com</title>
  <meta name="description" content="163 honest book vs film comparisons. We tell you which version is better, whether to read first, and what the adaptation gets wrong.">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="stylesheet" href="css/style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BooksVersusMovies.com",
    "url": "${SITE_URL}",
    "description": "Honest book vs film comparisons with clear verdicts.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "${SITE_URL}/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  <style>
    .browse-hero { background: var(--ink); color: var(--cream); padding: 3rem 2rem 2.5rem; text-align: center; border-bottom: 3px solid var(--gold); }
    .browse-hero h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 700; margin-bottom: 0.75rem; }
    .browse-hero h1 em { font-style: italic; color: var(--gold); }
    .browse-hero p { font-size: 1rem; color: #a09888; max-width: 560px; margin: 0 auto 1.5rem; }
    .browse-stats { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
    .browse-stat { font-size: 0.8rem; color: #888; letter-spacing: 0.06em; }
    .browse-stat strong { color: var(--gold); font-size: 1.1rem; display: block; }
    .browse-filters { max-width: var(--max-w); margin: 1.5rem auto 0; padding: 0 2rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .filter-btn { padding: 0.4em 1em; font-size: 0.78rem; letter-spacing: 0.06em; border: 1px solid var(--rule); border-radius: 2px; background: white; color: var(--ink-light); cursor: pointer; transition: all 0.2s; font-family: 'Source Serif 4', serif; }
    .filter-btn:hover, .filter-btn.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .browse-list { max-width: var(--max-w); margin: 0 auto; padding: 1.5rem 2rem 4rem; }
    .row { display: flex; align-items: flex-start; gap: 1.25rem; padding: 1.25rem 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); transition: background 0.15s; border-radius: 3px; }
    .row:hover { background: #faf7f2; padding-left: 0.5rem; }
    .row:last-child { border-bottom: none; }
    .row-book { flex-shrink: 0; width: 56px; }
    .row-book img { width: 56px; height: 84px; object-fit: cover; border-radius: 2px; box-shadow: 2px 3px 10px rgba(0,0,0,0.2); display: block; }
    .row-content { flex: 1; min-width: 0; }
    .row-genre { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); display: block; margin-bottom: 0.2rem; }
    .row-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 0.15rem; line-height: 1.3; }
    .row-byline { font-size: 0.82rem; color: var(--ink-light); font-style: italic; margin-bottom: 0.4rem; }
    .row-blurb { font-size: 0.88rem; color: #4a4540; line-height: 1.55; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .row-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .row-dates { font-size: 0.75rem; color: #999; }
    .row-trailer { flex-shrink: 0; width: 120px; }
    .trailer-thumb { position: relative; border-radius: 2px; overflow: hidden; }
    .trailer-thumb img { width: 120px; height: 68px; object-fit: cover; display: block; }
    .play-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 28px; height: 28px; background: rgba(26,23,20,0.75); border: 1px solid var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .play-icon::after { content: ''; border-left: 8px solid var(--gold); border-top: 5px solid transparent; border-bottom: 5px solid transparent; margin-left: 2px; }
    .trailer-label { font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; color: #888; text-align: center; padding: 0.2rem 0; background: var(--book-col); }
    .row-arrow { flex-shrink: 0; color: var(--gold); font-size: 1.1rem; padding-top: 0.25rem; }
    .genre-heading { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--ink-light); padding: 1.5rem 0 0.5rem; border-bottom: 1px solid var(--rule); margin-bottom: 0; }
    @media (max-width: 600px) {
      .row-trailer { display: none; }
      .row-book { width: 44px; }
      .row-book img { width: 44px; height: 66px; }
    }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
      <a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>
    </nav>
  </div>
</header>

<div class="browse-hero">
  <h1>Books <em>Versus</em> Movies</h1>
  <p>Read it or watch it. We'll tell you which comes first.</p>
  <div class="browse-stats">
    <div class="browse-stat"><strong>${records.length}</strong>comparisons</div>
    <div class="browse-stat"><strong>${verdictCounts.book}</strong>book wins</div>
    <div class="browse-stat"><strong>${verdictCounts.film}</strong>film wins</div>
    <div class="browse-stat"><strong>${verdictCounts.tie}</strong>too close to call</div>
  </div>
</div>

<div class="browse-filters">
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn" data-filter="verdict-book">Book Wins</button>
  <button class="filter-btn" data-filter="verdict-film">Film Wins</button>
  <button class="filter-btn" data-filter="verdict-tie">Too Close to Call</button>
</div>

<div class="browse-list" id="browse-list">
${rowsHtml}
</div>

<footer>
  <p>&copy; ${YEAR} BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="/">Home</a> &nbsp;&middot;&nbsp; <a href="/about">About</a></p>
  <p style="margin-top:0.5rem;font-size:0.75rem;color:#444;">As an Amazon Associate I earn from qualifying purchases.</p>
</footer>

<script>
  // Client-side verdict filter
  const btns = document.querySelectorAll('.filter-btn');
  const rows = document.querySelectorAll('.row');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      rows.forEach(row => {
        if (filter === 'all') {
          row.style.display = '';
        } else {
          const badge = row.querySelector('.verdict-badge');
          row.style.display = badge?.classList.contains(filter) ? '' : 'none';
        }
      });
    });
  });
</script>

</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const records = loadRecords();
  if (records.length === 0) {
    console.error('✗ No records found in pipeline/2-revised/');
    process.exit(1);
  }

  console.log(`pipeline-browse.js`);
  console.log(`Records: ${records.length}`);
  console.log(`Sort:    ${SORT}`);
  console.log(`Output:  ${OUT_PATH}`);

  const html = renderPage(records);

  if (DRY_RUN) {
    console.log(`\n[DRY] Would write ${html.length} chars to ${OUT_PATH}`);
    return;
  }

  fs.writeFileSync(OUT_PATH, html, 'utf8');
  console.log(`\n✓ index.html written (${html.length} chars)`);
  console.log(`  ${records.length} review rows`);
  console.log(`\nRun node scripts\\sitemap-generate.js next.`);
}

run();
