#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Affiliate Disclosure Updater
 * Adds FTC/Amazon-compliant disclosure near every "Buy the Book" button
 * across all HTML comparison pages.
 *
 * Usage:
 *   node add_disclosure.js
 *
 * Run from your site's root directory (where index.html lives).
 * Creates a /backup/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// CONFIG
// ------------------------------------------------------------------ //

const DISCLOSURE_SNIPPET = `<p class="affiliate-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>`;

const BUY_BUTTON_MARKER = 'class="buy-btn"';

const SKIP_FILES = new Set(['index.html', 'audit.js']);

// ------------------------------------------------------------------ //
// HELPERS
// ------------------------------------------------------------------ //

function backupFiles(htmlFiles, backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  htmlFiles.forEach(file => {
    fs.copyFileSync(file, path.join(backupDir, path.basename(file)));
  });
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup/\n`);
}

function addDisclosure(content, filename) {
  if (content.includes(DISCLOSURE_SNIPPET)) {
    console.log(`  ⏭  Skipping ${filename} — disclosure already present`);
    return { content, changed: false };
  }

  if (!content.includes(BUY_BUTTON_MARKER)) {
    console.log(`  ⚠️  No buy button found in ${filename} — skipping`);
    return { content, changed: false };
  }

  // Find the buy button and then its closing </a>
  const markerIdx = content.indexOf(BUY_BUTTON_MARKER);
  const closeTag = '</a>';
  const closeIdx = content.indexOf(closeTag, markerIdx);

  if (closeIdx === -1) {
    console.log(`  ⚠️  Could not find closing </a> in ${filename} — skipping`);
    return { content, changed: false };
  }

  const insertPos = closeIdx + closeTag.length;
  const newContent =
    content.slice(0, insertPos) +
    '\n      ' + DISCLOSURE_SNIPPET +
    content.slice(insertPos);

  return { content: newContent, changed: true };
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup');

  // Find all HTML files in root directory
  const htmlFiles = fs.readdirSync(root)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .map(f => path.join(root, f));

  if (htmlFiles.length === 0) {
    console.error('❌ No HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${htmlFiles.length} HTML files to process.\n`);

  // Backup first
  backupFiles(htmlFiles, backupDir);

  // Process each file
  const updated = [];
  const skipped = [];

  htmlFiles.sort().forEach(filepath => {
    const filename = path.basename(filepath);
    const content = fs.readFileSync(filepath, 'utf8');
    const { content: newContent, changed } = addDisclosure(content, filename);

    if (changed) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`  ✅ Updated ${filename}`);
      updated.push(filename);
    } else {
      skipped.push(filename);
    }
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);

  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  if (skipped.length) {
    console.log('\nSkipped:');
    skipped.forEach(f => console.log(`  • ${f}`));
  }

  console.log('\nOriginals saved in /backup/ — delete that folder once you\'ve verified.');
}

main();
