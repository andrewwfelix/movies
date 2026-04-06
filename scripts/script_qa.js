#!/usr/bin/env node
/**
 * BooksVersusMovies.com — QA & Verification Script
 * Checks all HTML comparison pages for required elements and assets.
 *
 * Checks per page:
 *   - <title> tag present and not generic
 *   - <meta name="description"> present
 *   - Google Analytics tag present
 *   - Schema.org JSON-LD present
 *   - Affiliate disclosure present
 *   - Buy button present with affiliate link
 *   - Trailer thumbnail present
 *   - Book cover image tag present
 *   - Alt text on book cover (not empty or generic)
 *   - Alt text on trailer image (not empty or generic)
 *   - Verdict badge present
 *   - Related section present
 *   - Footer disclosure present
 *   - "I earn" not "we earn" in disclosure
 *   - Book cover image file exists on disk
 *
 * Usage:
 *   node script_qa.js
 *
 * Run from your site root directory.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// CONFIG
// ------------------------------------------------------------------ //

const SKIP_FILES = new Set(['index.html', 'about.html', '404.html']);
const IMAGES_DIR = 'images';
const GA_ID = 'G-P0DY0XDWVV';

// ------------------------------------------------------------------ //
// CHECKS
// ------------------------------------------------------------------ //

function checkPage(filepath, filename) {
  const content = fs.readFileSync(filepath, 'utf8');
  const issues = [];
  const warnings = [];

  // Title
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch) {
    issues.push('Missing <title> tag');
  } else if (titleMatch[1].trim().length < 20) {
    warnings.push(`Title seems too short: "${titleMatch[1].trim()}"`);
  }

  // Meta description
  const metaDesc = content.match(/<meta name="description" content="([^"]+)"/);
  if (!metaDesc) {
    issues.push('Missing <meta name="description">');
  } else if (metaDesc[1].length < 50) {
    warnings.push(`Meta description seems too short (${metaDesc[1].length} chars)`);
  } else if (metaDesc[1].length > 165) {
    warnings.push(`Meta description may be too long (${metaDesc[1].length} chars)`);
  }

  // Google Analytics
  if (!content.includes(GA_ID)) {
    issues.push('Missing Google Analytics tag');
  }

  // Schema.org
  if (!content.includes('application/ld+json')) {
    issues.push('Missing Schema.org JSON-LD');
  }

  // Affiliate disclosure near buy button
  if (!content.includes('class="affiliate-disclosure"')) {
    issues.push('Missing affiliate disclosure near buy button');
  }

  // "I earn" not "we earn"
  if (content.includes('we earn from qualifying purchases')) {
    issues.push('Disclosure says "we earn" — should be "I earn"');
  }

  // Buy button
  if (!content.includes('class="buy-btn"')) {
    issues.push('Missing buy button');
  }

  // Affiliate link
  if (!content.includes('amzn.to')) {
    issues.push('Missing Amazon affiliate link');
  }

  // Trailer thumbnail
  if (!content.includes('class="trailer-thumbnail"')) {
    issues.push('Missing trailer thumbnail');
  }

  // Trailer note
  if (!content.includes('class="trailer-note"')) {
    issues.push('Missing trailer note');
  }

  // Book cover image
  const bookCoverMatch = content.match(/class="book-cover"[^>]*src="([^"]+)"/);
  if (!bookCoverMatch) {
    issues.push('Missing book cover image');
  } else {
    // Check image file exists on disk
    const imgSrc = bookCoverMatch[1].replace('./', '');
    const imgPath = path.join(process.cwd(), imgSrc);
    if (!fs.existsSync(imgPath)) {
      issues.push(`Book cover image file not found: ${imgSrc}`);
    }
  }

  // Alt text on book cover
  const bookCoverAlt = content.match(/class="book-cover"[^>]*alt="([^"]*)"/);
  if (!bookCoverAlt) {
    issues.push('Missing alt text on book cover image');
  } else if (bookCoverAlt[1].trim().length < 10) {
    warnings.push(`Book cover alt text seems too short: "${bookCoverAlt[1]}"`);
  }

  // Alt text on trailer image
  const trailerAlt = content.match(/img\.youtube\.com[^>]*alt="([^"]*)"/);
  if (!trailerAlt) {
    warnings.push('Could not verify trailer image alt text');
  } else if (trailerAlt[1].trim().length < 10) {
    warnings.push(`Trailer image alt text seems too short: "${trailerAlt[1]}"`);
  }

  // Verdict badge
  if (!content.includes('class="verdict-badge')) {
    issues.push('Missing verdict badge');
  }

  // Related section
  if (!content.includes('class="related-section"')) {
    issues.push('Missing related section');
  }

  // Footer disclosure
  if (!content.includes('Amazon Associate')) {
    issues.push('Missing footer affiliate disclosure');
  }

  // About link in nav
  if (!content.includes('about.html')) {
    warnings.push('About link not found in nav or footer');
  }

  // Verdict class check
  const hasBookWins = content.includes('verdict-book');
  const hasFilmWins = content.includes('verdict-film');
  const hasTie = content.includes('verdict-tie');
  if (!hasBookWins && !hasFilmWins && !hasTie) {
    issues.push('No verdict class found (verdict-book, verdict-film, or verdict-tie)');
  }

  return { issues, warnings };
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();

  const htmlFiles = fs.readdirSync(root)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .sort();

  if (htmlFiles.length === 0) {
    console.error('❌ No HTML files found. Run from your site root.');
    process.exit(1);
  }

  console.log(`\nBooksVersusMovies.com — QA Report`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Checking ${htmlFiles.length} pages...\n`);

  let totalIssues = 0;
  let totalWarnings = 0;
  const failedPages = [];
  const warnedPages = [];

  htmlFiles.forEach(filename => {
    const filepath = path.join(root, filename);
    const { issues, warnings } = checkPage(filepath, filename);

    if (issues.length === 0 && warnings.length === 0) {
      console.log(`  ✅ ${filename}`);
    } else {
      if (issues.length > 0) {
        console.log(`  ❌ ${filename}`);
        issues.forEach(i => console.log(`     🔴 ${i}`));
        failedPages.push(filename);
        totalIssues += issues.length;
      }
      if (warnings.length > 0) {
        if (issues.length === 0) console.log(`  ⚠️  ${filename}`);
        warnings.forEach(w => console.log(`     🟡 ${w}`));
        warnedPages.push(filename);
        totalWarnings += warnings.length;
      }
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`QA Summary`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Pages checked:   ${htmlFiles.length}`);
  console.log(`Pages passing:   ${htmlFiles.length - failedPages.length}`);
  console.log(`Pages with issues: ${failedPages.length}`);
  console.log(`Pages with warnings: ${warnedPages.length}`);
  console.log(`Total issues:    ${totalIssues}`);
  console.log(`Total warnings:  ${totalWarnings}`);

  if (failedPages.length > 0) {
    console.log(`\n🔴 Pages requiring fixes:`);
    failedPages.forEach(f => console.log(`   • ${f}`));
  }

  if (warnedPages.length > 0) {
    console.log(`\n🟡 Pages with warnings:`);
    warnedPages.forEach(f => console.log(`   • ${f}`));
  }

  if (totalIssues === 0 && totalWarnings === 0) {
    console.log(`\n🎉 All pages passing QA!`);
  }
}

main();
