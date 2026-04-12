#!/usr/bin/env node

/**
 * log-all-titles.js
 * BooksVersusMovies.com — titles sanity check
 *
 * Reads all JSON files in pipeline/2-revised/ and outputs a clean list of
 * slug: pageTitle for quick review. Flags titles over 65 chars.
 *
 * Usage:
 *   node log-all-titles.js
 *   node log-all-titles.js --out ../logs/titles-check.txt
 *   node log-all-titles.js --warn-only   (show only flagged titles)
 *
 * Options:
 *   --dir       Source directory (default: ../pipeline/2-revised)
 *   --out       Write output to file in addition to stdout
 *   --warn-only Show only titles over 65 chars
 */

const fs   = require('fs');
const path = require('path');

const args     = process.argv.slice(2);
const get      = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag  = flag => args.includes(flag);

const SRC_DIR   = path.resolve(__dirname, get('--dir', '../pipeline/2-revised'));
const OUT_FILE  = get('--out', null);
const WARN_ONLY = hasFlag('--warn-only');

const TARGET    = 65;
const HARD_MAX  = 75;

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error(`✗ No JSON files found in ${SRC_DIR}`);
    process.exit(1);
  }

  const lines   = [];
  const flagged = [];
  const out     = s => lines.push(s);

  out(`BooksVersusMovies.com — Titles Sanity Check`);
  out(`===========================================`);
  out(`Generated: ${new Date().toISOString().split('T')[0]}`);
  out(`Source:    ${SRC_DIR}`);
  out(`Pages:     ${files.length}`);
  out(`Target:    ${TARGET} chars  |  Hard max: ${HARD_MAX} chars`);
  out(``)

  for (const file of files) {
    const slug = file.replace('.json', '');
    let record;

    try {
      record = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    } catch (e) {
      out(`  ✗  ${slug}: failed to parse JSON`);
      continue;
    }

    const title  = record.pageTitle || '(missing)';
    const len    = title.length;
    const over   = len > HARD_MAX ? '✗ OVER LIMIT' : len > TARGET ? '⚠ slightly long' : '';
    const flag   = over ? `  ${over} (${len})` : `  (${len})`;

    if (WARN_ONLY && !over) continue;

    out(`${slug}: ${title}${flag}`);

    if (over) flagged.push({ slug, title, len, over });
  }

  out(``);
  out(`===========================================`);
  out(`Total:       ${files.length}`);
  out(`Over target: ${flagged.filter(f => f.len > TARGET).length}  (>${TARGET} chars)`);
  out(`Over limit:  ${flagged.filter(f => f.len > HARD_MAX).length}  (>${HARD_MAX} chars)`);

  if (flagged.length > 0) {
    out(``);
    out(`── Flagged titles ───────────────────────────`);
    for (const f of flagged) {
      out(`  ${f.over} — ${f.slug} (${f.len} chars)`);
      out(`    ${f.title}`);
    }
  }

  const output = lines.join('\n');
  console.log(output);

  if (OUT_FILE) {
    const outPath = path.resolve(__dirname, OUT_FILE);
    fs.writeFileSync(outPath, output, 'utf8');
    console.error(`\n✓ Written to ${outPath}`);
  }
}

run();
