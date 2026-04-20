#!/usr/bin/env node

/**
 * scripts/utils/schema-migrate.js
 * BooksVersusMovies.com — Migrate pipeline/2-revised JSONs to schema v3.1
 *
 * Adds all new v3.1 fields with null/empty values to existing JSONs.
 * Does NOT overwrite existing values. Safe to run multiple times.
 * After running, seo-llm-fullpage.js fills in the null fields.
 *
 * Usage:
 *   node scripts/utils/schema-migrate.js          -- migrate all
 *   node scripts/utils/schema-migrate.js --dry    -- preview only
 *   node scripts/utils/schema-migrate.js --slug X -- one page
 *
 * Destination: scripts/utils/schema-migrate.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args      = process.argv.slice(2);
const get       = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag   = f => args.includes(f);

const SLUG_FILTER = get('--slug', null);
const DRY_RUN     = hasFlag('--dry');

const ROOT    = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'pipeline', '2-revised');
const OUT_DIR = path.join(ROOT, 'pipeline', '2-revised-v31');

// New v3.1 fields with defaults
function getNewFields(slug) {
  return {
    // SEO targeting
    primaryKeyword:      null,
    secondaryKeywords:   [],
    targetQueries:       [],

    // Content extraction
    winnerStatement:     null,
    hook:                null,
    entities:            [],
    snippetParagraph:    null,
    atAGlanceTable:      null,
    keyDifferencesList:  null,
    optimizedH2s:        null,

    // Social
    og:                  null,
    twitter: {
      card: 'summary_large_image',
      site: '@booksversusmovies',
    },
    images:              null,

    // Technical
    canonicalUrl: `https://booksversusmovies.com/${slug}`,

    // Renderer flags
    hasAtAGlanceTable:      false,
    hasSnippetParagraph:    false,
    hasKeyDifferencesList:  false,
    hasOpenGraph:           false,
    hasOptimizedH2s:        false,

    // Version
    _schemaVersion: '3.1',
  };
}

async function run() {
  let files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();

  if (SLUG_FILTER) {
    files = files.filter(f => f.replace('.json','') === SLUG_FILTER);
    if (!files.length) { console.error(`✗ No JSON for: ${SLUG_FILTER}`); process.exit(1); }
  }

  console.log(`\nschema-migrate.js`);
  console.log(`Input:    pipeline/2-revised/`);
  console.log(`Output:   pipeline/2-revised-v31/`);
  console.log(`Files:    ${files.length}`);
  console.log(`Dry run:  ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(56)}`);

  let migrated = 0;
  let alreadyCurrent = 0;

  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    const outPath = path.join(OUT_DIR, file);
    const page = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    const slug = page.slug || file.replace('.json','');

    if (page._schemaVersion === '3.1') {
      process.stdout.write(`  ${slug}: already v3.1 — skip\n`);
      alreadyCurrent++;
      continue;
    }

    const newFields = getNewFields(slug);
    let fieldsAdded = 0;

    // Only add fields that don't already exist — never overwrite
    for (const [key, defaultVal] of Object.entries(newFields)) {
      if (!(key in page)) {
        page[key] = defaultVal;
        fieldsAdded++;
      }
    }

    // Ensure differences[] have question field
    if (Array.isArray(page.differences)) {
      page.differences = page.differences.map(d => ({
        question: null,
        ...d,
      }));
    }

    if (DRY_RUN) {
      console.log(`  ${slug}: would add ${fieldsAdded} fields → pipeline/2-revised-v31/`);
    } else {
      if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(page, null, 2), 'utf8');
      console.log(`  ${slug}: +${fieldsAdded} fields → pipeline/2-revised-v31/`);
    }
    migrated++;
  }

  console.log(`\n${'─'.repeat(56)}`);
  if (DRY_RUN) {
    console.log(`[DRY] Would migrate: ${migrated} pages`);
    console.log(`      Already v3.1:  ${alreadyCurrent} pages`);
    console.log(`\nRun without --dry to apply.\n`);
  } else {
    console.log(`✓ Migrated:     ${migrated} pages`);
    console.log(`→ Already v3.1: ${alreadyCurrent} pages`);
    console.log(`\nNext: node scripts/utils/seo-llm-fullpage.js\n  (reads pipeline/2-revised-v31/)\n`);
  }
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
