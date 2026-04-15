#!/usr/bin/env node

/**
 * archive-logs.js
 * BooksVersusMovies.com — moves old log files to logs/archive/
 *
 * Keeps today's logs in logs/ root.
 * Moves everything older to logs/archive/YYYY-MM-DD/
 *
 * Usage:
 *   node scripts/utils/archive-logs.js           (preview)
 *   node scripts/utils/archive-logs.js --write   (apply)
 *
 * Destination: scripts/utils/archive-logs.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const WRITE   = process.argv.includes('--write');
const ROOT    = path.resolve(__dirname, '../..');
const LOGS    = path.join(ROOT, 'logs');
const ARCHIVE = path.join(LOGS, 'archive');
const TODAY   = new Date().toISOString().split('T')[0];

console.log(`\narchive-logs.js`);
console.log(`Mode:  ${WRITE ? 'WRITE' : 'PREVIEW'}`);
console.log(`Today: ${TODAY}`);
console.log(`${'─'.repeat(50)}`);

if (!fs.existsSync(LOGS)) {
  console.log('No logs/ directory found.');
  process.exit(0);
}

const files = fs.readdirSync(LOGS).filter(f => {
  const full = path.join(LOGS, f);
  return fs.statSync(full).isFile() && f.endsWith('.log') && !f.startsWith(TODAY);
});

if (files.length === 0) {
  console.log('Nothing to archive — only today\'s logs present.');
  process.exit(0);
}

// Group by date
const byDate = {};
for (const f of files) {
  const date = f.slice(0, 10); // YYYY-MM-DD
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push(f);
}

let moved = 0;
for (const [date, dateFiles] of Object.entries(byDate)) {
  const destDir = path.join(ARCHIVE, date);
  console.log(`\n  ${date} (${dateFiles.length} files)`);

  for (const f of dateFiles) {
    console.log(`    → archive/${date}/${f}`);
    if (WRITE) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.renameSync(path.join(LOGS, f), path.join(destDir, f));
      moved++;
    }
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`  To archive: ${files.length}`);

if (!WRITE) {
  console.log(`\n[PREVIEW] Run with --write to apply.`);
} else {
  console.log(`  Archived:   ${moved}`);
  console.log(`\n✓ Done.`);
}
