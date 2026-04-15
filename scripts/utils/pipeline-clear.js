#!/usr/bin/env node

/**
 * pipeline-clear.js
 * BooksVersusMovies.com — clears all pipeline outputs for a slug
 *
 * Removes generated files so the pipeline can be re-run cleanly.
 * Does NOT delete the input file in data/greenfield/inputs/.
 *
 * Usage:
 *   node scripts/utils/pipeline-clear.js --slug jaws
 *   node scripts/utils/pipeline-clear.js --slug jaws --write
 *
 * Destination: scripts/utils/pipeline-clear.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args  = process.argv.slice(2);
const get   = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const SLUG  = get('--slug', null);
const WRITE = args.includes('--write');

if (!SLUG) {
  console.error('✗ --slug required. Usage: node scripts/utils/pipeline-clear.js --slug jaws');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '../..');

const targets = [
  { path: path.join(ROOT, 'data', 'greenfield', 'stage1', `${SLUG}.json`), label: `data/greenfield/stage1/${SLUG}.json` },
  { path: path.join(ROOT, 'data', 'greenfield', 'stage2', `${SLUG}.json`), label: `data/greenfield/stage2/${SLUG}.json` },
  { path: path.join(ROOT, 'pipeline', '2-revised',        `${SLUG}.json`), label: `pipeline/2-revised/${SLUG}.json` },
  { path: path.join(ROOT, 'pipeline', '3-rendered',       `${SLUG}.html`), label: `pipeline/3-rendered/${SLUG}.html` },
  { path: path.join(ROOT,                                 `${SLUG}.html`), label: `${SLUG}.html (root)` },
];

console.log(`\npipeline-clear.js`);
console.log(`Slug:  ${SLUG}`);
console.log(`Mode:  ${WRITE ? 'WRITE' : 'PREVIEW'}`);
console.log(`${'─'.repeat(50)}`);

let found   = 0;
let missing = 0;

for (const target of targets) {
  if (fs.existsSync(target.path)) {
    console.log(`  ✓  ${target.label}`);
    if (WRITE) fs.unlinkSync(target.path);
    found++;
  } else {
    console.log(`  –  ${target.label} (not found)`);
    missing++;
  }
}

console.log(`${'─'.repeat(50)}`);
console.log(`  Found:   ${found}`);
console.log(`  Missing: ${missing}`);

if (!WRITE && found > 0) {
  console.log(`\n[PREVIEW] Run with --write to delete.`);
} else if (WRITE && found > 0) {
  console.log(`\n✓ Cleared. Re-run pipeline:`);
  console.log(`  node scripts\\pipeline-greenfield.js --slug ${SLUG}`);
} else {
  console.log(`\n✓ Nothing to clear.`);
}
