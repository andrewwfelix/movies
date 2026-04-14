#!/usr/bin/env node

/**
 * import-titles.js
 * BooksVersusMovies.com — import revised titles from CSV back into JSON
 *
 * Reads a CSV produced by export-titles.js (or edited version thereof)
 * and updates pageTitle, metaDesc, and quickAnswer.oneLineReason in
 * pipeline/2-revised/ JSON files.
 *
 * Usage:
 *   node import-titles.js --in data/titles-export.csv
 *   node import-titles.js --in data/titles-export.csv --dry
 *   node import-titles.js --in data/titles-export.csv --field title
 *
 * Options:
 *   --in      Input CSV file (required)
 *   --dry     Preview changes without writing
 *   --field   Import only specific field: title | meta | reason | all (default: all)
 *
 * CSV format (from export-titles.js):
 *   slug, pageTitle, metaDesc, winner, oneLineReason, titleChars, metaChars, flags
 *
 * Only rows where pageTitle or oneLineReason differ from current JSON
 * will be written — unchanged rows are skipped automatically.
 * Destination: scripts/content/import-titles.js
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const IN_PATH  = get('--in', null);
const SRC_DIR  = path.resolve(__dirname, '../pipeline/2-revised');
const DRY_RUN  = hasFlag('--dry');
const FIELD    = get('--field', 'all');

const TITLE_LIMIT = 75;
const META_LIMIT  = 155;

// ── Simple CSV parser ─────────────────────────────────────────────────────────
// Handles quoted fields with embedded commas and escaped quotes

function parseCSV(text) {
  const lines  = text.split('\n').filter(l => l.trim());
  const header = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    header.forEach((key, i) => { obj[key.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function run() {
  if (!IN_PATH) {
    console.error('✗ --in flag required. Usage: node import-titles.js --in data/titles-export.csv');
    process.exit(1);
  }

  const inPath = path.resolve(__dirname, '../', IN_PATH);
  if (!fs.existsSync(inPath)) {
    console.error(`✗ Input file not found: ${inPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(inPath, 'utf8');
  const rows    = parseCSV(csvText);

  console.log(`\nimport-titles.js`);
  console.log(`Input:   ${inPath}`);
  console.log(`Rows:    ${rows.length}`);
  console.log(`Field:   ${FIELD}`);
  console.log(`Dry run: ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`\n${'─'.repeat(60)}`);

  let updated  = 0;
  let skipped  = 0;
  let failed   = 0;
  let unchanged = 0;

  for (const row of rows) {
    const slug    = row.slug;
    if (!slug) continue;

    const filePath = path.join(SRC_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  –  ${slug}: file not found in 2-revised/ — skipping`);
      skipped++;
      continue;
    }

    let record;
    try {
      record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`  ✗  ${slug}: failed to parse JSON — ${e.message}`);
      failed++;
      continue;
    }

    const changes = [];

    // pageTitle
    if ((FIELD === 'all' || FIELD === 'title') && row.pageTitle) {
      if (row.pageTitle.length > TITLE_LIMIT) {
        console.log(`  ⚠  ${slug}: pageTitle too long (${row.pageTitle.length} chars) — skipping title update`);
      } else if (row.pageTitle !== record.pageTitle) {
        changes.push(`title: "${record.pageTitle}" → "${row.pageTitle}"`);
        if (!DRY_RUN) record.pageTitle = row.pageTitle;
      }
    }

    // metaDesc
    if ((FIELD === 'all' || FIELD === 'meta') && row.metaDesc) {
      if (row.metaDesc.length > META_LIMIT) {
        console.log(`  ⚠  ${slug}: metaDesc too long (${row.metaDesc.length} chars) — skipping meta update`);
      } else if (row.metaDesc !== record.metaDesc) {
        changes.push(`meta updated (${row.metaDesc.length} chars)`);
        if (!DRY_RUN) record.metaDesc = row.metaDesc;
      }
    }

    // oneLineReason
    if ((FIELD === 'all' || FIELD === 'reason') && row.oneLineReason) {
      if (row.oneLineReason !== record.quickAnswer?.oneLineReason) {
        changes.push(`reason: "${record.quickAnswer?.oneLineReason}" → "${row.oneLineReason}"`);
        if (!DRY_RUN && record.quickAnswer) {
          record.quickAnswer.oneLineReason = row.oneLineReason;
        }
      }
    }

    if (changes.length === 0) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ↻  ${slug}:`);
      changes.forEach(c => console.log(`       ${c}`));
    } else {
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
      console.log(`  ✓  ${slug}: ${changes.length} field(s) updated`);
      changes.forEach(c => console.log(`       ${c}`));
    }
    updated++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);
  if (DRY_RUN && updated > 0) {
    console.log(`\n  Dry run — no files written. Run without --dry to apply.`);
  } else if (updated > 0) {
    console.log(`\n  ✓ ${updated} file(s) updated in pipeline/2-revised/`);
    console.log(`  Run node scripts\\pipeline-render.js --all --force to re-render.`);
  }
}

run();
