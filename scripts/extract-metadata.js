#!/usr/bin/env node

/**
 * extract-metadata.js
 * BooksVersusMovies.com — page metadata extractor
 *
 * Usage:
 *   node extract-metadata.js --dir ./reviews --out metadata.csv
 *   node extract-metadata.js --dir ./reviews --out metadata.json --format json
 *
 * Options:
 *   --dir      Path to folder containing .html files (default: ./reviews)
 *   --out      Output file path (default: metadata.csv)
 *   --format   csv | json (default: csv)
 *   --issues   Also write a separate issues report (issues.csv / issues.json)
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get  = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const HTML_DIR    = get('--dir',    './reviews');
const OUT_FILE    = get('--out',    'metadata.csv');
const FORMAT      = get('--format', 'csv');
const WRITE_ISSUES = args.includes('--issues');

// ── Tiny DOM-free parser helpers ─────────────────────────────────────────────

/** Extract the first match of a regex; return null if not found. */
const first = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };

/** Extract all matches of a capture group. */
const all   = (html, re) => { const out = []; let m; const g = new RegExp(re.source, 'g' + (re.flags.replace('g',''))); while ((m = g.exec(html))) out.push(m[1].trim()); return out; };

/** Decode basic HTML entities in a string. */
const decode = s => s
  .replace(/&amp;/g,  '&')
  .replace(/&lt;/g,   '<')
  .replace(/&gt;/g,   '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g,  "'")
  .replace(/&mdash;/g,'—')
  .replace(/&nbsp;/g, ' ');

/** Strip all HTML tags from a string. */
const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// ── JSON-LD extractor ────────────────────────────────────────────────────────

function extractJsonLd(html) {
  const blocks = all(html, /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const review  = {};
  const faq     = {};

  for (const raw of blocks) {
    let obj;
    try { obj = JSON.parse(raw); } catch { continue; }

    if (obj['@type'] === 'Review') {
      review.name        = obj.name        || null;
      review.reviewBody  = obj.reviewBody  || null;
      review.ratingValue = obj.reviewRating?.ratingValue || null;
      review.bookTitle   = obj.itemReviewed?.name        || null;
      review.author      = obj.itemReviewed?.author?.name || null;
      review.bookYear    = obj.itemReviewed?.datePublished || null;
    }

    if (obj['@type'] === 'FAQPage') {
      faq.count     = (obj.mainEntity || []).length;
      faq.questions = (obj.mainEntity || []).map(q => q.name).join(' | ');
    }
  }

  return { review, faq };
}

// ── Per-file extractor ───────────────────────────────────────────────────────

function extractPage(filename, html) {
  const issues  = [];
  const warn    = msg => issues.push(msg);

  // ── Head fields ──────────────────────────────────────────────────────────

  const pageTitle  = first(html, /<title>([\s\S]*?)<\/title>/i);
  const metaDesc   = first(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
                  || first(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const lastUpdated = first(html, /<meta\s+name=["']last-updated["']\s+content=["']([^"']+)["']/i);

  // ── JSON-LD ───────────────────────────────────────────────────────────────

  const { review, faq } = extractJsonLd(html);

  if (!review.author)    warn('missing: Review JSON-LD author');
  if (!review.bookYear)  warn('missing: Review JSON-LD bookYear');
  if (!review.reviewBody) warn('missing: Review JSON-LD reviewBody');
  if (faq.count === 0 || faq.count === undefined) warn('missing: FAQPage JSON-LD');

  // ── Hero / genre ──────────────────────────────────────────────────────────

  const genreTag   = first(html, /class=["']genre-tag["'][^>]*>([\s\S]*?)<\/div>/i);
  const heroTitle  = first(html, /<div[^>]*class=["']page-hero["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i);
  const subtitle   = first(html, /class=["']subtitle["'][^>]*>([\s\S]*?)<\/p>/i);

  // ── Meta strip ────────────────────────────────────────────────────────────

  const metaAuthor  = first(html, /<strong>Author<\/strong>([\s\S]*?)<\/div>/i);
  const bookYear    = first(html, /<strong>Book Published<\/strong>(\d{4})/i);
  const filmYear    = first(html, /<strong>(?:Film|Series|TV Series|Series) Released<\/strong>(\d{4})/i)
                   || first(html, /<strong>[^<]*Released<\/strong>(\d{4})/i);
  const director    = first(html, /<strong>Director<\/strong>([\s\S]*?)<\/div>/i);

  // Verdict badge — extract both text and class
  const verdictBadgeMatch = html.match(/class=["']verdict-badge\s+(verdict-[a-z]+)["'][^>]*>([\s\S]*?)<\/span>/i);
  const verdictClass = verdictBadgeMatch ? verdictBadgeMatch[1] : null;
  const verdictText  = verdictBadgeMatch ? strip(decode(verdictBadgeMatch[2])) : null;

  if (!verdictText)  warn('missing: verdict badge');
  if (!metaAuthor)   warn('missing: meta strip author');
  if (!bookYear)     warn('missing: meta strip book year');
  if (!filmYear)     warn('missing: meta strip film/series year');
  if (!director)     warn('missing: meta strip director');

  // ── Affiliate / media panel ───────────────────────────────────────────────

  const affiliateLinks = all(html, /href=["'](https?:\/\/amzn\.to\/[^"'\s]+)["']/i);
  const bookCoverSrc   = first(html, /class=["']book-cover["'][^>]*src=["']([^"']+)["']/i);
  const buyBtnHref     = first(html, /class=["']buy-btn["'][^>]*href=["']([^"']+)["']/i);

  // YouTube trailer
  const youtubeId      = first(html, /img\.youtube\.com\/vi\/([A-Za-z0-9_-]+)\//i)
                      || first(html, /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i);
  const trailerUrl     = first(html, /class=["']trailer-link["'][^>]*href=["']([^"']+)["']/i);
  const starringLine   = first(html, /class=["']trailer-note["'][^>]*>([\s\S]*?)<\/p>/i);

  // Video affiliate (buy/rent button — not the book button)
  const buyVideoHref   = first(html, /class=["']buy-video-btn["'][^>]*href=["']([^"']+)["']/i);

  if (!bookCoverSrc)  warn('missing: book cover image');
  if (!buyBtnHref)    warn('missing: buy button affiliate link');
  if (affiliateLinks.length === 0) warn('missing: all affiliate links');

  // Media type from panel label
  const mediaLabel = first(html, /class=["']panel-film["'][\s\S]*?class=["']panel-label["'][^>]*>([\s\S]*?)<\/div>/i);

  // ── Content sections ──────────────────────────────────────────────────────

  // Count difference sections
  const diffCount = (html.match(/class=["']difference["']/g) || []).length;

  // Has character table?
  const hasCharTable = /class=["']char-table["']/.test(html);

  // Has spoiler warning?
  const hasSpoilerWarning = /spoiler-warning/.test(html);

  // Has visible FAQ section (beyond JSON-LD)?
  const hasFaqSection = /class=["']faq-list["']/.test(html) || /class=["']faq-item["']/.test(html);

  // Has quick-answer block?
  const hasQuickAnswer = /class=["']quick-answer["']/.test(html) || /id=["']quick-answer["']/.test(html);

  // Related cards
  const relatedCards = all(html, /class=["']related-card["'][^>]*href=["']([^"']+)["']/i);
  const relatedTitles = all(html, /class=["']rel-label["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/a>/i)
    .map(t => strip(decode(t)));

  if (diffCount < 3) warn(`low difference count: ${diffCount} (expected 4–5)`);
  if (relatedCards.length < 3) warn(`missing related cards: found ${relatedCards.length}`);

  // ── Verdict box text ──────────────────────────────────────────────────────

  const verdictBoxText = first(html, /class=["']verdict-box["'][^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/i);

  // ── Slug ──────────────────────────────────────────────────────────────────

  const slug = filename.replace(/\.html$/i, '');

  // ── Flags ─────────────────────────────────────────────────────────────────

  // Generation detection: "old" pages lack char-table and have simpler title patterns
  const generation = hasCharTable ? 'v2' : 'v1';

  // Problematic = has blocking issues that need manual review before pipeline
  const blockingIssues = issues.filter(i =>
    i.includes('affiliate') ||
    i.includes('verdict badge') ||
    i.includes('author') ||
    i.includes('book year')
  );
  const isProblematic = blockingIssues.length > 0;

  return {
    // Identity
    slug,
    filename,
    generation,

    // Head
    pageTitle:    pageTitle    ? decode(pageTitle)    : null,
    metaDesc:     metaDesc     ? decode(metaDesc)     : null,
    lastUpdated,

    // Book metadata (from JSON-LD, with meta strip fallback)
    bookTitle:    review.bookTitle || (heroTitle ? strip(decode(heroTitle)) : null),
    author:       review.author    || (metaAuthor ? strip(decode(metaAuthor)) : null),
    bookYear:     review.bookYear  || bookYear,
    filmYear,
    director:     director ? strip(decode(director)) : null,
    genre:        genreTag ? strip(decode(genreTag)) : null,
    mediaLabel:   mediaLabel ? strip(decode(mediaLabel)) : null,

    // Verdict
    verdictText,
    verdictClass,

    // Affiliate / media
    affiliateLinkCount: affiliateLinks.length,
    buyBtnHref,
    buyVideoHref,
    bookCoverSrc,
    youtubeId,
    trailerUrl,
    starringLine:  starringLine ? strip(decode(starringLine)) : null,

    // Content structure
    diffCount,
    hasCharTable,
    hasSpoilerWarning,
    hasFaqSection,
    hasQuickAnswer,
    faqCount:      faq.count    || 0,
    faqQuestions:  faq.questions || null,

    // Review JSON-LD
    reviewBody:    review.reviewBody || null,
    ratingValue:   review.ratingValue || null,

    // Related
    relatedCards:  relatedCards.join(' | '),
    relatedTitles: relatedTitles.join(' | '),

    // QA
    isProblematic,
    issueCount:    issues.length,
    issues:        issues.join(' | '),
  };
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

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
  const keys = Object.keys(records[0]);
  const header = keys.join(',');
  const rows   = records.map(r => toCsvRow(r, keys));
  fs.writeFileSync(filepath, [header, ...rows].join('\n'), 'utf8');
  console.log(`✓ Wrote ${records.length} rows → ${filepath}`);
}

function writeJson(records, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`✓ Wrote ${records.length} records → ${filepath}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(HTML_DIR)) {
    console.error(`✗ Directory not found: ${HTML_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(HTML_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();

  if (files.length === 0) {
    console.error(`✗ No .html files found in ${HTML_DIR}`);
    process.exit(1);
  }

  console.log(`Processing ${files.length} files from ${HTML_DIR} …\n`);

  const records    = [];
  const problematic = [];

  for (const filename of files) {
    const filepath = path.join(HTML_DIR, filename);
    const html     = fs.readFileSync(filepath, 'utf8');
    const record   = extractPage(filename, html);
    records.push(record);

    if (record.isProblematic) {
      problematic.push(record);
      console.log(`  ⚠  ${filename} (${record.issueCount} issue${record.issueCount > 1 ? 's' : ''}): ${record.issues}`);
    } else {
      const notes = record.issueCount > 0 ? ` [${record.issueCount} minor: ${record.issues}]` : '';
      console.log(`  ✓  ${filename} — ${record.author || '?'} · ${record.verdictText || '?'} · gen:${record.generation}${notes}`);
    }
  }

  console.log(`\n── Summary ──────────────────────────────────────`);
  console.log(`  Total files:    ${records.length}`);
  console.log(`  v1 (older):     ${records.filter(r => r.generation === 'v1').length}`);
  console.log(`  v2 (newer):     ${records.filter(r => r.generation === 'v2').length}`);
  console.log(`  Problematic:    ${problematic.length}`);
  console.log(`  Has char table: ${records.filter(r => r.hasCharTable).length}`);
  console.log(`  Has quick ans:  ${records.filter(r => r.hasQuickAnswer).length}`);
  console.log(`  Has FAQ sect:   ${records.filter(r => r.hasFaqSection).length}`);
  console.log(`  Missing affil:  ${records.filter(r => r.affiliateLinkCount === 0).length}`);
  console.log(`─────────────────────────────────────────────────\n`);

  // Write main output
  if (FORMAT === 'json') {
    writeJson(records, OUT_FILE);
  } else {
    writeCsv(records, OUT_FILE);
  }

  // Write issues report if requested
  if (WRITE_ISSUES && records.filter(r => r.issueCount > 0).length > 0) {
    const issueRecords = records.filter(r => r.issueCount > 0);
    const issuesFile   = OUT_FILE.replace(/\.(csv|json)$/, '-issues.$1');
    if (FORMAT === 'json') {
      writeJson(issueRecords, issuesFile);
    } else {
      writeCsv(issueRecords, issuesFile);
    }
    console.log(`✓ Issues report → ${issuesFile}`);
  }

  // Print problematic slugs for easy copy-paste into quarantine script
  if (problematic.length > 0) {
    console.log(`\n── Problematic files (quarantine candidates) ────`);
    problematic.forEach(r => console.log(`  ${r.filename}`));
    console.log(`─────────────────────────────────────────────────`);
  }
}

run();
