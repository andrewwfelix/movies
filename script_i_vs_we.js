#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Amazon Disclosure i vs we Fixer
 * Replaces "As an Amazon Associate we earn from qualifying purchases."
 * with the official Amazon-required language:
 * "As an Amazon Associate I earn from qualifying purchases."
 *
 * Usage:
 *   node script_i_vs_we.js
 *
 * Run from your site's root directory.
 * Creates a /backup_i_vs_we/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// CONFIG
// ------------------------------------------------------------------ //

const FIND    = 'As an Amazon Associate we earn from qualifying purchases.';
const REPLACE = 'As an Amazon Associate I earn from qualifying purchases.';

const SKIP_FILES = new Set(['audit.js']);

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
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_i_vs_we/\n`);
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_i_vs_we');

  // Find all HTML files in root directory
  const htmlFiles = fs.readdirSync(root)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .map(f => path.join(root, f));

  if (htmlFiles.length === 0) {
    console.error('❌ No HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${htmlFiles.length} HTML files to process.\n`);
  backupFiles(htmlFiles, backupDir);

  const updated = [];
  const skipped = [];

  htmlFiles.sort().forEach(filepath => {
    const filename = path.basename(filepath);
    const content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes(FIND)) {
      console.log(`  ⏭  Skipping ${filename} — no "we earn" found`);
      skipped.push(filename);
      return;
    }

    // Replace all occurrences (footer + any other instances)
    const newContent = content.split(FIND).join(REPLACE);
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`  ✅ Updated ${filename}`);
    updated.push(filename);
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  if (skipped.length) {
    console.log('\nSkipped (already correct or no match):');
    skipped.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_i_vs_we/ — delete once verified.');
}

main();
