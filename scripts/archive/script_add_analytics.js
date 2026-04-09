#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Google Analytics Tag Injector
 * Adds the gtag.js snippet to every HTML page that is missing it.
 *
 * Usage:
 *   node add_analytics.js
 *
 * Run from your site's root directory.
 * Creates a /backup_analytics/ folder first so you can revert if needed.
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ //
// CONFIG
// ------------------------------------------------------------------ //

const GA_MEASUREMENT_ID = 'G-P0DY0XDWVV';

const GA_SNIPPET = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  </script>`;

// Files to skip
const SKIP_FILES = new Set(['index.html']);

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
  console.log(`✅ Backed up ${htmlFiles.length} files to /backup_analytics/\n`);
}

// ------------------------------------------------------------------ //
// MAIN
// ------------------------------------------------------------------ //

function main() {
  const root = process.cwd();
  const backupDir = path.join(root, 'backup_analytics');

  // Find all HTML files in root, skipping index.html (already has tag)
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

    // Skip if tag already present
    if (content.includes(GA_MEASUREMENT_ID)) {
      console.log(`  ⏭  Skipping ${filename} — Analytics tag already present`);
      skipped.push(filename);
      return;
    }

    // Inject before closing </head>
    const newContent = content.replace('</head>', `${GA_SNIPPET}\n</head>`);

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
    console.log('\nSkipped (tag already present):');
    skipped.forEach(f => console.log(`  • ${f}`));
  }
  console.log('\nOriginals saved in /backup_analytics/ — delete once verified.');
  console.log('\n💡 Verify in Google Analytics → Reports → Realtime after deploying.');
}

main();
