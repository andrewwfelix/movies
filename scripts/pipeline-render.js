#!/usr/bin/env node

/**
 * pipeline-render.js
 * BooksVersusMovies.com — deterministic HTML renderer
 *
 * Reads revised JSON from pipeline/2-revised/ and renders complete HTML
 * pages to pipeline/3-rendered/. No LLM involvement — pure template logic.
 *
 * Deployment: copy pipeline/3-rendered/*.html to project root.
 * CSS path:   css/style.css  (root-relative, correct for Netlify root deploy)
 * Image path: images/slug.jpg (root-relative)
 * Canonical:  https://booksversusmovies.com/slug (extensionless, Pretty URLs)
 *
 * Usage:
 *   node pipeline-render.js
 *   node pipeline-render.js --slug atonement
 *   node pipeline-render.js --all
 *   node pipeline-render.js --all --force
 *
 * Options:
 *   --slug    Render a single page by slug
 *   --all     Render all files in pipeline/2-revised/ (default behaviour)
 *   --force   Overwrite existing files in pipeline/3-rendered/
 *   --out     Output directory (default: ../pipeline/3-rendered)
 */

const fs               = require('fs');
const path             = require('path');
const { createLogger } = require('./logger');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SINGLE_SLUG = get('--slug', null);
const FORCE       = hasFlag('--force');
const ROOT        = path.resolve(__dirname, '..');
const IN_DIR      = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_DIR     = path.resolve(__dirname, get('--out', '../pipeline/3-rendered'));

const SITE_URL    = 'https://booksversusmovies.com';
const GA_ID       = 'G-P0DY0XDWVV';
const YEAR        = new Date().getFullYear();

// ── Encoding helpers ──────────────────────────────────────────────────────────

const esc = s => (s || '')
  .replace(/&/g,  '&amp;')
  .replace(/</g,  '&lt;')
  .replace(/>/g,  '&gt;')
  .replace(/"/g,  '&quot;');

// Convert \n\n separated plain text to <p> tags
const paras = s => (s || '').split('\n\n')
  .map(p => p.trim())
  .filter(Boolean)
  .map(p => `<p>${esc(p)}</p>`)
  .join('\n    ');

// Today's date for lastUpdated
const today = () => new Date().toISOString().split('T')[0];

// ── Section renderers ─────────────────────────────────────────────────────────

function renderHead(r) {
  const canonical = `${SITE_URL}/${r.slug}`;
  const faqSchema = r.faq && r.faq.length > 0 ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      ${r.faq.map(q => `{
        "@type": "Question",
        "name": ${JSON.stringify(q.question)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(q.answer)}
        }
      }`).join(',\n      ')}
    ]
  }
  </script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(r.pageTitle)}</title>
  <meta name="description" content="${esc(r.metaDesc)}">
  <meta name="last-updated" content="${r.lastUpdated || today()}">
  <link rel="canonical" href="${canonical}">
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
    "@type": "Review",
    "name": ${JSON.stringify(`${r.bookTitle}: Book vs ${r.mediaLabel || 'Film'}`)},
    "reviewBody": ${JSON.stringify(r.reviewBody || '')},
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "${r.ratingValue || '4'}",
      "bestRating": "5",
      "worstRating": "3"
    },
    "author": { "@type": "Organization", "name": "BooksVersusMovies.com" },
    "itemReviewed": {
      "@type": "Book",
      "name": ${JSON.stringify(r.bookTitle || '')},
      "author": { "@type": "Person", "name": ${JSON.stringify(r.author || '')} },
      "datePublished": ${JSON.stringify(String(r.bookYear || ''))}
    }
  }
  </script>${faqSchema}
  <style>
    .char-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
    .char-table thead { background: #f0ebe0; }
    .char-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #c8973a; }
    .char-table td { padding: 0.75rem; border-bottom: 1px solid #e0d8c8; vertical-align: top; }
    .char-name { font-weight: 600; color: #2c2416; display: block; margin-bottom: 0.25rem; }
    .char-actor { font-size: 0.85rem; color: #6b6456; font-style: italic; }
    .faq-list { margin: 1.5rem 0; }
    .faq-item { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e0d8c8; }
    .faq-item:last-child { border-bottom: none; }
    .faq-q { font-family: 'Playfair Display', Georgia, serif; font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; color: #1a1714; }
    .faq-a { color: #4a4540; line-height: 1.6; }
  </style>
</head>`;
}

function renderHeader() {
  return `
<body>

<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
      <a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/upcoming-adaptations">Upcoming</a> &nbsp;&middot;&nbsp;
      <a href="/spotlight-lonesome-dove">Featured</a> &nbsp;&middot;&nbsp;
      <a href="/auteurs">The Auteurs</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>
    </nav>
  </div>
</header>`;
}

function renderHero(r) {
  const mediaYear = r.filmYear && r.filmYear !== 'TBA'
    ? `(${r.filmYear})`
    : r.filmYear === 'TBA' ? '(upcoming)' : '';
  const directorPart = r.director ? ` &mdash; ${esc(r.director)}` : '';

  // Strip the book title prefix from pageTitle for the hook line
  // "Dracula: Stoker Never Shows the Monster." → "Stoker Never Shows the Monster."
  const hook = r.pageTitle?.includes(': ')
    ? r.pageTitle.split(': ').slice(1).join(': ')
    : r.pageTitle;

  return `
<div class="page-hero">
  <h1>${esc(r.bookTitle)}</h1>
  <p class="subtitle">${esc(hook)}</p>
  <p class="subtitle-meta">Book (${esc(String(r.bookYear))}) vs. ${esc(r.mediaLabel || 'Film')} ${mediaYear}${directorPart}</p>
</div>`;
}

function renderQuickAnswer(r) {
  if (!r.quickAnswer) return '';
  const qa = r.quickAnswer;
  const cta = r.ctaBlocks?.find(b => b.location === 'after-quick-answer');

  return `
<div class="quick-answer">
  <div class="quick-answer-label">Quick Answer</div>
  <div class="quick-answer-reason-top">
    <strong>Key Difference</strong>
    <p>${esc(qa.oneLineReason)}</p>
  </div>
  <div class="quick-answer-grid">
    <div class="quick-answer-item">
      <strong>Best Version</strong>
      <span>${esc(qa.winner)}</span>
    </div>
    <div class="quick-answer-item">
      <strong>Read First?</strong>
      <span>${esc(qa.readFirst)}</span>
    </div>
  </div>
</div>`;
}

function renderComparisonPanel(r) {
  const trailerBlock = r.youtubeId
    ? `<a class="trailer-link" href="${esc(r.trailerUrl)}" target="_blank" rel="noopener">
        <div class="trailer-thumbnail">
          <img src="https://img.youtube.com/vi/${esc(r.youtubeId)}/maxresdefault.jpg"
               alt="${esc(r.bookTitle)} ${esc(String(r.filmYear || ''))} official trailer" loading="lazy">
          <div class="trailer-play">&#9658;</div>
        </div>
      </a>`
    : r.videoAffiliateLink
    ? `<a class="buy-video-btn" href="${esc(r.videoAffiliateLink)}" target="_blank" rel="noopener sponsored">Buy or Rent &rarr;</a>
      <p class="affiliate-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>`
    : '';

  return `
<div class="comparison">
  <div class="panel-book">
    <div class="panel-label">The Book</div>
    <a class="book-cover-link" href="${esc(r.affiliateLink)}" target="_blank" rel="noopener sponsored">
      <img class="book-cover" src="images/${esc(r.bookCoverImage)}"
           alt="${esc(r.bookTitle)} book cover ${esc(r.author)} ${esc(String(r.bookYear || ''))}" loading="lazy">
    </a>
    <a class="buy-btn" href="${esc(r.affiliateLink)}" target="_blank" rel="noopener sponsored">Buy the Book &rarr;</a>
    <p class="affiliate-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
  </div>
  <div class="panel-film">
    <div class="panel-label">${esc(r.mediaLabel || 'The Film')}</div>
    ${trailerBlock}
    <p class="trailer-note">${esc(r.starringLine || '')}</p>
  </div>
</div>`;
}

function renderMetaStrip(r) {
  const directorItem = r.director
    ? `<div class="meta-item"><strong>Director</strong>${esc(r.director)}</div>`
    : '';
  const mediaReleased = r.mediaLabel
    ? r.mediaLabel.replace('The ', '') + ' Released'
    : 'Film Released';
  const genreItem = r.genre
    ? `<div class="meta-item"><strong>Genre</strong>${esc(r.genre)}</div>`
    : '';

  return `
<div class="meta-strip">
  <div class="meta-item"><strong>Author</strong>${esc(r.author)}</div>
  <div class="meta-item"><strong>Book Published</strong>${esc(String(r.bookYear || ''))}</div>
  <div class="meta-item"><strong>${esc(mediaReleased)}</strong>${esc(String(r.filmYear || ''))}</div>
  ${directorItem}
  ${genreItem}
  <span class="verdict-badge ${esc(r.verdictClass)}">${esc(r.verdictText)}</span>
</div>`;
}

function renderCta(ctaBlock) {
  if (!ctaBlock) return '';
  return `
<div class="cta-block">
  <span class="cta-block-text">Ready to dive in?</span>
  <a class="cta-block-btn" href="${esc(ctaBlock.href)}" target="_blank" rel="noopener sponsored">${esc(ctaBlock.text)}</a>
</div>`;
}

function renderCharTable(r) {
  if (!r.characters || r.characters.length === 0) return '';

  const rows = r.characters.map(c => `      <tr>
        <td><span class="char-name">${esc(c.name)}</span><br><span class="char-actor">${esc(c.actor)}</span></td>
        <td>${esc(c.inBook)}</td>
        <td>${esc(c.inFilm)}</td>
      </tr>`).join('\n');

  return `
<table class="char-table">
  <thead>
    <tr>
      <th>Character</th>
      <th>In the Book</th>
      <th>In the ${esc(r.mediaLabel || 'Film')}</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

function renderDifferences(r) {
  if (!r.differences || r.differences.length === 0) return '';

  const diffs = r.differences.map(d => `
    <div class="difference">
      <h3>${esc(d.title)}</h3>
      ${paras(d.body)}
    </div>`).join('\n');

  return `
    <h2>Key Differences</h2>
${diffs}`;
}

function renderFaq(r) {
  if (!r.faq || r.faq.length === 0) return '';

  const items = r.faq.map(q => `
      <div class="faq-item">
        <div class="faq-q">${esc(q.question)}</div>
        <div class="faq-a">${esc(q.answer)}</div>
      </div>`).join('\n');

  return `
    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
${items}
    </div>`;
}

function renderRelated(r) {
  if (!r.related || r.related.length === 0) return '';

  const cards = r.related.map(rel => `
      <a class="related-card" href="/${esc(rel.slug)}">
        <span class="rel-label">Also Compare</span>${esc(rel.title)}
      </a>`).join('\n');

  return `
  <div class="related-section">
    <h3>${esc(r.relatedSectionTitle || 'More Comparisons')}</h3>
    <div class="related-grid">
${cards}
    </div>
  </div>`;
}

function renderFooter() {
  return `
<footer>
  <p>&copy; ${YEAR} RavensEdge AI, LLC &nbsp;&mdash;&nbsp; operating BooksVersusMovies.com </p>
  <p style="margin-top:0.5rem;font-size:0.75rem;">RavensEdge AI, LLC is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.</p>
</footer>

</body>
</html>`;
}

// ── Full page renderer ────────────────────────────────────────────────────────

function renderPage(r) {
  const ctaAfterReadFirst = r.ctaBlocks?.find(b => b.location === 'after-read-first');
  const ctaAfterVerdict   = r.ctaBlocks?.find(b => b.location === 'after-verdict');

  const spoilerWarning = r.hasSpoilerWarning
    ? `\n    <div class="spoiler-warning" style="background:#f0ebe0;border-left:4px solid #c8973a;padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.85rem;color:#4a4540;">
      &#9888;&#65039; <strong>Contains spoilers</strong> &ndash; We discuss plot details and the ending.
    </div>`
    : '';

  return [
    renderHead(r),
    renderHeader(),
    renderHero(r),

    `\n<div class="page-wrap">`,
    renderQuickAnswer(r),
    renderComparisonPanel(r),
    renderMetaStrip(r),

    `\n  <div class="body-text">`,
    spoilerWarning,

    `\n    <h2>The Story in Brief</h2>`,
    `    ${paras(r.storyBrief)}`,

    renderCharTable(r),
    renderDifferences(r),

    `\n    <h2>Should You Read First?</h2>`,
    `    ${paras(r.readFirst)}`,
    renderCta(ctaAfterReadFirst),

    `\n    <div class="verdict-box">`,
    `      <div class="verdict-title">Verdict</div>`,
    `      <p>${esc(r.verdictBox)}</p>`,
    `    </div>`,
    renderCta(ctaAfterVerdict),

    renderFaq(r),
    `\n  </div>`,

    renderRelated(r),
    `\n</div>`,

    renderFooter(),
  ].join('\n');
}

// ── Checkpoint ────────────────────────────────────────────────────────────────

function runCheckpoint(results, log) {
  const successful = results.filter(r => r.success);

  // Read HTML from disk for reliable checking — works for both single and batch runs
  const htmlMap = {};
  for (const r of successful) {
    const outPath = path.join(OUT_DIR, `${r.slug}.html`);
    try { htmlMap[r.slug] = fs.readFileSync(outPath, 'utf8'); }
    catch { htmlMap[r.slug] = ''; }
  }

  const has    = (slug, str) => (htmlMap[slug] || '').includes(str);
  const hasNot = (slug, str) => !(htmlMap[slug] || '').includes(str);

  const checks = [
    {
      name:   'All pages rendered successfully',
      passed: results.every(r => r.success),
      detail: results.filter(r => !r.success).map(r => r.slug).join(', '),
    },
    {
      name:   'All rendered files exist in 3-rendered/',
      passed: successful.every(r => fs.existsSync(path.join(OUT_DIR, `${r.slug}.html`))),
      detail: successful.filter(r => !fs.existsSync(path.join(OUT_DIR, `${r.slug}.html`)))
        .map(r => r.slug).join(', '),
    },
    {
      name:   'All pages have canonical tag',
      passed: successful.every(r => has(r.slug, '<link rel="canonical"')),
      detail: successful.filter(r => !has(r.slug, '<link rel="canonical"'))
        .map(r => r.slug).join(', '),
    },
    {
      name:   'All pages have quick-answer block',
      passed: successful.every(r => has(r.slug, 'class="quick-answer"')),
      detail: successful.filter(r => !has(r.slug, 'class="quick-answer"'))
        .map(r => r.slug).join(', '),
    },
    {
      name:   'All pages have CTA blocks',
      passed: successful.every(r => has(r.slug, 'class="cta-block"')),
      detail: successful.filter(r => !has(r.slug, 'class="cta-block"'))
        .map(r => r.slug).join(', '),
    },
    {
      name:   'No pages reference ../css/ (wrong path)',
      passed: successful.every(r => hasNot(r.slug, '../css/')),
      detail: successful.filter(r => !hasNot(r.slug, '../css/'))
        .map(r => r.slug).join(', '),
    },
    {
      name:   'No pages reference ../images/ (wrong path)',
      passed: successful.every(r => hasNot(r.slug, '../images/')),
      detail: successful.filter(r => !hasNot(r.slug, '../images/'))
        .map(r => r.slug).join(', '),
    },
  ];

  const allPassed = checks.every(c => c.passed);
  log.checkpoint(allPassed ? 'PASSED' : 'FAILED', checks);
  return allPassed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const log = createLogger('pipeline-render');

  if (!fs.existsSync(IN_DIR)) {
    log.error('pipeline-render.js', `Input directory not found: ${IN_DIR}`);
    log.close();
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    log.info(`Created output directory: ${OUT_DIR}`);
  }

  // Determine files to process
  let slugs = [];
  if (SINGLE_SLUG) {
    slugs = [SINGLE_SLUG];
  } else {
    slugs = fs.readdirSync(IN_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();
  }

  log.info(`pipeline-render.js`);
  log.info(`Source:  ${IN_DIR}`);
  log.info(`Output:  ${OUT_DIR}`);
  log.info(`Files:   ${slugs.length}`);
  log.info(`Force:   ${FORCE ? 'yes' : 'no'}`);

  log.section('Rendering');

  const results = [];
  let succeeded = 0;
  let skipped   = 0;
  let failed    = 0;

  for (const slug of slugs) {
    const inPath  = path.join(IN_DIR,  `${slug}.json`);
    const outPath = path.join(OUT_DIR, `${slug}.html`);

    if (!FORCE && fs.existsSync(outPath)) {
      log.skip(`${slug}.html`, 'already exists');
      skipped++;
      results.push({ success: true, slug, skipped: true });
      continue;
    }

    let record;
    try {
      record = JSON.parse(fs.readFileSync(inPath, 'utf8'));
    } catch (e) {
      log.error(`${slug}.json`, `Failed to parse: ${e.message}`);
      failed++;
      results.push({ success: false, slug });
      continue;
    }

    try {
      const html = renderPage(record);
      fs.writeFileSync(outPath, html, 'utf8');
      log.pass(`${slug}.html`, `${html.length} chars`);
      succeeded++;
      results.push({ success: true, slug, html });
    } catch (e) {
      log.error(`${slug}.html`, `Render failed: ${e.message}`);
      failed++;
      results.push({ success: false, slug });
    }
  }

  log.summary({
    'Total:':     slugs.length,
    'Rendered:':  succeeded,
    'Skipped:':   skipped,
    'Failed:':    failed,
  });

  if (results.filter(r => r.success && !r.skipped).length > 0) {
    runCheckpoint(results.filter(r => !r.skipped), log);
  }

  // ── Auto-copy to project root ─────────────────────────────────────────────
  const rendered = results.filter(r => r.success && !r.skipped);
  if (rendered.length > 0) {
    log.section('Copying to project root');
    let copied = 0;
    let copyFailed = 0;

    for (const result of rendered) {
      const src  = path.join(OUT_DIR, `${result.slug}.html`);
      const dest = path.join(ROOT, `${result.slug}.html`);
      try {
        fs.copyFileSync(src, dest);
        copied++;
      } catch (e) {
        log.error(`${result.slug}.html`, `Copy failed: ${e.message}`);
        copyFailed++;
      }
    }

    log.info(`Copied ${copied} file${copied !== 1 ? 's' : ''} to project root`);
    if (copyFailed > 0) log.warn(`${copyFailed} file${copyFailed !== 1 ? 's' : ''} failed to copy`);
  }

  log.close();

  if (failed > 0) process.exit(1);
}

run();
