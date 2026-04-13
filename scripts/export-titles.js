#!/usr/bin/env node

/**
 * export-titles.js
 * BooksVersusMovies.com — export titles and oneLineReason to CSV
 *
 * Reads all JSON files from pipeline/2-revised/ and exports a CSV
 * with slug, pageTitle, metaDesc, winner, and oneLineReason for
 * review and bulk editing in a spreadsheet.
 *
 * Usage:
 *   node export-titles.js
 *   node export-titles.js --out data/titles-export.csv
 *   node export-titles.js --issues-only   (over-limit or generic only)
 *
 * After editing in Excel/Sheets, import back with import-titles.js
 */

const fs   = require('fs');
const path = require('path');

const args       = process.argv.slice(2);
const get        = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag    = flag => args.includes(flag);

const SRC_DIR    = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_PATH   = path.resolve(__dirname, '../', get('--out', 'data/titles-export.csv'));
const ISSUES_ONLY = hasFlag('--issues-only');

const TITLE_TARGET = 65;
const TITLE_LIMIT  = 75;
const META_LIMIT   = 155;

const GENERIC_PHRASES = [
  'both versions', 'both have', 'each version', 'has its strengths',
  'offers more depth', 'depending on', 'both are', 'unique in its own',
  'something for everyone', 'hard to choose', 'different but equal',
  'equally rewarding', 'both equally', 'neither diminishes',
  'complement each other', 'worth experiencing', 'illuminate each other',
];

function isGeneric(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(p => lower.includes(p));
}

function csvEscape(val) {
  const s = (val || '').toString().replace(/"/g, '""');
  return `"${s}"`;
}

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('✗ No JSON files found in pipeline/2-revised/');
    process.exit(1);
  }

  const rows = [];
  let issueCount = 0;

  for (const file of files) {
    const slug = file.replace('.json', '');
    let r;
    try {
      r = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    } catch (e) {
      console.error(`Warning: failed to parse ${file} — ${e.message}`);
      continue;
    }

    const title      = r.pageTitle || '';
    const meta       = r.metaDesc  || '';
    const winner     = r.quickAnswer?.winner || '';
    const reason     = r.quickAnswer?.oneLineReason || '';
    const titleLen   = title.length;
    const metaLen    = meta.length;

    // Flag issues
    const flags = [];
    if (titleLen > TITLE_LIMIT)  flags.push(`TITLE_TOO_LONG(${titleLen})`);
    else if (titleLen > TITLE_TARGET) flags.push(`TITLE_LONG(${titleLen})`);
    if (metaLen > META_LIMIT)    flags.push(`META_TOO_LONG(${metaLen})`);
    if (isGeneric(reason))       flags.push('GENERIC_REASON');
    if (!title)                  flags.push('NO_TITLE');
    if (!reason)                 flags.push('NO_REASON');

    const flagStr = flags.join(' | ');
    const hasIssue = flags.length > 0;
    if (hasIssue) issueCount++;

    if (ISSUES_ONLY && !hasIssue) continue;

    rows.push([slug, title, meta, winner, reason, titleLen, metaLen, flagStr]);
  }

  // Write CSV
  const header = ['slug', 'pageTitle', 'metaDesc', 'winner', 'oneLineReason', 'titleChars', 'metaChars', 'flags'];
  const csv = [
    header.map(csvEscape).join(','),
    ...rows.map(row => row.map(csvEscape).join(','))
  ].join('\n');

  // Ensure output directory exists
  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUT_PATH, csv, 'utf8');

  console.log(`✓ Exported ${rows.length} rows to ${OUT_PATH}`);
  console.log(`  Total pages:   ${files.length}`);
  console.log(`  Issues:        ${issueCount}`);
  if (ISSUES_ONLY) console.log(`  (issues-only mode — ${files.length - rows.length} clean pages omitted)`);
  console.log(`\nEdit in Excel or Google Sheets, then run:`);
  console.log(`  node scripts\\import-titles.js --in data/titles-export.csv`);
}

run();
