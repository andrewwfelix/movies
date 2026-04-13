#!/usr/bin/env node

/**
 * pipeline-browse.js
 * BooksVersusMovies.com — landing page + browse generator
 *
 * Generates index.html with a landing page hero, featured spotlight,
 * trust block, verdict filters, and full browse list.
 *
 * Usage:
 *   node pipeline-browse.js
 *   node pipeline-browse.js --featured dune,gone-girl,atonement,the-shining,fight-club,wolf-hall
 *   node pipeline-browse.js --sort year   (default: film year descending)
 *   node pipeline-browse.js --sort alpha
 *   node pipeline-browse.js --dry
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SRC_DIR       = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_PATH      = path.resolve(__dirname, '../index.html');
const SORT          = get('--sort', 'year');
const DRY_RUN       = hasFlag('--dry');
const FEATURED_ARG  = get('--featured', null);

// Default featured slugs — highest hype, most searched
const DEFAULT_FEATURED = [
  'verity',
  'reminders-of-him',
  'dune',
  'the-shining',
  'gone-girl',
  'atonement',
];

const SITE_URL = 'https://booksversusmovies.com';
const GA_ID    = 'G-P0DY0XDWVV';
const YEAR     = new Date().getFullYear();

const esc = s => (s || '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Load records ──────────────────────────────────────────────────────────────

function loadRecords() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  return files.map(file => {
    try { return JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8')); }
    catch { return null; }
  }).filter(Boolean);
}

function sortRecords(records) {
  if (SORT === 'alpha') {
    return [...records].sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''));
  }
  return [...records].sort((a, b) => {
    const ay = parseInt(a.filmYear) || 0;
    const by = parseInt(b.filmYear) || 0;
    return by !== ay ? by - ay : (a.bookTitle || '').localeCompare(b.bookTitle || '');
  });
}

// ── Spotlight card ────────────────────────────────────────────────────────────

function renderSpotlightCard(r) {
  // oneLineReason is the sharpest specific claim — use it as the hook
  const hook = r.quickAnswer?.oneLineReason
    || (r.pageTitle?.includes(': ') ? r.pageTitle.split(': ').slice(1).join(': ') : r.pageTitle);
  const meta = [r.author, r.filmYear && r.filmYear !== 'TBA' ? r.filmYear : null]
    .filter(Boolean).join(' · ');

  return `      <a class="spotlight-card" href="/${esc(r.slug)}">
        <div class="spotlight-cover">
          <img src="images/${esc(r.bookCoverImage)}" alt="${esc(r.bookTitle)} book cover" loading="lazy">
        </div>
        <div class="spotlight-body">
          <span class="verdict-badge ${esc(r.verdictClass)}">${esc(r.verdictText)}</span>
          <div class="spotlight-title">${esc(r.bookTitle)}</div>
          <div class="spotlight-hook">${esc(hook)}</div>
          <div class="spotlight-meta">${esc(meta)}</div>
        </div>
      </a>`;
}

// ── Browse row ────────────────────────────────────────────────────────────────

function renderRow(r) {
  const blurb = (r.storyBrief || '').split('\n\n')[0];
  const mediaYear = r.filmYear && r.filmYear !== 'TBA'
    ? `${esc(r.mediaLabel || 'Film')}: ${esc(String(r.filmYear))}`
    : `${esc(r.mediaLabel || 'Film')}: upcoming`;

  const trailerThumb = r.youtubeId ? `
        <div class="row-trailer">
          <div class="trailer-thumb">
            <img src="https://img.youtube.com/vi/${esc(r.youtubeId)}/mqdefault.jpg"
                 alt="${esc(r.bookTitle)} trailer" loading="lazy">
            <div class="play-icon"></div>
          </div>
        </div>` : '';

  return `    <a class="row" href="/${esc(r.slug)}" data-verdict="${esc(r.verdictClass)}">
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

// ── Full page ─────────────────────────────────────────────────────────────────

function renderPage(records) {
  const sorted   = sortRecords(records);
  const featured = (FEATURED_ARG ? FEATURED_ARG.split(',') : DEFAULT_FEATURED)
    .map(slug => records.find(r => r.slug === slug.trim()))
    .filter(Boolean);

  const counts = {
    total: records.length,
    book:  records.filter(r => r.verdictClass === 'verdict-book').length,
    film:  records.filter(r => r.verdictClass === 'verdict-film').length,
    tie:   records.filter(r => r.verdictClass === 'verdict-tie').length,
  };

  const spotlightHtml = featured.map(renderSpotlightCard).join('\n');
  const rowsHtml      = sorted.map(renderRow).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book vs Movie Comparisons — BooksVersusMovies.com</title>
  <meta name="description" content="${counts.total} honest book vs film comparisons. We pick a winner every time — no both-sides hedging. Find out which version is worth your time.">
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
    "potentialAction": { "@type": "SearchAction", "target": "${SITE_URL}/?q={search_term_string}", "query-input": "required name=search_term_string" }
  }
  </script>
  <style>
    .browse-hero { background: var(--ink); color: var(--cream); padding: 4rem 2rem 3.5rem; text-align: center; border-bottom: 3px solid var(--gold); }
    .browse-hero h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 700; line-height: 1.1; margin-bottom: 0.75rem; }
    .browse-hero h1 em { font-style: italic; color: var(--gold); }
    .browse-hero .tagline { font-size: 1.1rem; color: #a09888; max-width: 520px; margin: 0 auto 2rem; line-height: 1.55; }
    .browse-stats { display: flex; gap: 2.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 0; }
    .browse-stat { font-size: 0.78rem; color: #777; letter-spacing: 0.08em; text-align: center; }
    .browse-stat strong { color: var(--gold); font-size: 1.3rem; display: block; margin-bottom: 0.15rem; font-family: 'Playfair Display', serif; }

    .trust-strip { background: #141210; border-bottom: 1px solid #2a2520; padding: 1.25rem 2rem; }
    .trust-inner { max-width: var(--max-w); margin: 0 auto; display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; }
    .trust-item { font-size: 0.78rem; color: #888; letter-spacing: 0.06em; display: flex; align-items: center; gap: 0.5rem; }
    .trust-item::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }

    .spotlight-section { background: var(--book-col); border-bottom: 1px solid var(--rule); padding: 2.5rem 2rem; }
    .spotlight-inner { max-width: var(--max-w); margin: 0 auto; }
    .spotlight-heading { font-family: 'Playfair Display', serif; font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem; }
    .spotlight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.25rem; }
    .spotlight-card { display: flex; flex-direction: column; text-decoration: none; color: var(--ink); background: white; border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
    .spotlight-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); border-color: var(--gold); }
    .spotlight-cover { background: var(--film-col); padding: 1.25rem; display: flex; justify-content: center; }
    .spotlight-cover img { height: 160px; width: auto; object-fit: cover; box-shadow: 3px 5px 16px rgba(0,0,0,0.4); border-radius: 2px; }
    .spotlight-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
    .spotlight-title { font-family: 'Playfair Display', serif; font-size: 0.95rem; font-weight: 700; line-height: 1.3; }
    .spotlight-hook { font-size: 0.78rem; color: var(--ink-light); font-style: italic; line-height: 1.45; flex: 1; }
    .spotlight-meta { font-size: 0.72rem; color: #999; margin-top: auto; }

    .browse-controls { max-width: var(--max-w); margin: 0 auto; padding: 1.5rem 2rem 0; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .controls-label { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-right: 0.25rem; }
    .filter-btn { padding: 0.4em 1.1em; font-size: 0.78rem; letter-spacing: 0.05em; border: 1px solid var(--rule); border-radius: 2px; background: white; color: var(--ink-light); cursor: pointer; transition: all 0.2s; font-family: 'Source Serif 4', serif; }
    .filter-btn:hover, .filter-btn.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .filter-count { font-size: 0.7em; opacity: 0.65; margin-left: 0.2em; }
    .browse-section-label { max-width: var(--max-w); margin: 0 auto; padding: 1.25rem 2rem 0; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #bbb; }

    .browse-list { max-width: var(--max-w); margin: 0 auto; padding: 0.75rem 2rem 4rem; }
    .row { display: flex; align-items: flex-start; gap: 1.25rem; padding: 1.25rem 0.5rem; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); transition: background 0.15s; border-radius: 3px; }
    .row:hover { background: #faf7f2; }
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
    .row-trailer { flex-shrink: 0; width: 110px; }
    .trailer-thumb { position: relative; border-radius: 2px; overflow: hidden; }
    .trailer-thumb img { width: 110px; height: 62px; object-fit: cover; display: block; }
    .play-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 26px; height: 26px; background: rgba(26,23,20,0.78); border: 1px solid var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .play-icon::after { content: ''; border-left: 7px solid var(--gold); border-top: 4px solid transparent; border-bottom: 4px solid transparent; margin-left: 2px; }
    .row-arrow { flex-shrink: 0; color: var(--gold); font-size: 1rem; padding-top: 0.2rem; opacity: 0.7; }

    .no-results { padding: 3rem 0; text-align: center; color: #999; font-style: italic; display: none; }

    @media (max-width: 700px) {
      .row-trailer { display: none; }
      .spotlight-grid { grid-template-columns: repeat(2, 1fr); }
      .trust-inner { gap: 1rem; }
    }
    @media (max-width: 400px) {
      .spotlight-grid { grid-template-columns: 1fr 1fr; }
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
  <h1>Book or Movie?<br><em>We Actually Pick a Winner.</em></h1>
  <p class="tagline">Read it or watch it. We'll tell you which comes first — and why the other version falls short.</p>
  <div class="browse-stats">
    <div class="browse-stat"><strong>${counts.total}</strong>comparisons</div>
    <div class="browse-stat"><strong>${counts.book}</strong>book wins</div>
    <div class="browse-stat"><strong>${counts.film}</strong>film wins</div>
    <div class="browse-stat"><strong>${counts.tie}</strong>too close to call</div>
  </div>
</div>

<div class="trust-strip">
  <div class="trust-inner">
    <span class="trust-item">No hedging — we pick a side</span>
    <span class="trust-item">Specific arguments, not summaries</span>
    <span class="trust-item">Independent verdicts</span>
    <span class="trust-item">Read first advice on every page</span>
  </div>
</div>

<div class="spotlight-section">
  <div class="spotlight-inner">
    <div class="spotlight-heading">Essential comparisons</div>
    <div class="spotlight-grid">
${spotlightHtml}
    </div>
  </div>
</div>

<div class="browse-controls">
  <span class="controls-label">Filter</span>
  <button class="filter-btn active" data-filter="all" aria-label="Show all comparisons">All <span class="filter-count">${counts.total}</span></button>
  <button class="filter-btn" data-filter="verdict-book" aria-label="Show book wins">Book Wins <span class="filter-count">${counts.book}</span></button>
  <button class="filter-btn" data-filter="verdict-film" aria-label="Show film wins">Film Wins <span class="filter-count">${counts.film}</span></button>
  <button class="filter-btn" data-filter="verdict-tie" aria-label="Show too close to call">Too Close to Call <span class="filter-count">${counts.tie}</span></button>
</div>

<div class="browse-section-label">All ${counts.total} comparisons</div>

<div class="browse-list" id="browse-list">
${rowsHtml}
  <p class="no-results" id="no-results">No comparisons match this filter.</p>
</div>

<footer>
  <p>&copy; ${YEAR} BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="/">Home</a> &nbsp;&middot;&nbsp; <a href="/about">About</a></p>
  <p style="margin-top:0.5rem;font-size:0.75rem;color:#444;">As an Amazon Associate I earn from qualifying purchases.</p>
</footer>

<script>
  const btns = document.querySelectorAll('.filter-btn');
  const rows = document.querySelectorAll('.row');
  const noResults = document.getElementById('no-results');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      let visible = 0;
      rows.forEach(row => {
        const show = filter === 'all' || row.dataset.verdict === filter;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      noResults.style.display = visible === 0 ? 'block' : 'none';
    });
  });
</script>

</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`\u2717 Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const records = loadRecords();
  if (records.length === 0) {
    console.error('\u2717 No records found');
    process.exit(1);
  }

  const featuredSlugs = FEATURED_ARG ? FEATURED_ARG.split(',') : DEFAULT_FEATURED;
  const featuredFound = featuredSlugs.filter(s => records.find(r => r.slug === s.trim()));

  console.log(`\npipeline-browse.js`);
  console.log(`Records:   ${records.length}`);
  console.log(`Featured:  ${featuredFound.join(', ')}`);
  console.log(`Sort:      ${SORT}`);
  console.log(`Output:    ${OUT_PATH}`);

  const html = renderPage(records);

  if (DRY_RUN) {
    console.log(`\n[DRY] Would write ${html.length} chars to ${OUT_PATH}`);
    return;
  }

  fs.writeFileSync(OUT_PATH, html, 'utf8');
  console.log(`\n\u2713 index.html written (${html.length} chars)`);
  console.log(`  ${records.length} rows + ${featuredFound.length} spotlight cards`);
  console.log(`\nRun node scripts\\sitemap-generate.js next.`);
}

run();
