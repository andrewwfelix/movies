#!/usr/bin/env node

/**
 * extract-metadata.js
 * BooksVersusMovies.com — page metadata extractor
 * v2 — handles series pages (optional director), non-standard book years,
 *       checkpoint validation, and updated default output path
 *
 * Usage:
 *   node extract-metadata.js
 *   node extract-metadata.js --dir ../reviews --out ../data/extracted_metadata.csv --issues
 *   node extract-metadata.js --dir ../reviews --out ../data/extracted_metadata.json --format json
 *
 * Options:
 *   --dir      Path to folder containing .html files (default: ../reviews)
 *   --out      Output file path (default: ../data/extracted_metadata.csv)
 *   --format   csv | json (default: csv)
 *   --issues   Also write a separate issues report
 *   --strict   Exit with code 1 if any blocking issues found (useful for CI)
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get  = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };

const HTML_DIR     = get('--dir',    '../reviews');
const OUT_FILE     = get('--out',    '../data/extracted_metadata.csv');
const FORMAT       = get('--format', 'csv');
const WRITE_ISSUES = args.includes('--issues');
const STRICT       = args.includes('--strict');

// ── HTML helpers ──────────────────────────────────────────────────────────────

const first  = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const all    = (html, re) => { const out = []; let m; const g = new RegExp(re.source, 'g' + re.flags.replace('g','')); while ((m = g.exec(html))) out.push(m[1].trim()); return out; };
const decode = s => s
  .replace(/&amp;/g,  '&').replace(/&lt;/g,   '<').replace(/&gt;/g,   '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g,  "'").replace(/&mdash;/g,'—')
  .replace(/&nbsp;/g, ' ');
const strip  = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// ── Media type detection ──────────────────────────────────────────────────────
//
// Determines whether a page is for a Film or a Series based on the meta strip
// and panel label. Director is required for films; optional for series.

const SERIES_SIGNALS = [
  'the series', 'the tv series', 'the show', 'series released',
  'tv series released', 'hbo', 'netflix series', 'apple tv+', 'amazon prime',
  'hulu series', 'disney+', 'peacock', 'paramount+',
];

function detectMediaType(html) {
  const subtitle  = first(html, /class=["']subtitle["'][^>]*>([\s\S]*?)<\/p>/i) || '';
  const metaStrip = first(html, /class=["']meta-strip["'][^>]*>([\s\S]*?)<\/div>/i) || '';
  const panelLabel = first(html, /class=["']panel-film["'][\s\S]*?class=["']panel-label["'][^>]*>([\s\S]*?)<\/div>/i) || '';
  const combined  = (subtitle + ' ' + metaStrip + ' ' + panelLabel).toLowerCase();
  const isSeries  = SERIES_SIGNALS.some(s => combined.includes(s));
  return isSeries ? 'series' : 'film';
}

// ── Book year extraction ──────────────────────────────────────────────────────
//
// Handles standard years (1984), BC years (800 BC), and circa years (~800 BC).
// Falls back to the JSON-LD datePublished value which may contain non-numeric text.

function extractBookYear(html, jsonLdYear) {
  // Try meta strip first — look for year in any format after "Book Published"
  const metaRaw = first(html, /<strong>Book Published<\/strong>([\s\S]*?)<\/div>/i);
  if (metaRaw) {
    const cleaned = strip(decode(metaRaw)).trim();
    if (cleaned) return cleaned;  // Return raw value — could be "800 BC", "1984", etc.
  }
  // Fall back to JSON-LD value
  if (jsonLdYear) return String(jsonLdYear).trim();
  return null;
}

// ── Film year extraction ──────────────────────────────────────────────────────
//
// Looks for any "X Released" label in meta strip.
// For in-development titles, accepts "TBA" or missing year gracefully.

function extractFilmYear(html) {
  // Match any label ending in "Released" followed by a year or TBA
  const yearMatch = first(html, /<strong>[^<]*Released<\/strong>\s*(\d{4})/i);
  if (yearMatch) return yearMatch;

  // Check for TBA / in development
  const tbaMatch = first(html, /<strong>[^<]*Released<\/strong>([\s\S]*?)<\/div>/i);
  if (tbaMatch) {
    const cleaned = strip(decode(tbaMatch)).trim();
    if (/tba|in development|upcoming/i.test(cleaned)) return 'TBA';
  }

  return null;
}

// ── JSON-LD extractor ─────────────────────────────────────────────────────────

function extractJsonLd(html) {
  const blocks = all(html, /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const review = {};
  const faq    = {};

  for (const raw of blocks) {
    let obj;
    try { obj = JSON.parse(raw); } catch { continue; }

    if (obj['@type'] === 'Review') {
      review.name        = obj.name                          || null;
      review.reviewBody  = obj.reviewBody                    || null;
      review.ratingValue = obj.reviewRating?.ratingValue     || null;
      review.bookTitle   = obj.itemReviewed?.name            || null;
      review.author      = obj.itemReviewed?.author?.name    || null;
      review.bookYear    = obj.itemReviewed?.datePublished    || null;
    }

    if (obj['@type'] === 'FAQPage') {
      faq.count     = (obj.mainEntity || []).length;
      faq.questions = (obj.mainEntity || []).map(q => q.name).join(' | ');
    }
  }

  return { review, faq };
}

// ── Per-file extractor ────────────────────────────────────────────────────────

function extractPage(filename, html) {
  const issues  = [];
  const warn    = msg => issues.push(msg);

  // ── Media type (determines which warnings apply) ──────────────────────────
  const mediaType = detectMediaType(html);
  const isSeries  = mediaType === 'series';

  // ── Head fields ───────────────────────────────────────────────────────────
  const pageTitle   = first(html, /<title>([\s\S]*?)<\/title>/i);
  const metaDesc    = first(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
                   || first(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const lastUpdated = first(html, /<meta\s+name=["']last-updated["']\s+content=["']([^"']+)["']/i);

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const { review, faq } = extractJsonLd(html);

  if (!review.author)     warn('missing: Review JSON-LD author');
  if (!review.reviewBody) warn('missing: Review JSON-LD reviewBody');
  if (faq.count === 0 || faq.count === undefined) warn('missing: FAQPage JSON-LD');

  // ── Hero / genre ──────────────────────────────────────────────────────────
  const genreTag  = first(html, /class=["']genre-tag["'][^>]*>([\s\S]*?)<\/div>/i);
  const heroTitle = first(html, /<div[^>]*class=["']page-hero["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i);

  // ── Meta strip ────────────────────────────────────────────────────────────
  const metaAuthor = first(html, /<strong>Author<\/strong>([\s\S]*?)<\/div>/i);
  const bookYear   = extractBookYear(html, review.bookYear);
  const filmYear   = extractFilmYear(html);
  const director   = first(html, /<strong>Director<\/strong>([\s\S]*?)<\/div>/i);

  // Verdict badge
  const verdictBadgeMatch = html.match(/class=["']verdict-badge\s+(verdict-[a-z]+)["'][^>]*>([\s\S]*?)<\/span>/i);
  const verdictClass = verdictBadgeMatch ? verdictBadgeMatch[1] : null;
  const verdictText  = verdictBadgeMatch ? strip(decode(verdictBadgeMatch[2])) : null;

  // ── Warnings — director optional for series ───────────────────────────────
  if (!verdictText)  warn('missing: verdict badge');
  if (!metaAuthor)   warn('missing: meta strip author');
  if (!bookYear)     warn('missing: book year');
  if (!filmYear)     warn('missing: film/series year');
  // Director only required for films — series legitimately have no single director
  if (!director && !isSeries) warn('missing: director (film page)');

  // ── Affiliate / media panel ───────────────────────────────────────────────
  const affiliateLinks = all(html, /href=["'](https?:\/\/amzn\.to\/[^"'\s]+)["']/i);
  const bookCoverSrc   = first(html, /class=["']book-cover["'][^>]*src=["']([^"']+)["']/i);
  const buyBtnHref     = first(html, /class=["']buy-btn["'][^>]*href=["']([^"']+)["']/i);
  const buyVideoHref   = first(html, /class=["']buy-video-btn["'][^>]*href=["']([^"']+)["']/i);

  const youtubeId  = first(html, /img\.youtube\.com\/vi\/([A-Za-z0-9_-]+)\//i)
                  || first(html, /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i);
  const trailerUrl = first(html, /class=["']trailer-link["'][^>]*href=["']([^"']+)["']/i);
  const starringLine = first(html, /class=["']trailer-note["'][^>]*>([\s\S]*?)<\/p>/i);

  if (!bookCoverSrc)             warn('missing: book cover image');
  if (!buyBtnHref)               warn('missing: buy button affiliate link');
  if (affiliateLinks.length === 0) warn('missing: all affiliate links');

  const mediaLabel = first(html, /class=["']panel-film["'][\s\S]*?class=["']panel-label["'][^>]*>([\s\S]*?)<\/div>/i);

  // ── Content sections ──────────────────────────────────────────────────────
  const diffCount         = (html.match(/class=["']difference["']/g) || []).length;
  const hasCharTable      = /class=["']char-table["']/.test(html);
  const hasSpoilerWarning = /spoiler-warning/.test(html);
  const hasFaqSection     = /class=["']faq-list["']/.test(html) || /class=["']faq-item["']/.test(html);
  const hasQuickAnswer    = /class=["']quick-answer["']/.test(html) || /id=["']quick-answer["']/.test(html);

  const relatedCards  = all(html, /class=["']related-card["'][^>]*href=["']([^"']+)["']/i);
  const relatedTitles = all(html, /class=["']rel-label["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/a>/i)
    .map(t => strip(decode(t)));

  if (diffCount < 3)           warn(`low difference count: ${diffCount} (expected 4–5)`);
  if (relatedCards.length < 3) warn(`missing related cards: found ${relatedCards.length}`);

  // Check for placeholder slugs in related cards
  const hasPlaceholderCards = relatedCards.some(href => /slug\d|placeholder/i.test(href));
  if (hasPlaceholderCards)   warn('placeholder slugs in related cards');

  // ── Verdict box ───────────────────────────────────────────────────────────
  const verdictBoxText = first(html, /class=["']verdict-box["'][^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/i);

  // ── Slug ──────────────────────────────────────────────────────────────────
  const slug = filename.replace(/\.html$/i, '');

  // ── Generation detection ──────────────────────────────────────────────────
  const generation = hasCharTable ? 'v2' : 'v1';

  // ── Blocking issues (determine isProblematic) ─────────────────────────────
  // These are issues that would cause the pipeline to produce bad output.
  // Minor issues (missing director on series, low diff count) are logged but
  // do not mark the page as problematic.
  const BLOCKING_PATTERNS = [
    'missing: all affiliate links',
    'missing: verdict badge',
    'missing: meta strip author',
    'missing: buy button affiliate link',
    'placeholder slugs in related cards',
    'missing: FAQPage JSON-LD',
    'missing: Review JSON-LD author',
  ];
  const blockingIssues = issues.filter(i => BLOCKING_PATTERNS.some(p => i.includes(p.replace('missing: ', ''))));
  const isProblematic  = blockingIssues.length > 0;

  return {
    slug,
    filename,
    generation,
    mediaType,
    pageTitle:          pageTitle    ? decode(pageTitle)    : null,
    metaDesc:           metaDesc     ? decode(metaDesc)     : null,
    lastUpdated,
    bookTitle:          review.bookTitle || (heroTitle ? strip(decode(heroTitle)) : null),
    author:             review.author    || (metaAuthor ? strip(decode(metaAuthor)) : null),
    bookYear,
    filmYear,
    director:           director ? strip(decode(director)) : null,
    genre:              genreTag ? strip(decode(genreTag)) : null,
    mediaLabel:         mediaLabel ? strip(decode(mediaLabel)) : null,
    verdictText,
    verdictClass,
    affiliateLinkCount: affiliateLinks.length,
    buyBtnHref,
    buyVideoHref,
    bookCoverSrc,
    youtubeId,
    trailerUrl,
    starringLine:       starringLine ? strip(decode(starringLine)) : null,
    diffCount,
    hasCharTable,
    hasSpoilerWarning,
    hasFaqSection,
    hasQuickAnswer,
    faqCount:           faq.count     || 0,
    faqQuestions:       faq.questions || null,
    reviewBody:         review.reviewBody  || null,
    ratingValue:        review.ratingValue || null,
    relatedCards:       relatedCards.join(' | '),
    relatedTitles:      relatedTitles.join(' | '),
    isProblematic,
    issueCount:         issues.length,
    issues:             issues.join(' | '),
  };
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function toCsvRow(obj, keys) {
  return keys.map(k => {
    const v = obj[k];
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  }).join(',');
}

function writeCsv(records, filepath) {
  if (records.length === 0) { console.log('No records to write.'); return; }
  const keys   = Object.keys(records[0]);
  const header = keys.join(',');
  const rows   = records.map(r => toCsvRow(r, keys));
  fs.writeFileSync(filepath, [header, ...rows].join('\n'), 'utf8');
  console.log(`✓ Wrote ${records.length} rows → ${filepath}`);
}

function writeJson(records, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`✓ Wrote ${records.length} records → ${filepath}`);
}

// ── Checkpoint validation ─────────────────────────────────────────────────────
//
// Runs after all pages are processed. Prints a clear PASS / FAIL summary.
// In --strict mode, exits with code 1 on failure so this can gate a pipeline.

function runCheckpoint(records) {
  console.log('\n── Checkpoint ───────────────────────────────────');

  const checks = [
    {
      name:   'All pages have affiliate links',
      pass:   records.every(r => r.affiliateLinkCount > 0),
      detail: () => {
        const bad = records.filter(r => r.affiliateLinkCount === 0).map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
    {
      name:   'All pages have verdict badge',
      pass:   records.every(r => r.verdictText),
      detail: () => {
        const bad = records.filter(r => !r.verdictText).map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
    {
      name:   'All pages have author',
      pass:   records.every(r => r.author),
      detail: () => {
        const bad = records.filter(r => !r.author).map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
    {
      name:   'All pages have book year',
      pass:   records.every(r => r.bookYear),
      detail: () => {
        const bad = records.filter(r => !r.bookYear).map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
    {
      name:   'No placeholder related card slugs',
      pass:   records.every(r => !r.issues.includes('placeholder slugs')),
      detail: () => {
        const bad = records.filter(r => r.issues.includes('placeholder slugs')).map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
    {
      name:   'All pages have FAQ section',
      pass:   records.every(r => r.hasFaqSection),
      detail: () => {
        const bad = records.filter(r => !r.hasFaqSection).map(r => r.filename);
        return `  Failed (${bad.length}): ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? ' …' : ''}`;
      },
    },
    {
      name:   'No v1 generation pages',
      pass:   records.every(r => r.generation === 'v2'),
      detail: () => {
        const bad = records.filter(r => r.generation === 'v1').map(r => r.filename);
        return `  v1 pages: ${bad.join(', ')}`;
      },
    },
    {
      name:   'All pages have 3+ related cards',
      pass:   records.every(r => r.relatedCards.split(' | ').filter(Boolean).length >= 3),
      detail: () => {
        const bad = records
          .filter(r => r.relatedCards.split(' | ').filter(Boolean).length < 3)
          .map(r => r.filename);
        return `  Failed: ${bad.join(', ')}`;
      },
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.pass) {
      console.log(`  ✓  ${check.name}`);
    } else {
      console.log(`  ✗  ${check.name}`);
      console.log(check.detail());
      allPassed = false;
    }
  }

  console.log('─────────────────────────────────────────────────');

  if (allPassed) {
    console.log('  CHECKPOINT PASSED — ready for next pipeline step\n');
  } else {
    console.log('  CHECKPOINT FAILED — resolve issues before proceeding\n');
    if (STRICT) {
      process.exit(1);
    }
  }

  return allPassed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const resolvedDir = path.resolve(__dirname, HTML_DIR);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`✗ Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(resolvedDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  if (files.length === 0) {
    console.error(`✗ No .html files found in ${resolvedDir}`);
    process.exit(1);
  }

  console.log(`\nextract-metadata.js v2`);
  console.log(`Processing ${files.length} files from ${resolvedDir} …\n`);

  const records     = [];
  const problematic = [];

  for (const filename of files) {
    const filepath = path.join(resolvedDir, filename);
    const html     = fs.readFileSync(filepath, 'utf8');
    const record   = extractPage(filename, html);
    records.push(record);

    if (record.isProblematic) {
      problematic.push(record);
      console.log(`  ⚠  ${filename} (${record.issueCount} issue${record.issueCount !== 1 ? 's' : ''}): ${record.issues}`);
    } else {
      const notes = record.issueCount > 0 ? `  [${record.issueCount} minor: ${record.issues}]` : '';
      console.log(`  ✓  ${filename} — ${record.author || '?'} · ${record.verdictText || '?'} · ${record.mediaType} · gen:${record.generation}${notes}`);
    }
  }

  // Summary
  console.log(`\n── Summary ───────────────────────────────────────`);
  console.log(`  Total:              ${records.length}`);
  console.log(`  Film pages:         ${records.filter(r => r.mediaType === 'film').length}`);
  console.log(`  Series pages:       ${records.filter(r => r.mediaType === 'series').length}`);
  console.log(`  v2 generation:      ${records.filter(r => r.generation === 'v2').length}`);
  console.log(`  v1 generation:      ${records.filter(r => r.generation === 'v1').length}`);
  console.log(`  Problematic:        ${problematic.length}`);
  console.log(`  Has char table:     ${records.filter(r => r.hasCharTable).length}`);
  console.log(`  Has quick-answer:   ${records.filter(r => r.hasQuickAnswer).length}`);
  console.log(`  Has FAQ section:    ${records.filter(r => r.hasFaqSection).length}`);
  console.log(`  Missing affiliate:  ${records.filter(r => r.affiliateLinkCount === 0).length}`);
  console.log(`  Film year TBA:      ${records.filter(r => r.filmYear === 'TBA').length}`);
  console.log(`─────────────────────────────────────────────────\n`);

  // Write main output
  const resolvedOut = path.resolve(__dirname, OUT_FILE);
  if (FORMAT === 'json') {
    writeJson(records, resolvedOut);
  } else {
    writeCsv(records, resolvedOut);
  }

  // Write issues report
  if (WRITE_ISSUES) {
    const issueRecords = records.filter(r => r.issueCount > 0);
    if (issueRecords.length > 0) {
      const issuesPath = resolvedOut.replace(/\.(csv|json)$/, '-issues.$1');
      if (FORMAT === 'json') {
        writeJson(issueRecords, issuesPath);
      } else {
        writeCsv(issueRecords, issuesPath);
      }
      console.log(`✓ Issues report → ${issuesPath}`);
    } else {
      console.log(`✓ No issues found — issues report not written`);
    }
  }

  // Quarantine list
  if (problematic.length > 0) {
    console.log(`\n── Quarantine candidates ─────────────────────────`);
    problematic.forEach(r => console.log(`  mv reviews/${r.filename} reviews-to-review/`));
    console.log(`─────────────────────────────────────────────────\n`);
  }

  // Checkpoint
  runCheckpoint(records);
}

run();
