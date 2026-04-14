#!/usr/bin/env node

/**
 * fix-require-paths.js
 * Run once after reorganize-scripts.bat to fix require() paths
 * in the three pipeline scripts that reference moved modules.
 *
 * Usage: node scripts\fix-require-paths.js
 * Destination: scripts/fix-require-paths.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const fixes = [
  {
    file:    path.join(ROOT, 'scripts', 'pipeline-render.js'),
    from:    "require('./logger')",
    to:      "require('./utils/logger')",
  },
  {
    file:    path.join(ROOT, 'scripts', 'pipeline-generate.js'),
    from:    "require('./validate-json-schema')",
    to:      "require('./utils/validate-json-schema')",
  },
  {
    file:    path.join(ROOT, 'scripts', 'content', 'generate-review.js'),
    from:    "require('./validate-json-schema')",
    to:      "require('../utils/validate-json-schema')",
  },
];

console.log('\nfix-require-paths.js');
console.log('─'.repeat(50));

for (const fix of fixes) {
  const label = fix.file.replace(ROOT + path.sep, '');

  if (!fs.existsSync(fix.file)) {
    console.log(`  –  ${label} (not found — skipping)`);
    continue;
  }

  let content = fs.readFileSync(fix.file, 'utf8');

  if (!content.includes(fix.from)) {
    console.log(`  –  ${label} (already fixed)`);
    continue;
  }

  content = content.replace(fix.from, fix.to);
  fs.writeFileSync(fix.file, content, 'utf8');
  console.log(`  ✓  ${label}`);
  console.log(`       ${fix.from} → ${fix.to}`);
}

console.log('\nDone. Verify with: node scripts\\pipeline-render.js --dry');
