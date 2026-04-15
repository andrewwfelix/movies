#!/usr/bin/env node

/**
 * check-nav.js
 * BooksVersusMovies.com — nav consistency auditor
 *
 * Scans all HTML files in the project root and pipeline/3-rendered/
 * and flags any that are missing nav items defined in config/nav.json.
 *
 * Usage:
 *   node scripts/check-nav.js           (check all HTML files)
 *   node scripts/check-nav.js --root    (check project root only)
 *   node scripts/check-nav.js --fix     (print find/replace instructions)
 *
 * Destination: scripts/check-nav.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const hasFlag = flag => args.includes(flag);

const ROOT_ONLY = hasFlag('--root');
const FIX_MODE  = hasFlag('--fix');

const ROOT = path.resolve(__dirname, '..');
const NAV_PATH   = path.join(ROOT, 'config', 'nav.json');
const RENDERED   = path.join(ROOT, 'pipeline', '3-rendered');

// ── Load nav config ───────────────────────────────────────────────────────────

function loadNav() {
  if (!fs.existsSync(NAV_PATH)) {
    console.error(`✗ config/nav.json not found: ${NAV_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(NAV_PATH, 'utf8')).items;
}

function renderNav(items) {
  return items
    .map(item => `<a href="${item.href}">${item.label}</a>`)
    .join(' &nbsp;&middot;&nbsp;\n      ');
}

// ── Get HTML files to check ───────────────────────────────────────────────────

function getFiles() {
  const files = [];

  // Always check special pages in root
  const rootSpecial = [
    'index.html',
    'upcoming-adaptations.html',
    'auteurs.html',
    'about.html',
  ];

  for (const f of rootSpecial) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) files.push({ path: p, label: f });
  }

  // Check spotlight pages in root
  const rootFiles = fs.readdirSync(ROOT).filter(f =>
    f.startsWith('spotlight-') && f.endsWith('.html')
  );
  for (const f of rootFiles) {
    files.push({ path: path.join(ROOT, f), label: f });
  }

  if (!ROOT_ONLY && fs.existsSync(RENDERED)) {
    // Sample 5 rendered review pages as a spot check
    const rendered = fs.readdirSync(RENDERED)
      .filter(f => f.endsWith('.html') && !f.startsWith('auteur'))
      .slice(0, 5);
    for (const f of rendered) {
      files.push({ path: path.join(RENDERED, f), label: `pipeline/3-rendered/${f}` });
    }
  }

  return files;
}

// ── Check a single file ───────────────────────────────────────────────────────

function checkFile(filePath, navItems) {
  const content = fs.readFileSync(filePath, 'utf8');
  const missing = navItems.filter(item =>
    !content.includes(`href="${item.href}"`)
  );
  const extra = [];

  // Check for old nav items that shouldn't be there
  // (helps catch when Featured points to wrong URL)
  const navBlock = content.match(/<nav>([\s\S]*?)<\/nav>/);
  if (navBlock) {
    const navContent = navBlock[1];
    const hrefs = [...navContent.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    const expected = navItems.map(i => i.href);
    for (const href of hrefs) {
      if (!expected.includes(href)) {
        extra.push(href);
      }
    }
  }

  return { missing, extra };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const navItems = loadNav();
  const files    = getFiles();

  console.log(`\ncheck-nav.js`);
  console.log(`Nav items:  ${navItems.map(i => i.label).join(' · ')}`);
  console.log(`Files:      ${files.length}`);
  console.log(`${'─'.repeat(60)}`);

  let passed  = 0;
  let failed  = 0;
  const issues = [];

  for (const file of files) {
    const { missing, extra } = checkFile(file.path, navItems);

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ✓  ${file.label}`);
      passed++;
    } else {
      console.log(`  ✗  ${file.label}`);
      if (missing.length > 0) {
        console.log(`       Missing: ${missing.map(i => i.label).join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`       Unexpected hrefs: ${extra.join(', ')}`);
      }
      failed++;
      issues.push({ file: file.label, missing, extra });
    }
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);

  if (failed === 0) {
    console.log(`\n✓ All nav items consistent across checked files.`);
    return;
  }

  console.log(`\n✗ Nav inconsistencies found.`);

  if (FIX_MODE) {
    console.log(`\nCorrect nav to use in all files:`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`<header>`);
    console.log(`  <div class="header-inner">`);
    console.log(`    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>`);
    console.log(`    <nav>`);
    navItems.forEach((item, i) => {
      const mid = i < navItems.length - 1 ? ` &nbsp;&middot;&nbsp;` : '';
      console.log(`      <a href="${item.href}">${item.label}</a>${mid}`);
    });
    console.log(`    </nav>`);
    console.log(`  </div>`);
    console.log(`</header>`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`\nTo fix: copy the nav above and replace the <header>...</header>`);
    console.log(`block in each failing file, then re-run check-nav.js.`);
    console.log(`\nFor pipeline-generated files, re-run the relevant script:`);
    console.log(`  node scripts\\pipeline-render.js --all --force`);
    console.log(`  node scripts\\pipeline-browse.js`);
    console.log(`  node scripts\\pipeline-guide.js --render-only`);
    console.log(`  node scripts\\pipeline-auteurs.js --render`);
  } else {
    console.log(`Run with --fix to see the correct nav and repair instructions.`);
  }

  process.exit(1);
}

run();
