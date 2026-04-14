#!/usr/bin/env node

/**
 * add-destination.js
 * BooksVersusMovies.com — stamps Destination: comments into all project scripts
 *
 * Walks the project tree and adds a "Destination: <relative-path>" comment
 * to every file that doesn't already have one. This lets deploy.js know
 * where to copy each file when downloaded from a Claude session.
 *
 * Usage:
 *   node scripts/utils/add-destination.js          (preview)
 *   node scripts/utils/add-destination.js --write  (apply)
 *
 * Destination: scripts/utils/add-destination.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args  = process.argv.slice(2);
const WRITE = args.includes('--write');

const ROOT  = path.resolve(__dirname, '../..');

// ── Folders to scan ───────────────────────────────────────────────────────────
// Each entry: [folder relative to ROOT, file extensions to stamp]

const SCAN = [
  // Pipeline scripts at scripts/ root
  ['scripts',                    ['.js'],          false],  // non-recursive
  // Subfolders
  ['scripts/utils',              ['.js'],          false],
  ['scripts/ops',                ['.js'],          false],
  ['scripts/content',            ['.js'],          false],
  ['scripts/reporting',          ['.js'],          false],
  ['scripts/prompts',            ['.txt'],         false],
  // Config
  ['config',                     ['.json'],        false],
  // Data schemas and guide config
  ['data/schemas',               ['.json'],        false],
  ['data/guides',                ['.json'],        false],
  // Docs strategy
  ['docs/strategy',              ['.md'],          false],
  // Root files
  ['.',                          ['.toml', '.js'], false],
];

// Files to skip — either generated output or shouldn't be stamped
const SKIP_FILES = new Set([
  'package.json',
  'package-lock.json',
  'sitemap.xml',
]);

// ── Get destination string for a file ────────────────────────────────────────

function getRelativeDest(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

// ── Check if file already has destination ────────────────────────────────────

function hasDestination(content) {
  return content.split('\n').slice(0, 30).some(l => /Destination:/.test(l));
}

// ── Add destination to file ───────────────────────────────────────────────────

function addDestination(filePath, dest) {
  const ext     = path.extname(filePath).toLowerCase();
  let   content = fs.readFileSync(filePath, 'utf8');

  if (hasDestination(content)) return 'already has destination';

  let updated;

  if (ext === '.js') {
    // Add inside the JSDoc header block before closing */
    if (content.includes(' */')) {
      updated = content.replace(
        / \*\/(\r?\n)/,
        ` * Destination: ${dest}\n */$1`
      );
    } else {
      // No JSDoc — prepend a comment
      updated = `// Destination: ${dest}\n` + content;
    }
  } else if (ext === '.json') {
    try {
      const obj = JSON.parse(content);
      if (!obj._destination) {
        // Insert _destination as first key
        const { _destination, ...rest } = obj;
        updated = JSON.stringify({ _destination: dest, ...rest }, null, 2);
      } else {
        return 'already has destination';
      }
    } catch {
      return 'json parse error — skipped';
    }
  } else {
    // .txt, .md, .toml — prepend comment line
    const comment = ext === '.md'
      ? `[//]: # (Destination: ${dest})\n`
      : `# Destination: ${dest}\n`;
    updated = comment + content;
  }

  if (WRITE && updated) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }

  return updated ? 'stamped' : 'no change';
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log(`\nadd-destination.js`);
  console.log(`Mode:    ${WRITE ? 'WRITE' : 'PREVIEW'}`);
  console.log(`Project: ${ROOT}`);
  console.log(`${'─'.repeat(55)}`);

  let stamped  = 0;
  let already  = 0;
  let skipped  = 0;

  for (const [folder, exts] of SCAN) {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir)
      .filter(f => {
        if (SKIP_FILES.has(f)) return false;
        const ext = path.extname(f).toLowerCase();
        return exts.includes(ext) && fs.statSync(path.join(dir, f)).isFile();
      })
      .sort();

    for (const file of entries) {
      const filePath = path.join(dir, file);
      const dest     = getRelativeDest(filePath);
      const result   = addDestination(filePath, dest);

      if (result === 'stamped') {
        console.log(`  ✓  ${dest}`);
        stamped++;
      } else if (result === 'already has destination') {
        already++;
      } else {
        console.log(`  –  ${dest} (${result})`);
        skipped++;
      }
    }
  }

  console.log(`${'─'.repeat(55)}`);
  console.log(`  Stamped:  ${stamped}`);
  console.log(`  Already:  ${already}`);
  console.log(`  Skipped:  ${skipped}`);

  if (!WRITE && stamped > 0) {
    console.log(`\n[PREVIEW] Run with --write to apply.`);
  } else if (WRITE && stamped > 0) {
    console.log(`\n✓ Done. All scripts now have Destination: comments.`);
    console.log(`  deploy.js will pick them up automatically.`);
  } else if (stamped === 0) {
    console.log(`\n✓ All files already have Destination: comments.`);
  }
}

run();
