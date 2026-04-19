#!/usr/bin/env node

/**
 * scripts/utils/seo-llm-import.js
 * BooksVersusMovies.com — Apply accepted SEO changes to source JSONs
 *
 * Step 3 of 3. Reads seo-review-latest.json, finds pages with accepted
 * values that haven't been applied yet, updates pageTitle and metaDesc
 * in pipeline/2-revised/*.json, and marks them as applied in the review.
 *
 * Usage:
 *   node scripts/utils/seo-llm-import.js          -- apply all accepted
 *   node scripts/utils/seo-llm-import.js --slug X  -- one page
 *   node scripts/utils/seo-llm-import.js --dry     -- preview only
 *
 * After running:
 *   node scripts/pipeline-render.js --all --force
 *
 * Destination: scripts/utils/seo-llm-import.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag = f => args.includes(f);

const SLUG_FILTER = get('--slug', null);
const DRY_RUN     = hasFlag('--dry');

const ROOT        = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-review.json');
const REPORTS_DIR = path.join(ROOT, 'data', 'reports');
const LATEST_PATH = path.join(REPORTS_DIR, 'seo-review-latest.json');

if (!fs.existsSync(CONFIG_PATH)) { console.error('✗ config/seo-review.json not found'); process.exit(1); }
if (!fs.existsSync(LATEST_PATH)) { console.error('✗ seo-review-latest.json not found — run seo-llm-review.js first'); process.exit(1); }

const CONFIG  = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const SRC_DIR = path.join(ROOT, CONFIG.paths.sourceDir);
const today   = new Date().toISOString().split('T')[0];

async function run() {
  const review = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));

  let pages = review.pages.filter(p => p.accepted && !p.accepted.applied);

  if (SLUG_FILTER) {
    pages = pages.filter(p => p.slug === SLUG_FILTER);
    if (!pages.length) {
      console.error(`✗ No pending accepted changes for: ${SLUG_FILTER}`);
      process.exit(1);
    }
  }

  console.log(`\nseo-llm-import.js`);
  console.log(`Review:   ${review.runId}`);
  console.log(`Pending:  ${pages.length} pages with accepted changes`);
  console.log(`Dry run:  ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(56)}`);

  if (pages.length === 0) {
    console.log(`Nothing to import. Run seo-llm-apply.js first.\n`);
    return;
  }

  let applied = 0;
  let failed  = 0;
  const changes = [];

  for (const page of pages) {
    const jsonPath = path.join(SRC_DIR, `${page.slug}.json`);

    if (!fs.existsSync(jsonPath)) {
      console.log(`  ✗ ${page.slug} — JSON not found at ${jsonPath}`);
      failed++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.log(`  ✗ ${page.slug} — JSON parse error: ${e.message}`);
      failed++;
      continue;
    }

    const oldTitle = data.pageTitle;
    const oldMeta  = data.metaDesc;
    const newTitle = page.accepted.title;
    const newMeta  = page.accepted.meta;

    if (DRY_RUN) {
      console.log(`  [DRY] ${page.slug}`);
      console.log(`    Title: "${oldTitle}"`);
      console.log(`       → "${newTitle}"`);
      console.log(`    Meta:  "${oldMeta}"`);
      console.log(`       → "${newMeta}"`);
      continue;
    }

    data.pageTitle    = newTitle;
    data.metaDesc     = newMeta;
    data.lastUpdated  = today;

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

    // Mark as applied in review
    page.accepted.applied     = true;
    page.accepted.appliedDate = today;

    changes.push({ slug: page.slug, oldTitle, newTitle, oldMeta, newMeta });

    console.log(`  ✓ ${page.slug.padEnd(40)} title:${newTitle.length}c meta:${newMeta.length}c`);
    applied++;
  }

  if (!DRY_RUN && applied > 0) {
    // Save updated review JSON
    fs.writeFileSync(LATEST_PATH, JSON.stringify(review, null, 2), 'utf8');
    const datedPath = path.join(REPORTS_DIR, `seo-review-${review.runDate}.json`);
    if (fs.existsSync(datedPath)) {
      fs.writeFileSync(datedPath, JSON.stringify(review, null, 2), 'utf8');
    }

    // Write change log
    const logPath = path.join(REPORTS_DIR, `seo-import-${today}.json`);
    fs.writeFileSync(logPath, JSON.stringify({ date: today, changes }, null, 2), 'utf8');
  }

  console.log(`\n${'─'.repeat(56)}`);
  if (DRY_RUN) {
    console.log(`[DRY] ${pages.length} changes previewed. Run without --dry to apply.\n`);
  } else {
    console.log(`✓ Applied: ${applied} pages`);
    if (failed) console.log(`✗ Failed:  ${failed} pages`);
    console.log(`✓ Change log: data/reports/seo-import-${today}.json`);
    console.log(`\nNext: node scripts/pipeline-render.js --all --force\n`);
  }
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
