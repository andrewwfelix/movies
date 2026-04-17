#!/usr/bin/env node

/**
 * scripts/import-titles.js
 * Imports revised titles, meta descriptions, and oneLineReason from CSV into JSON files.
 *
 * Usage:
 *   node scripts/import-titles.js --csv data/reports/sonnet-titles-encoding-fixed.csv
 *   node scripts/import-titles.js --csv data/reports/sonnet-titles-encoding-fixed.csv --dry
 *
 * Accepted CSV columns (flexible — accepts both export and Sonnet-reviewed formats):
 *   slug
 *   pageTitle  OR  suggestedTitle
 *   metaDesc   OR  suggestedMeta
 *   oneLineReason  (optional — updates quickAnswer.oneLineReason if present)
 *
 * Destination: scripts/import-titles.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ── Args ──────────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : null; };

const CSV_PATH = getArg('--csv');
const DRY_RUN  = args.includes('--dry');

if (!CSV_PATH) {
  console.error('Usage: node scripts/import-titles.js --csv <path-to-csv>');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '../..');
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`✗ CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  // Strip BOM if present (common with Excel-saved CSVs)
  let csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  if (csvContent.charCodeAt(0) === 0xFEFF) csvContent = csvContent.slice(1);

  const records = parse(csvContent, {
    columns:           true,
    skip_empty_lines:  true,
    trim:              true,
  });

  console.log(`\nimport-titles.js`);
  console.log(`Source:  ${CSV_PATH}`);
  console.log(`Rows:    ${records.length}`);
  console.log(`Dry run: ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(60)}`);

  let updated = 0;
  let skipped = 0;
  let noChange = 0;

  for (const row of records) {
    const slug    = row.slug?.trim();
    // Accept either column name format
    const newTitle  = (row.suggestedTitle  || row.pageTitle)?.trim();
    const newMeta   = (row.suggestedMeta   || row.metaDesc)?.trim();
    const newReason = row.oneLineReason?.trim();

    if (!slug || !newTitle || !newMeta) {
      console.log(`  ⚠  Skipping (missing data): ${slug || 'unknown'}`);
      skipped++;
      continue;
    }

    const jsonPath = path.join(REVIEWS_DIR, `${slug}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.log(`  ⚠  JSON not found: ${slug}`);
      skipped++;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      const oldTitle  = data.pageTitle;
      const oldMeta   = data.metaDesc;
      const oldReason = data.quickAnswer?.oneLineReason;

      const titleChanged  = oldTitle  !== newTitle;
      const metaChanged   = oldMeta   !== newMeta;
      const reasonChanged = newReason && oldReason !== newReason;

      if (!titleChanged && !metaChanged && !reasonChanged) {
        noChange++;
        continue;
      }

      data.pageTitle = newTitle;
      data.metaDesc  = newMeta;

      if (newReason && data.quickAnswer) {
        data.quickAnswer.oneLineReason = newReason;
      }

      if (!DRY_RUN) {
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      }

      console.log(`  ✓  ${slug}`);
      if (titleChanged)  console.log(`       title:  "${oldTitle}" → "${newTitle}"`);
      if (metaChanged)   console.log(`       meta:   "${oldMeta?.substring(0, 60)}..." → "${newMeta?.substring(0, 60)}..."`);
      if (reasonChanged) console.log(`       reason: "${oldReason}" → "${newReason}"`);

      updated++;
    } catch (err) {
      console.error(`  ✗  Failed: ${slug} — ${err.message}`);
      skipped++;
    }
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  No change: ${noChange}`);
  console.log(`  Skipped:   ${skipped}`);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] No files modified. Re-run without --dry to apply.`);
  } else {
    console.log(`\nNext step: node scripts/pipeline-render.js --all --force`);
  }
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
