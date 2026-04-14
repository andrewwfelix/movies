#!/usr/bin/env node

/**
 * html-to-json.js
 * BooksVersusMovies.com — one-time HTML to JSON extractor
 *
 * Converts existing review HTML pages into the canonical review JSON schema
 * defined in docs/review-schema.md. Output goes to pipeline/1-extracted/.
 *
 * This script runs once to bootstrap the JSON layer from existing HTML.
 * New reviews enter the pipeline via generate.js directly as JSON.
 *
 * Usage:
 *   node html-to-json.js
 *   node html-to-json.js --dir ../reviews --out ../pipeline/1-extracted
 *   node html-to-json.js --file ../reviews/atonement.html   (single file)
 *   node html-to-json.js --slug atonement                   (single slug)
 *
 * Options:
 *   --dir     Source HTML directory (default: ../reviews)
 *   --out     Output JSON directory (default: ../pipeline/1-extracted)
 *   --file    Process a single HTML file
 *   --slug    Process a single page by slug (looks in --dir)
 *   --force   Overwrite existing JSON files (default: skip existing)
 * Destination: scripts/content/html-to-json.js
 */

const fs              = require('fs');
const path            = require('path');
const { createLogger } = require('./logger');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const get       = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag   = flag => args.includes(flag);

const HTML_DIR    = get('--dir',  '../reviews');
const OUT_DIR     = get('--out',  '../pipeline/1-extracted');
const SINGLE_FILE = get('--file', null);
const SINGLE_SLUG = get('--slug', null);
const FORCE       = hasFlag('--force');

// ── HTML helpers ──────────────────────────────────────────────────────────────

const first  = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const all    = (html, re) => {
  const out = []; let m;
  const g = new RegExp(re.source, 'g' + re.flags.replace('g',''));
  while ((m = g.exec(html))) out.push(m[1].trim());
  return out;
};
const decode = s => s
  .replace(/&amp;/g,  '&').replace(/&lt;/g,   '<').replace(/&gt;/g,   '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g,  "'").replace(/&mdash;/g,'—')
  .replace(/&nbsp;/g, ' ').replace(/&#8212;/g,'—').replace(/&middot;/g,'·');
const strip  = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const cleanText = s => s
  .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  .replace(/\n{3,}/g, '\n\n').trim();

// ── JSON-LD extractor ─────────────────────────────────────────────────────────

function extractJsonLd(html) {
  const blocks = all(html, /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const review = {};
  const faq    = { items: [] };

  for (const raw of blocks) {
    let obj;
    try { obj = JSON.parse(raw); } catch { continue; }

    if (obj['@type'] === 'Review') {
      review.reviewBody  = obj.reviewBody                 || null;
      review.ratingValue = obj.reviewRating?.ratingValue  || null;
      review.bookTitle   = obj.itemReviewed?.name         || null;
      review.author      = obj.itemReviewed?.author?.name || null;
      review.bookYear    = obj.itemReviewed?.datePublished || null;
    }

    if (obj['@type'] === 'FAQPage') {
      faq.items = (obj.mainEntity || []).map(q => ({
        question: q.name || '',
        answer:   q.acceptedAnswer?.text || '',
      }));
    }
  }

  return { review, faq };
}

// ── Media type detection ──────────────────────────────────────────────────────

const SERIES_SIGNALS = [
  'the series', 'the tv series', 'the show', 'series released',
  'tv series released', 'hbo', 'netflix series', 'apple tv+', 'amazon prime',
  'hulu series', 'disney+', 'peacock', 'paramount+', 'crave',
];

function detectMediaType(html) {
  const subtitle   = first(html, /class=["']subtitle["'][^>]*>([\s\S]*?)<\/p>/i) || '';
  const metaStrip  = first(html, /class=["']meta-strip["'][^>]*>([\s\S]*?)<\/div>/i) || '';
  const panelLabel = first(html, /class=["']panel-film["'][\s\S]*?class=["']panel-label["'][^>]*>([\s\S]*?)<\/div>/i) || '';
  const combined   = (subtitle + ' ' + metaStrip + ' ' + panelLabel).toLowerCase();
  return SERIES_SIGNALS.some(s => combined.includes(s)) ? 'series' : 'film';
}

// ── Book year ─────────────────────────────────────────────────────────────────

function extractBookYear(html, jsonLdYear) {
  const metaRaw = first(html, /<strong>Book Published<\/strong>([\s\S]*?)<\/div>/i);
  if (metaRaw) {
    const cleaned = strip(decode(metaRaw)).trim();
    if (cleaned) return cleaned;
  }
  return jsonLdYear ? String(jsonLdYear).trim() : null;
}

// ── Film year ─────────────────────────────────────────────────────────────────

function extractFilmYear(html) {
  const yearMatch = first(html, /<strong>[^<]*Released<\/strong>\s*(\d{4})/i);
  if (yearMatch) return yearMatch;
  const tbaRaw = first(html, /<strong>[^<]*Released<\/strong>([\s\S]*?)<\/div>/i);
  if (tbaRaw && /tba|in development|upcoming/i.test(tbaRaw)) return 'TBA';
  return null;
}

// ── Character table ───────────────────────────────────────────────────────────

function extractCharacters(html) {
  const tableMatch = html.match(/<table[^>]*class=["']char-table["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];

  const tbody = tableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbody) return [];

  const rows  = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRe.exec(tbody[1]))) {
    const cells   = [];
    const cellRe  = /<td>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) cells.push(cellMatch[1]);
    if (cells.length < 3) continue;

    const name   = strip(decode(first(cells[0], /<span[^>]*class=["']char-name["'][^>]*>([\s\S]*?)<\/span>/i) || cells[0]));
    const actor  = strip(decode(first(cells[0], /<span[^>]*class=["']char-actor["'][^>]*>([\s\S]*?)<\/span>/i) || ''));
    const inBook = cleanText(strip(decode(cells[1])));
    const inFilm = cleanText(strip(decode(cells[2])));

    if (name) rows.push({ name, actor, inBook, inFilm });
  }

  return rows;
}

// ── Differences ───────────────────────────────────────────────────────────────

function extractDifferences(html) {
  const diffs   = [];
  const allDivs = html.match(/<div[^>]*class=["']difference["'][^>]*>[\s\S]*?(?=<div[^>]*class=["']difference["']|<h2\s|<div[^>]*class=["']verdict)/gi) || [];

  for (const block of allDivs) {
    const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!titleMatch) continue;
    const title = cleanText(strip(decode(titleMatch[1])));

    const paraRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paras  = [];
    let paraMatch;
    while ((paraMatch = paraRe.exec(block))) {
      const text = cleanText(strip(decode(paraMatch[1])));
      if (text) paras.push(text);
    }

    if (title && paras.length > 0) {
      diffs.push({ title, body: paras.join('\n\n') });
    }
  }

  return diffs;
}

// ── Story brief ───────────────────────────────────────────────────────────────

function extractStoryBrief(html) {
  const briefSection = html.match(/<h2[^>]*>The Story in Brief<\/h2>([\s\S]*?)(?=<h2|<table[^>]*class=["']char-table)/i);
  if (!briefSection) return null;

  const paraRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paras  = [];
  let m;
  while ((m = paraRe.exec(briefSection[1]))) {
    const text = cleanText(strip(decode(m[1])));
    if (text) paras.push(text);
  }

  return paras.length > 0 ? paras.join('\n\n') : null;
}

// ── Read first ────────────────────────────────────────────────────────────────

function extractReadFirst(html) {
  const section = html.match(/<h2[^>]*>Should You Read First\?<\/h2>([\s\S]*?)(?=<div[^>]*class=["']verdict-box|<h2)/i);
  if (!section) return null;

  const paraRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paras  = [];
  let m;
  while ((m = paraRe.exec(section[1]))) {
    const text = cleanText(strip(decode(m[1])));
    if (text) paras.push(text);
  }

  return paras.length > 0 ? paras.join('\n\n') : null;
}

// ── Verdict box ───────────────────────────────────────────────────────────────

function extractVerdictBox(html) {
  // The verdict-box contains a nested .verdict-title div before the <p>.
  // Matching to the first </div> captures the inner div only, so we
  // search for the verdict-box opening and then grab the <p> directly.
  const m = html.match(/<div[^>]*class=["']verdict-box["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? cleanText(strip(decode(m[1]))) : null;
}

// ── FAQ (visible section) ─────────────────────────────────────────────────────

function extractFaqSection(html) {
  const items  = [];
  const itemRe = /<div[^>]*class=["']faq-item["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class=["']faq-item|<\/div>)/gi;
  let m;
  while ((m = itemRe.exec(html))) {
    const block    = m[1];
    const question = strip(decode(first(block, /<div[^>]*class=["']faq-q["'][^>]*>([\s\S]*?)<\/div>/i) || ''));
    const answer   = cleanText(strip(decode(first(block, /<div[^>]*class=["']faq-a["'][^>]*>([\s\S]*?)<\/div>/i) || '')));
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

// ── Related cards ─────────────────────────────────────────────────────────────

function extractRelated(html) {
  const sectionTitle = first(html, /class=["']related-section["'][^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const hrefs        = all(html, /class=["']related-card["'][^>]*href=["']([^"']+)["']/i);
  const labels       = all(html, /class=["']rel-label["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/a>/i)
    .map(t => strip(decode(t)));

  const related = hrefs.map((href, i) => ({
    slug:  href.replace(/^\//, '').replace(/\.html$/, ''),
    title: labels[i] || '',
  })).filter(r => r.slug && !/slug\d|placeholder/i.test(r.slug));

  return {
    relatedSectionTitle: sectionTitle ? strip(decode(sectionTitle)) : 'More Comparisons',
    related,
  };
}

// ── Main extractor ────────────────────────────────────────────────────────────

function extractPage(filename, html) {
  const warnings = [];
  const warn     = msg => warnings.push(msg);

  const slug      = filename.replace(/\.html$/i, '');
  const { review, faq: jsonLdFaq } = extractJsonLd(html);
  const mediaType = detectMediaType(html);

  const pageTitle    = first(html, /<title>([\s\S]*?)<\/title>/i);
  const metaDesc     = first(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
                    || first(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const lastUpdated  = first(html, /<meta\s+name=["']last-updated["']\s+content=["']([^"']+)["']/i);
  const bookYear     = extractBookYear(html, review.bookYear);
  const metaAuthor   = first(html, /<strong>Author<\/strong>([\s\S]*?)<\/div>/i);
  const author       = review.author || (metaAuthor ? strip(decode(metaAuthor)) : null);
  const filmYear     = extractFilmYear(html);
  const director     = first(html, /<strong>Director<\/strong>([\s\S]*?)<\/div>/i);
  const genreTag     = first(html, /class=["']genre-tag["'][^>]*>([\s\S]*?)<\/div>/i);
  const heroTitle    = first(html, /<div[^>]*class=["']page-hero["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i);
  const mediaLabel   = first(html, /class=["']panel-film["'][\s\S]*?class=["']panel-label["'][^>]*>([\s\S]*?)<\/div>/i);
  const starringLine = first(html, /class=["']trailer-note["'][^>]*>([\s\S]*?)<\/p>/i);

  const verdictBadgeMatch = html.match(/class=["']verdict-badge\s+(verdict-[a-z]+)["'][^>]*>([\s\S]*?)<\/span>/i);
  const verdictClass = verdictBadgeMatch ? verdictBadgeMatch[1] : null;
  const verdictText  = verdictBadgeMatch ? strip(decode(verdictBadgeMatch[2])) : null;

  const affiliateLinks = all(html, /href=["'](https?:\/\/amzn\.to\/[^"'\s]+)["']/i);
  const buyBtnHref     = first(html, /class=["']buy-btn["'][^>]*href=["']([^"']+)["']/i);
  const buyVideoHref   = first(html, /class=["']buy-video-btn["'][^>]*href=["']([^"']+)["']/i);
  const youtubeId      = first(html, /img\.youtube\.com\/vi\/([A-Za-z0-9_-]+)\//i)
                      || first(html, /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i);
  const trailerUrl     = first(html, /class=["']trailer-link["'][^>]*href=["']([^"']+)["']/i);
  const bookCoverSrc   = first(html, /class=["']book-cover["'][^>]*src=["']([^"']+)["']/i);
  const bookCoverImage = bookCoverSrc ? path.basename(bookCoverSrc) : null;

  const storyBrief  = extractStoryBrief(html);
  const characters  = extractCharacters(html);
  const differences = extractDifferences(html);
  const readFirst   = extractReadFirst(html);
  const verdictBox  = extractVerdictBox(html);
  const { relatedSectionTitle, related } = extractRelated(html);
  const faqSection  = extractFaqSection(html);
  const faq         = faqSection.length > 0 ? faqSection : jsonLdFaq.items;

  const hasSpoilerWarning = /spoiler-warning/.test(html);
  const hasCharTable      = /class=["']char-table["']/.test(html);
  const hasQuickAnswer    = /class=["']quick-answer["']/.test(html) || /id=["']quick-answer["']/.test(html);

  if (!storyBrief)            warn('missing: story brief');
  if (differences.length < 4) warn(`low difference count: ${differences.length}`);
  if (faq.length < 3)         warn(`low FAQ count: ${faq.length}`);
  if (related.length < 3)     warn(`missing related cards: found ${related.length}`);
  if (!verdictBox)            warn('missing: verdict box text');
  if (!readFirst)             warn('missing: read first section');
  if (!bookCoverImage)        warn('missing: book cover image');

  return {
    slug,
    filename,
    lastUpdated:     lastUpdated || new Date().toISOString().split('T')[0],
    pipelineVersion: '1',
    pageTitle:       pageTitle    ? decode(pageTitle)  : null,
    metaDesc:        metaDesc     ? decode(metaDesc)   : null,
    reviewBody:      review.reviewBody  || null,
    ratingValue:     review.ratingValue || null,
    bookTitle:       review.bookTitle   || (heroTitle ? strip(decode(heroTitle)) : null),
    author,
    bookYear,
    genre:           genreTag   ? strip(decode(genreTag))   : null,
    mediaType,
    mediaLabel:      mediaLabel ? strip(decode(mediaLabel)) : null,
    filmYear,
    director:        director   ? strip(decode(director))   : null,
    starringLine:    starringLine ? strip(decode(starringLine)) : null,
    verdictText,
    verdictClass,
    affiliateLink:      buyBtnHref || (affiliateLinks[0] || null),
    affiliateLinkAlt:   affiliateLinks.length > 1 ? affiliateLinks[1] : null,
    videoAffiliateLink: buyVideoHref || null,
    youtubeId:          youtubeId  || null,
    trailerUrl:         trailerUrl || null,
    bookCoverImage,
    storyBrief,
    quickAnswer:     null,
    characters,
    differences,
    readFirst,
    verdictBox,
    faq,
    ctaBlocks:       null,
    relatedSectionTitle,
    related,
    hasSpoilerWarning,
    hasQuickAnswer,
    hasCharTable,
    generation:      'v2',
    _warnings:       warnings,
    _warningCount:   warnings.length,
  };
}

// ── Checkpoint ────────────────────────────────────────────────────────────────

function runCheckpoint(results, log) {
  const records = results.map(r => r.record);

  const checks = [
    {
      name:   'All pages have storyBrief',
      passed: records.every(r => r.storyBrief),
      detail: records.filter(r => !r.storyBrief).map(r => r.filename).join(', '),
    },
    {
      name:   'All pages have 4+ differences',
      passed: records.every(r => r.differences.length >= 4),
      detail: records.filter(r => r.differences.length < 4)
        .map(r => `${r.filename} (${r.differences.length})`).join(', '),
    },
    {
      name:   'All pages have verdictBox',
      passed: records.every(r => r.verdictBox),
      detail: records.filter(r => !r.verdictBox).map(r => r.filename).join(', '),
    },
    {
      name:   'All pages have readFirst',
      passed: records.every(r => r.readFirst),
      detail: records.filter(r => !r.readFirst).map(r => r.filename).join(', '),
    },
    {
      name:   'All pages have 3+ FAQ items',
      passed: records.every(r => r.faq.length >= 3),
      detail: records.filter(r => r.faq.length < 3)
        .map(r => `${r.filename} (${r.faq.length})`).join(', '),
    },
    {
      name:   'All pages have 3 related cards',
      passed: records.every(r => r.related.length === 3),
      detail: records.filter(r => r.related.length !== 3)
        .map(r => `${r.filename} (${r.related.length})`).join(', '),
    },
    {
      name:   'All pages have affiliateLink',
      passed: records.every(r => r.affiliateLink),
      detail: records.filter(r => !r.affiliateLink).map(r => r.filename).join(', '),
    },
    {
      name:   'All pages have verdictText',
      passed: records.every(r => r.verdictText),
      detail: records.filter(r => !r.verdictText).map(r => r.filename).join(', '),
    },
    {
      name:   'quickAnswer null in all extracted files',
      passed: records.every(r => r.quickAnswer === null),
      detail: 'unexpected — quickAnswer should always be null at extraction',
    },
    {
      name:   'ctaBlocks null in all extracted files',
      passed: records.every(r => r.ctaBlocks === null),
      detail: 'unexpected — ctaBlocks should always be null at extraction',
    },
  ];

  const allPassed = checks.every(c => c.passed);
  log.checkpoint(allPassed ? 'PASSED' : 'FAILED', checks);

  // Log all warnings collected across all files
  const withWarnings = results.filter(r => r.record._warningCount > 0);
  if (withWarnings.length > 0) {
    log.section(`Warnings (${withWarnings.length} files)`);
    withWarnings.forEach(r => {
      log.warn(r.record.filename, r.record._warnings.join(' | '));
    });
  }

  return allPassed;
}

// ── Write JSON ────────────────────────────────────────────────────────────────

function writeJson(record, outDir) {
  const outPath = path.join(outDir, `${record.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2), 'utf8');
  return outPath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const log = createLogger('html-to-json');

  const resolvedHtmlDir = path.resolve(__dirname, HTML_DIR);
  const resolvedOutDir  = path.resolve(__dirname, OUT_DIR);

  if (!fs.existsSync(resolvedOutDir)) {
    fs.mkdirSync(resolvedOutDir, { recursive: true });
    log.info(`Created output directory: ${resolvedOutDir}`);
  }

  let filesToProcess = [];

  if (SINGLE_FILE) {
    const resolved = path.resolve(__dirname, SINGLE_FILE);
    if (!fs.existsSync(resolved)) {
      log.error(SINGLE_FILE, 'file not found');
      log.close();
      process.exit(1);
    }
    filesToProcess = [{ dir: path.dirname(resolved), filename: path.basename(resolved) }];
  } else if (SINGLE_SLUG) {
    const filename = `${SINGLE_SLUG}.html`;
    const resolved = path.join(resolvedHtmlDir, filename);
    if (!fs.existsSync(resolved)) {
      log.error(filename, 'file not found');
      log.close();
      process.exit(1);
    }
    filesToProcess = [{ dir: resolvedHtmlDir, filename }];
  } else {
    if (!fs.existsSync(resolvedHtmlDir)) {
      log.error(resolvedHtmlDir, 'directory not found');
      log.close();
      process.exit(1);
    }
    const files = fs.readdirSync(resolvedHtmlDir).filter(f => f.endsWith('.html')).sort();
    if (files.length === 0) {
      log.error(resolvedHtmlDir, 'no .html files found');
      log.close();
      process.exit(1);
    }
    filesToProcess = files.map(f => ({ dir: resolvedHtmlDir, filename: f }));
  }

  log.info(`html-to-json.js v1`);
  log.info(`Source:  ${resolvedHtmlDir}`);
  log.info(`Output:  ${resolvedOutDir}`);
  log.info(`Files:   ${filesToProcess.length}`);
  log.info(`Force:   ${FORCE ? 'yes' : 'no (skipping existing)'}`);

  const results = [];
  let skipped   = 0;
  let written   = 0;
  let errored   = 0;

  log.section('Processing');

  for (const { dir, filename } of filesToProcess) {
    const outPath = path.join(resolvedOutDir, filename.replace(/\.html$/i, '.json'));

    if (!FORCE && fs.existsSync(outPath)) {
      log.skip(filename, 'already exists');
      skipped++;
      continue;
    }

    try {
      const html   = fs.readFileSync(path.join(dir, filename), 'utf8');
      const record = extractPage(filename, html);
      writeJson(record, resolvedOutDir);
      results.push({ filename, record });
      written++;

      const detail = `${record.author || '?'} · ${record.differences.length} diffs · ${record.faq.length} FAQ · ${record.characters.length} chars`;
      if (record._warningCount > 0) {
        log.warn(filename, `${detail} — ${record._warnings.join(' | ')}`);
      } else {
        log.pass(filename, detail);
      }
    } catch (err) {
      log.error(filename, err.message);
      errored++;
    }
  }

  log.summary({
    'Processed:':  filesToProcess.length,
    'Written:':    written,
    'Skipped:':    skipped,
    'Errors:':     errored,
    'Warnings:':   results.filter(r => r.record._warningCount > 0).length + ' files',
  });

  if (results.length > 1) {
    runCheckpoint(results, log);
  } else if (results.length === 1) {
    log.info(`Single file mode — skipping checkpoint`);
    log.info(`Output: ${path.join(resolvedOutDir, results[0].record.slug + '.json')}`);
  }

  log.close();
}

run();
