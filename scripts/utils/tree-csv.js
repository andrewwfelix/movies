#!/usr/bin/env node

/**
 * scripts/utils/tree-code.js
 * Lists all .js files in the project with their last modified timestamp.
 *
 * Usage:
 *   node scripts/utils/tree-code.js
 *   node scripts/utils/tree-code.js --sort date     (newest first, default)
 *   node scripts/utils/tree-code.js --sort name     (alphabetical)
 *   node scripts/utils/tree-code.js --since 2026-04-14  (only files modified on/after date)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '../..');

const SKIP_DIRS = new Set(['node_modules', '.git', 'archive']);

const args    = process.argv.slice(2);
const getArg  = (flag) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : null; };

const SORT    = getArg('--sort') || 'date';
const SINCE   = getArg('--since') ? new Date(getArg('--since')) : null;

// ── Walk ──────────────────────────────────────────────────────────────────────

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.csv')) {
      const stat = fs.statSync(full);
      results.push({
        file:     path.relative(ROOT, full),
        modified: stat.mtime,
      });
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  let files = walk(ROOT);

  if (SINCE) {
    files = files.filter(f => f.modified >= SINCE);
  }

  if (SORT === 'name') {
    files.sort((a, b) => a.file.localeCompare(b.file));
  } else {
    files.sort((a, b) => b.modified - a.modified); // newest first
  }

  const pad = Math.max(...files.map(f => f.file.length));

  console.log(`\ntree-code.js — .js files in project`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`${'File'.padEnd(pad + 2)}Modified`);
  console.log(`${'─'.repeat(70)}`);

  for (const { file, modified } of files) {
    const ts = modified.toISOString().replace('T', ' ').substring(0, 19);
    console.log(`${file.padEnd(pad + 2)}${ts}`);
  }

  console.log(`${'─'.repeat(70)}`);
  console.log(`Total: ${files.length} files`);
  if (SINCE) console.log(`Since: ${SINCE.toISOString().split('T')[0]}`);
  console.log('');
}

run();
