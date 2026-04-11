#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Review Page Audit
 *
 * Scans all HTML files in the reviews/ directory and checks each one
 * for the fields and structure required by the site pipeline.
 *
 * Usage:
 *   node audit-reviews.js                        # default: ./reviews
 *   node audit-reviews.js --dir path/to/reviews  # custom directory
 *   node audit-reviews.js --json                 # output full JSON report
 *
 * Output:
 *   - Console summary with pass/warn/fail per file
 *   - audit-report.json written alongside the script
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const dirArgIdx = args.indexOf('--dir');
const reviewsDir = dirArgIdx !== -1
  ? path.resolve(args[dirArgIdx + 1])
  : path.join(process.cwd(), 'reviews');
const jsonMode  = args.includes('--json');

// ── Helpers ─────────────────────────────────────────────────────────────────
function first(html, regex) {
  const m = html.match(regex);
  if (!m) return null;
  // Return the first non-undefined capture group
  for (let i = 1; i < m.length; i++) {
    if (m[i] !== undefined) return m[i].trim();
  }
  return null;
}

function extractYouTubeId(html) {
  // trailer-link href
  const m1 = html.match(/trailer-link[^>]*href="https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (m1) return m1[1];
  // img.youtube.com src
  const m2 = html.match(/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})\//);
  if (m2) return m2[1];
  return null;
}

function extractJsonLd(html) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function extractMetaStripFields(html) {
  // Pull all <div class="meta-item"><strong>Label</strong>Value</div> pairs
  const fields = {};
  const re = /<div class="meta-item"><strong>([^<]+)<\/strong>([^<]+)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    fields[m[1].trim()] = m[2].trim();
  }
  return fields;
}

function countRelatedCards(html) {
  return (html.match(/class="related-card"/g) || []).length;
}

// ── Check one file ───────────────────────────────────────────────────────────
function auditFile(filePath) {
  const slug    = path.basename(filePath, '.html');
  const html    = fs.readFileSync(filePath, 'utf8');
  const issues  = [];   // { level: 'error'|'warn', field, message }

  function fail(field, message) { issues.push({ level: 'error', field, message }); }
  function warn(field, message) { issues.push({ level: 'warn',  field, message }); }

  // ── 1. <title> ────────────────────────────────────────────────────────────
  const title = first(html, /<title>([^<]+)<\/title>/i);
  if (!title)                     fail('title', 'Missing <title> tag');
  else if (title.length < 20)    warn('title', `Title seems short: "${title}"`);

  // ── 2. Meta description ───────────────────────────────────────────────────
  const metaDesc = first(html, /<meta\s+name="description"\s+content="([^"]+)"/i)
                || first(html, /<meta\s+content="([^"]+)"\s+name="description"/i);
  if (!metaDesc)                        fail('meta_description', 'Missing meta description');
  else if (metaDesc.length < 50)       warn('meta_description', `Very short (${metaDesc.length} chars)`);
  else if (metaDesc.length > 160)      warn('meta_description', `Too long for SEO (${metaDesc.length} chars, max 160)`);

  // ── 3. Last-updated ───────────────────────────────────────────────────────
  const lastUpdated = first(html, /<meta\s+name="last-updated"\s+content="([^"]+)"/i);
  if (!lastUpdated)  warn('last_updated', 'Missing <meta name="last-updated">');

  // ── 4. GA tag ─────────────────────────────────────────────────────────────
  if (!html.includes('G-P0DY0XDWVV'))
    warn('ga_tag', 'Google Analytics tag G-P0DY0XDWVV not found');

  // ── 5. JSON-LD ────────────────────────────────────────────────────────────
  const jsonLd = extractJsonLd(html);
  if (!jsonLd) {
    fail('json_ld', 'Missing or invalid JSON-LD schema');
  } else {
    if (jsonLd['@type'] !== 'Review')
      fail('json_ld', `Expected @type "Review", got "${jsonLd['@type']}"`);
    if (!jsonLd.reviewBody)
      warn('json_ld', 'reviewBody is empty');
    if (!jsonLd.reviewRating?.ratingValue)
      warn('json_ld', 'reviewRating.ratingValue missing');
    if (!jsonLd.itemReviewed?.name)
      fail('json_ld', 'itemReviewed.name (book title) missing');
    if (!jsonLd.itemReviewed?.author?.name)
      warn('json_ld', 'itemReviewed.author.name missing');
    if (!jsonLd.itemReviewed?.datePublished)
      warn('json_ld', 'itemReviewed.datePublished missing');
  }

  // ── 6. Stylesheet link ────────────────────────────────────────────────────
  if (!html.includes('css/style.css'))
    warn('stylesheet', 'css/style.css link not found');

  // ── 7. genre-tag ─────────────────────────────────────────────────────────
  const genre = first(html, /class="genre-tag">([^<]+)</);
  if (!genre) warn('genre', 'Missing <div class="genre-tag">');

  // ── 8. Page hero / h1 ─────────────────────────────────────────────────────
  const h1 = first(html, /<h1>([^<]+)<\/h1>/i);
  if (!h1) fail('h1', 'Missing <h1> tag');

  // ── 9. meta-strip fields ──────────────────────────────────────────────────
  const metaFields = extractMetaStripFields(html);
  const requiredMeta = ['Author', 'Book Published', 'Director'];
  for (const f of requiredMeta) {
    if (!metaFields[f]) fail('meta_strip', `meta-strip missing field: "${f}"`);
  }
  // Film/Series released — either label is acceptable
  if (!metaFields['Film Released'] && !metaFields['Series Released'])
    warn('meta_strip', 'meta-strip missing "Film Released" or "Series Released"');

  // ── 10. Verdict badge ─────────────────────────────────────────────────────
  const verdictBadge = first(html, /class="verdict-badge[^"]*">([^<]+)</);
  if (!verdictBadge) {
    fail('verdict', 'Missing verdict-badge element');
  } else {
    const validVerdicts = ['Book Wins', 'Movie Wins', 'Too Close to Call'];
    if (!validVerdicts.includes(verdictBadge))
      warn('verdict', `Unexpected verdict text: "${verdictBadge}"`);
    // Check badge class matches text
    const badgeClass = first(html, /class="verdict-badge ([^"]+)"/);
    if (badgeClass) {
      const classMap = { 'verdict-book': 'Book Wins', 'verdict-film': 'Movie Wins', 'verdict-tie': 'Too Close to Call' };
      const expectedText = classMap[badgeClass];
      if (expectedText && expectedText !== verdictBadge)
        fail('verdict', `Badge class "${badgeClass}" does not match text "${verdictBadge}" (expected "${expectedText}")`);
    }
  }

  // ── 11. Book cover image ──────────────────────────────────────────────────
  const bookCoverSrc = first(html, /class="book-cover"[^>]*src="([^"]+)"/);
  if (!bookCoverSrc) warn('book_cover', 'Missing book-cover img src');

  // ── 12. Affiliate link ────────────────────────────────────────────────────
  const affiliateLink = first(html, /rel="noopener sponsored"\s+href="([^"]+)"|href="([^"]+)"\s+rel="noopener sponsored"/);
  if (!affiliateLink) {
    // Try alternate pattern used in some pages
    const alt = html.match(/amzn\.to\/|amazon\.com\//);
    if (!alt) warn('affiliate', 'No Amazon affiliate link found');
  }

  // ── 13. YouTube / trailer ─────────────────────────────────────────────────
  const youtubeId = extractYouTubeId(html);
  // Not a hard error — some older pages may use video affiliate link instead
  // but flag if neither is present
  if (!youtubeId) {
    const hasVideoAffiliate = /buy-video-btn|buy.*rent/i.test(html);
    if (!hasVideoAffiliate) warn('trailer', 'No YouTube ID or video affiliate link found');
    else warn('trailer', 'No YouTube ID (has video affiliate link instead)');
  }

  // ── 14. trailer-note (starring line) ─────────────────────────────────────
  const trailerNote = first(html, /class="trailer-note">([^<]+)</);
  if (!trailerNote) warn('starring_line', 'Missing <p class="trailer-note">');

  // ── 15. Spoiler warning ───────────────────────────────────────────────────
  if (!html.includes('spoiler-warning'))
    warn('spoiler_warning', 'Missing spoiler-warning block');

  // ── 16. Key sections in body-text ────────────────────────────────────────
  if (!html.includes('The Story in Brief'))
    warn('story_brief', 'Missing "The Story in Brief" heading');
  if (!html.includes('Key Differences'))
    warn('key_differences', 'Missing "Key Differences" heading');
  const diffCount = (html.match(/class="difference"/g) || []).length;
  if (diffCount < 3)
    warn('differences', `Only ${diffCount} difference sections found (expected 4-5)`);
  if (!html.includes('Should You Read First'))
    warn('read_first', 'Missing "Should You Read First" section');
  if (!html.includes('verdict-box'))
    warn('verdict_box', 'Missing verdict-box element');

  // ── 17. char-table ────────────────────────────────────────────────────────
  if (!html.includes('char-table'))
    warn('char_table', 'Missing cast/character table (.char-table)');

  // ── 18. FAQ ───────────────────────────────────────────────────────────────
  if (!html.includes('faq-list'))
    warn('faq', 'Missing FAQ section (.faq-list)');

  // ── 19. Related cards ─────────────────────────────────────────────────────
  const relatedCount = countRelatedCards(html);
  if (relatedCount === 0)      fail('related_cards', 'No related cards found');
  else if (relatedCount !== 3) warn('related_cards', `Expected 3 related cards, found ${relatedCount}`);

  // ── 20. Related card links — should be /reviews/slug.html or /slug.html ──
  const relatedLinks = [...html.matchAll(/class="related-card"\s+href="([^"]+)"/g)].map(m => m[1]);
  for (const link of relatedLinks) {
    if (!link.startsWith('/'))
      warn('related_links', `Related card link is not root-relative: "${link}"`);
  }

  // ── 21. Footer ────────────────────────────────────────────────────────────
  if (!html.includes('<footer>'))
    warn('footer', 'Missing <footer> element');
  if (!html.includes('Amazon Associate'))
    warn('footer', 'Missing Amazon Associate disclosure in footer');

  // ── Summary ───────────────────────────────────────────────────────────────
  const errors   = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warn');

  // Extract key data for CSV/JSON output
  const data = {
    slug,
    file:         path.basename(filePath),
    title:        jsonLd?.itemReviewed?.name || title || '',
    author:       jsonLd?.itemReviewed?.author?.name || metaFields['Author'] || '',
    book_year:    jsonLd?.itemReviewed?.datePublished || metaFields['Book Published'] || '',
    film_year:    metaFields['Film Released'] || metaFields['Series Released'] || '',
    director:     metaFields['Director'] || '',
    genre:        genre || '',
    verdict:      verdictBadge || '',
    meta_desc:    metaDesc || '',
    youtube_id:   youtubeId || '',
    last_updated: lastUpdated || '',
    has_char_table: html.includes('char-table'),
    has_faq:        html.includes('faq-list'),
    has_spoiler:    html.includes('spoiler-warning'),
    diff_count:     diffCount,
    related_count:  relatedCount,
    error_count:    errors.length,
    warn_count:     warnings.length,
  };

  return { slug, filePath, data, issues, errors, warnings };
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(reviewsDir)) {
    console.error(`❌ Directory not found: ${reviewsDir}`);
    console.error(`   Use: node audit-reviews.js --dir path/to/reviews`);
    process.exit(1);
  }

  const files = fs.readdirSync(reviewsDir)
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => path.join(reviewsDir, f));

  if (files.length === 0) {
    console.error(`❌ No .html files found in: ${reviewsDir}`);
    process.exit(1);
  }

  console.log(`\nBooksVersusMovies — Review Page Audit`);
  console.log(`Directory: ${reviewsDir}`);
  console.log(`Files:     ${files.length}\n`);
  console.log('─'.repeat(72));

  const results = files.map(auditFile);

  // ── Per-file output ──────────────────────────────────────────────────────
  if (!jsonMode) {
    for (const r of results) {
      const status = r.errors.length > 0 ? '❌ FAIL' : r.warnings.length > 0 ? '⚠️  WARN' : '✅ PASS';
      console.log(`${status}  ${r.slug}`);
      for (const issue of r.issues) {
        const prefix = issue.level === 'error' ? '       ✗' : '       ·';
        console.log(`${prefix} [${issue.field}] ${issue.message}`);
      }
    }
    console.log('─'.repeat(72));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed   = results.filter(r => r.errors.length === 0 && r.warnings.length === 0);
  const warned   = results.filter(r => r.errors.length === 0 && r.warnings.length > 0);
  const failed   = results.filter(r => r.errors.length > 0);
  const allIssues = results.flatMap(r => r.issues);
  const fieldCounts = {};
  for (const i of allIssues) {
    fieldCounts[i.field] = (fieldCounts[i.field] || 0) + 1;
  }

  console.log(`\nSummary`);
  console.log(`  ✅ Pass:  ${passed.length}`);
  console.log(`  ⚠️  Warn:  ${warned.length}`);
  console.log(`  ❌ Fail:  ${failed.length}`);
  console.log(`  Total:   ${results.length}`);

  if (Object.keys(fieldCounts).length > 0) {
    console.log(`\nMost common issues:`);
    Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([field, count]) => {
        console.log(`  ${String(count).padStart(3)}x  ${field}`);
      });
  }

  // ── Write JSON report ─────────────────────────────────────────────────────
  const reportPath = path.join(process.cwd(), 'audit-report.json');
  const report = {
    generated:  new Date().toISOString(),
    directory:  reviewsDir,
    total:      results.length,
    passed:     passed.length,
    warned:     warned.length,
    failed:     failed.length,
    files: results.map(r => ({
      slug:     r.slug,
      status:   r.errors.length > 0 ? 'fail' : r.warnings.length > 0 ? 'warn' : 'pass',
      data:     r.data,
      issues:   r.issues,
    }))
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nFull report: ${reportPath}`);

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
