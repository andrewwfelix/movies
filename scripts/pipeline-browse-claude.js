#!/usr/bin/env node

/**
 * pipeline-browse.js
 * BooksVersusMovies.com — landing page + browse generator
 *
 * Generates index.html with a strong visual hook, early book covers,
 * stats, verdict badges, filters, and full browse list.
 *
 * Usage (run from project root):
 *   node scripts/pipeline-browse.js
 *   node scripts/pipeline-browse.js --featured dune,gone-girl,atonement,the-shining,fight-club
 *   node scripts/pipeline-browse.js --sort alpha
 *   node scripts/pipeline-browse.js --dry
 *
 * Destination: scripts/pipeline-browse.js
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const ROOT = path.resolve(__dirname, '..');

function renderNav() {
  const navPath = path.join(ROOT, 'config', 'nav.json');
  if (!fs.existsSync(navPath)) {
    return `<a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/upcoming-adaptations">Upcoming</a> &nbsp;&middot;&nbsp;
      <a href="/featured">Featured</a> &nbsp;&middot;&nbsp;
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

const SRC_DIR      = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_PATH     = path.resolve(__dirname, '../index.html');
const SORT         = get('--sort', 'year');
const DRY_RUN      = hasFlag('--dry');
const FEATURED_ARG = get('--featured', null);

const DEFAULT_FEATURED = [
  'verity', 'reminders-of-him', 'dune', 'the-shining', 'gone-girl', 'atonement',
];

const SITE_URL = 'https://booksversusmovies.com';
const GA_ID    = 'G-P0DY0XDWVV';
const YEAR     = new Date().getFullYear();

const esc = s => (s || '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

function renderSpotlightCard(r) {
  const hook = r.quickAnswer?.oneLineReason
    || (r.pageTitle?.includes(': ') ? r.pageTitle.split(': ').slice(1).join(': ') : r.pageTitle);
  const meta = [r.author, r.filmYear && r.filmYear !== 'TBA' ? r.filmYear : null]
    .filter(Boolean).join(' · ');

  return `      <a class="spotlight-card" href="/${esc(r.slug)}">
        <div class="spotlight-cover">
          <img src="images/${esc(r.bookCoverImage)}" alt="${esc(r.bookTitle)} book cover" loading="lazy">
          <span class="cover-verdict ${esc(r.verdictClass)}">${esc(r.verdictText === 'Too Close to Call' ? 'Tie' : r.verdictText)}</span>
        </div>
        <div class="spotlight-body">
          <div class="spotlight-title">${esc(r.bookTitle)}</div>
          <div class="spotlight-hook">${esc(hook)}</div>
          <div class="spotlight-meta">${esc(meta)}</div>
        </div>
      </a>`;
}

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
    </a>`;
}

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
  <meta name="description" content="${counts.total} honest book vs movie comparisons — clear verdicts, spoilers included, read-first advice on every page. No hedging.">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="stylesheet" href="css/style.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"BooksVersusMovies.com","url":"${SITE_URL}","description":"Honest book vs movie comparisons with clear verdicts.","potentialAction":{"@type":"SearchAction","target":"${SITE_URL}/?q={search_term_string}","query-input":"required name=search_term_string"}}</script>
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

<section class="browse-hero">
  <h1>Book vs Movie</h1>
  <p class="tagline">We pick a winner every time — and explain why the other falls short.</p>
  <a href="#comparisons" class="cta-button">Browse All Comparisons</a>
</section>

<section class="stats-strip">
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-number">${counts.total}</span>
      <span class="stat-label">Comparisons</span>
    </div>
    <div class="stat-item">
      <a href="#comparisons" onclick="document.querySelectorAll('.filter-btn')[1].click();return false;" style="color:inherit;text-decoration:none">
        <span class="stat-number">${counts.book}</span>
        <span class="stat-label">Book Wins</span>
      </a>
    </div>
    <div class="stat-item">
      <a href="#comparisons" onclick="document.querySelectorAll('.filter-btn')[2].click();return false;" style="color:inherit;text-decoration:none">
        <span class="stat-number">${counts.film}</span>
        <span class="stat-label">Film Wins</span>
      </a>
    </div>
    <div class="stat-item">
      <a href="#comparisons" onclick="document.querySelectorAll('.filter-btn')[3].click();return false;" style="color:inherit;text-decoration:none">
        <span class="stat-number">${counts.tie}</span>
        <span class="stat-label">Too Close to Call</span>
      </a>
    </div>
  </div>
</section>

<section id="comparisons" class="spotlight-section">
  <div class="spotlight-inner">
    <div class="spotlight-heading">Essential Comparisons</div>
    <div class="spotlight-grid">
${spotlightHtml}
    </div>
  </div>
</section>

<div class="browse-controls">
  <span class="controls-label">Filter by verdict</span>
  <button class="filter-btn active" data-filter="all">All <span class="filter-count">${counts.total}</span></button>
  <button class="filter-btn" data-filter="verdict-book">Book Wins <span class="filter-count">${counts.book}</span></button>
  <button class="filter-btn" data-filter="verdict-film">Film Wins <span class="filter-count">${counts.film}</span></button>
  <button class="filter-btn" data-filter="verdict-tie">Too Close to Call <span class="filter-count">${counts.tie}</span></button>
</div>

<div class="browse-section-label">All ${counts.total} comparisons</div>

<div class="browse-list" id="browse-list">
${rowsHtml}
  <p class="no-results" id="no-results">No comparisons match this filter.</p>
</div>

<footer>
  <p>&copy; ${YEAR} RavensEdge AI, LLC &nbsp;&mdash;&nbsp; operating BooksVersusMovies.com</p>
  <p style="margin-top:0.5rem;font-size:0.75rem;">RavensEdge AI, LLC is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.</p>
</footer>

<script>
  const btns      = document.querySelectorAll('.filter-btn');
  const rows      = document.querySelectorAll('.row');
  const noResults = document.getElementById('no-results');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      let visible  = 0;
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
  console.log(`\nNext: node scripts/sitemap-generate.js`);
}

run();
