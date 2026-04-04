#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Add About Link to Nav
 * Adds About link to nav and footer on older pages that are missing it.
 *
 * Usage:
 *   node script_add_about_link.js
 *
 * Run from your site root directory.
 * Creates /backup_about/ first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

const SKIP_FILES = new Set(['index.html', 'about.html', '404.html']);

const OLD_NAV = `<nav><a href="/">All Comparisons</a></nav>`;
const NEW_NAV = `<nav><a href="/">All Comparisons</a> &nbsp;&middot;&nbsp; <a href="about.html">About</a></nav>`;

const OLD_FOOTER = `<p>&copy; 2026 BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="/">Home</a></p>`;
const NEW_FOOTER = `<p>&copy; 2026 BooksVersusMovies.com &nbsp;&mdash;&nbsp; <a href="/">Home</a> &nbsp;&middot;&nbsp; <a href="about.html">About</a></p>`;

function backupFiles(files, backupDir) {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  files.forEach(f => fs.copyFileSync(f, path.join(backupDir, path.basename(f))));
  console.log(`✅ Backed up ${files.length} files to /backup_about/\n`);
}

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_about');

  const htmlFiles = fs.readdirSync(root)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .map(f => path.join(root, f));

  backupFiles(htmlFiles, backupDir);

  const updated = [];
  const skipped = [];

  htmlFiles.sort().forEach(filepath => {
    const filename = path.basename(filepath);
    const original = fs.readFileSync(filepath, 'utf8');

    if (original.includes('about.html')) {
      console.log(`  ⏭  Already has About link: ${filename}`);
      skipped.push(filename);
      return;
    }

    let updated_content = original
      .replace(OLD_NAV, NEW_NAV)
      .replace(OLD_FOOTER, NEW_FOOTER);

    if (updated_content !== original) {
      fs.writeFileSync(filepath, updated_content, 'utf8');
      console.log(`  ✅ Updated ${filename}`);
      updated.push(filename);
    } else {
      console.log(`  ⚠️  Could not find nav/footer pattern in ${filename}`);
      skipped.push(filename);
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${updated.length} files updated, ${skipped.length} skipped.`);
}

main();
