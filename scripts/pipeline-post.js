#!/usr/bin/env node

/**
 * pipeline-post.js
 * BooksVersusMovies.com — post-processing after new pages are added
 *
 * Runs in order:
 *   1. pipeline-browse.js    — regenerates index.html
 *   2. sitemap-generate.js   — updates sitemap.xml
 *   3. check-nav.js          — verifies nav consistency
 *
 * Usage:
 *   node scripts/pipeline-post.js
 *
 * Destination: scripts/pipeline-post.js
 */

'use strict';

const path       = require('path');
const { spawnSync } = require('child_process');

const ROOT    = path.resolve(__dirname, '..');
const SCRIPTS = path.join(ROOT, 'scripts');

function run(scriptPath, label) {
  console.log(`\n── ${label} ${'─'.repeat(45 - label.length)}`);
  const result = spawnSync('node', [scriptPath], {
    cwd:      ROOT,
    encoding: 'utf8',
    stdio:    ['inherit', 'pipe', 'pipe'],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status})`);
    process.exit(1);
  }
}

console.log('\npipeline-post.js');
console.log('═'.repeat(55));

run(path.join(SCRIPTS, 'pipeline-browse.js'),          'Browse (index.html)');
run(path.join(SCRIPTS, 'ops', 'sitemap-generate.js'),  'Sitemap');
run(path.join(SCRIPTS, 'ops', 'check-nav.js'),         'Nav check');

console.log('\n' + '═'.repeat(55));
console.log('✓ Post-processing complete');
console.log('\nNext:');
console.log('  git add .');
console.log('  git commit -m "..."');
console.log('  git checkout main && git merge dev && git push && git checkout dev');
