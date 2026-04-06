#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Trailer Note & Cast Updater
 * Updates the trailer-note paragraph on 2026 comparison pages
 * with accurate release dates and corrected cast information.
 *
 * Usage:
 *   node update_trailer_notes.js
 *
 * Run from your site's root directory.
 * Creates a /backup_trailer/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// PAGE DATA — confirmed release dates and cast
// ------------------------------------------------------------------ //

const PAGES = [
  {
    file: 'project-hail-mary.html',
    trailerNote: 'Starring Ryan Gosling, Sandra H&uuml;ller, Lionel Boyce &mdash; In theaters March 20, 2026',
  },
  {
    file: 'wuthering-heights.html',
    trailerNote: 'Starring Margot Robbie, Jacob Elordi, Hong Chau &mdash; In theaters February 13, 2026',
  },
  {
    file: 'remarkably-bright-creatures.html',
    trailerNote: 'Starring Sally Field, Lewis Pullman, Colm Meaney &mdash; Streaming May 8, 2026',
  },
  {
    file: 'verity.html',
    trailerNote: 'Starring Anne Hathaway, Dakota Johnson, Josh Hartnett &mdash; In theaters October 2, 2026',
  },
  {
    file: 'hunger-games-sunrise.html',
    trailerNote: 'Starring Joseph Zada, Ralph Fiennes, Elle Fanning &mdash; In theaters November 20, 2026',
  },
  {
    file: 'narnia-magicians-nephew.html',
    trailerNote: 'dir. Greta Gerwig &mdash; In theaters November 26, 2026',
  },
  {
    file: 'hamnet.html',
    trailerNote: 'Starring Jessie Buckley, Paul Mescal, Emily Watson &mdash; In theaters December 2025 / early 2026',
  },
  {
    file: 'the-odyssey.html',
    trailerNote: 'Starring Matt Damon, Anne Hathaway, Tom Holland &mdash; In theaters July 17, 2026',
  },
];

// ------------------------------------------------------------------ //
// HELPERS
// ------------------------------------------------------------------ //

function backupFiles(files, backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  files.forEach(file => {
    fs.copyFileSync(file, path.join(backupDir, path.basename(file)));
  });
  console.log(`✅ Backed up ${files.length} files to /backup_trailer/\n`);
}

function updateTrailerNote(content, trailerNote) {
  // Try single-line match first
  let updated = content.replace(
    /<p class="trailer-note">[^<]*<\/p>/,
    `<p class="trailer-note">${trailerNote}</p>`
  );
  // Fallback: multiline match
  if (updated === content) {
    updated = content.replace(
      /<p class="trailer-note">[\s\S]*?<\/p>/,
      `<p class="trailer-note">${trailerNote}</p>`
    );
  }
  return updated;
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_trailer');

  const existingPages = PAGES.filter(p =>
    fs.existsSync(path.join(root, p.file))
  );

  if (existingPages.length === 0) {
    console.error('❌ No matching HTML files found. Make sure you\'re running this from your site root.');
    process.exit(1);
  }

  console.log(`Found ${existingPages.length} HTML files to process.\n`);
  backupFiles(existingPages.map(p => path.join(root, p.file)), backupDir);

  const updated = [];
  const skipped = [];

  existingPages.forEach(page => {
    const filepath = path.join(root, page.file);
    const original = fs.readFileSync(filepath, 'utf8');
    const newContent = updateTrailerNote(original, page.trailerNote);

    if (newContent !== original) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`  ✅ Updated ${page.file}`);
      console.log(`     Note: ${page.trailerNote}`);
      updated.push(page.file);
    } else if (original.includes(page.trailerNote)) {
      console.log(`  ✅ Already correct: ${page.file}`);
      updated.push(page.file);
    } else {
      console.log(`  ⚠️  No trailer-note found in ${page.file} — check HTML structure`);
      skipped.push(page.file);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
  if (updated.length) {
    console.log('\nUpdated:');
    updated.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_trailer/ — delete once verified.');
}

main();
