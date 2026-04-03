#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Emoji Remover
 * Removes emojis from verdict badges on comparison pages
 * and card footers on index.html, keeping the text and styling intact.
 *
 * Usage:
 *   node remove_emojis.js
 *
 * Run from your site's root directory.
 * Creates a /backup_emojis/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// CONFIG
// ------------------------------------------------------------------ //

// Emoji replacements — remove emoji, keep clean text
const REPLACEMENTS = [
  // Verdict badges on comparison pages
  { find: '📖 Book Wins',        replace: 'Book Wins' },
  { find: '🎬 Screen Wins',      replace: 'Screen Wins' },
  { find: '🤝 Too Close to Call', replace: 'Too Close to Call' },
  { find: '⚖️ It\'s a Tie',      replace: 'It\'s a Tie' },
  { find: '⚖️ It&rsquo;s a Tie', replace: 'It\'s a Tie' },

  // Card footers on index.html
  { find: '📖 Book Wins',        replace: 'Book Wins' },
  { find: '🎬 Screen Wins',      replace: 'Screen Wins' },
  { find: '🤝 Too Close to Call', replace: 'Too Close to Call' },
  { find: '⚖️ It\'s a Tie',      replace: 'It\'s a Tie' },
];

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
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_emojis/\n`);
}

function removeEmojis(content) {
  let updated = content;
  REPLACEMENTS.forEach(({ find, replace }) => {
    updated = updated.split(find).join(replace);
  });
  return updated;
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_emojis');

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
    const original = fs.readFileSync(filepath, 'utf8');
    const newContent = removeEmojis(original);

    if (newContent !== original) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`  ✅ Updated ${filename}`);
      updated.push(filename);
    } else {
      console.log(`  ⏭  No emojis found in ${filename}`);
      skipped.push(filename);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_emojis/ — delete once verified.');
}

main();
