#!/usr/bin/env node

/**
 * fix-nav.js
 * One-time script to fix nav in static HTML files that aren't
 * pipeline-generated (about.html) or were generated before nav.json existed.
 *
 * Usage: node scripts/fix-nav.js
 * Destination: scripts/fix-nav.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '../..');
const NAV_PATH = path.join(ROOT, 'config', 'nav.json');

function renderNav() {
  const items = JSON.parse(fs.readFileSync(NAV_PATH, 'utf8')).items;
  return items
    .map((item, i) => {
      const mid = i < items.length - 1 ? ` &nbsp;&middot;&nbsp;` : '';
      return `      <a href="${item.href}">${item.label}</a>${mid}`;
    })
    .join('\n');
}

const correctHeader = `<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
${renderNav()}
    </nav>
  </div>
</header>`;

// Files to fix — add any new static files here
const targets = [
  path.join(ROOT, 'about.html'),
  path.join(ROOT, 'auteurs.html'),
  // All spotlight files in root
  ...fs.readdirSync(ROOT)
    .filter(f => f.startsWith('spotlight-') && f.endsWith('.html'))
    .map(f => path.join(ROOT, f)),
];

console.log('\nfix-nav.js');
console.log('─'.repeat(50));

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) continue;

  const label = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace anything between <header> and </header>
  const newContent = content.replace(
    /<header>[\s\S]*?<\/header>/,
    correctHeader
  );

  if (newContent === content) {
    console.log(`  –  ${label} (no change needed)`);
    continue;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`  ✓  ${label}`);
}

console.log('\nDone. Run: node scripts\\check-nav.js');
