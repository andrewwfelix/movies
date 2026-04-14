#!/usr/bin/env node

/**
 * quality-gate.js
 * BooksVersusMovies.com — pipeline output quality gate
 *
 * Reads JSON files from pipeline/2-revised/ and evaluates output quality
 * against a set of hard rules and soft warnings. Can be run standalone
 * as a QA check or called programmatically from pipeline-revise.js.
 *
 * Usage:
 *   node quality-gate.js                        (check all files)
 *   node quality-gate.js --slug atonement       (check single file)
 *   node quality-gate.js --last 5               (check last N processed)
 *   node quality-gate.js --fail-fast            (exit 1 on first failure)
 *   node quality-gate.js --warn-only            (show warnings only)
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more hard failures
 *   2 — warnings only (if --strict flag set)
 *
 * Called from pipeline-revise.js when --quality-check-interval N is set.
 * Hard-stops the batch if any check fails.
 * Destination: scripts/utils/quality-gate.js
 */

const fs   = require('fs');
const path = require('path');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const get      = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag  = flag => args.includes(flag);

const SINGLE_SLUG = get('--slug', null);
const LAST_N      = parseInt(get('--last', '0'), 10);
const FAIL_FAST   = hasFlag('--fail-fast');
const WARN_ONLY   = hasFlag('--warn-only');
const STRICT      = hasFlag('--strict');
const SRC_DIR     = path.resolve(__dirname, '../pipeline/2-revised');
const EXTRACT_DIR = path.resolve(__dirname, '../pipeline/1-extracted');

// ── Generic oneLineReason detector ────────────────────────────────────────────
// These phrases signal the model is hedging rather than making a specific claim

const GENERIC_PHRASES = [
  'both versions',
  'both have',
  'each version',
  'has its strengths',
  'offers more depth',
  'depending on',
  'both are',
  'unique in its own',
  'something for everyone',
  'hard to choose',
  'different but equal',
];

function isGenericReason(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(p => lower.includes(p));
}

// ── Valid values ──────────────────────────────────────────────────────────────

const VALID_WINNERS    = new Set(['Book', 'Film', 'Series', 'Too Close to Call']);
const VALID_READ_FIRST = new Set(['Yes', 'No', 'Either order works']);
const VALID_LOCATIONS  = new Set(['after-quick-answer', 'after-read-first', 'after-verdict']);
const VALID_CTA_TEXTS  = new Set([
  'Read the book first →',
  'Get the book on Amazon →',
  'Get the book →',
  'Read the source material →',
]);

// Title length target
const TITLE_TARGET  = 65;
const TITLE_LIMIT   = 75;
const META_LIMIT    = 155;
const REASON_WORDS  = 15;

// ── Check a single record ─────────────────────────────────────────────────────

function checkRecord(record, original) {
  const failures  = [];
  const warnings  = [];

  // ── Pass 1 checks ───────────────────────────────────────────────────────────

  // quickAnswer presence
  if (!record.quickAnswer) {
    failures.push('quickAnswer is null — Pass 1 may not have run');
  } else {
    const qa = record.quickAnswer;

    // winner
    if (!VALID_WINNERS.has(qa.winner)) {
      failures.push(`quickAnswer.winner invalid: "${qa.winner}"`);
    }

    // readFirst
    if (!VALID_READ_FIRST.has(qa.readFirst)) {
      failures.push(`quickAnswer.readFirst invalid: "${qa.readFirst}"`);
    }

    // oneLineReason — hard checks
    if (!qa.oneLineReason) {
      failures.push('quickAnswer.oneLineReason missing');
    } else {
      const wordCount = qa.oneLineReason.split(' ').length;
      if (wordCount > REASON_WORDS) {
        warnings.push(`oneLineReason too long: ${wordCount} words — "${qa.oneLineReason}"`);
      }
      if (isGenericReason(qa.oneLineReason)) {
        failures.push(`oneLineReason is generic — model is hedging: "${qa.oneLineReason}"`);
      }
    }

    // Logical consistency checks
    if (qa.winner === 'Too Close to Call' && qa.readFirst === 'Yes') {
      warnings.push(`Possible inconsistency: winner is "Too Close to Call" but readFirst is "Yes" — verify this is intentional`);
    }
  }

  // ── Titles checks ───────────────────────────────────────────────────────────

  if (!record.pageTitle) {
    failures.push('pageTitle missing');
  } else {
    if (record.pageTitle.length > TITLE_LIMIT) {
      failures.push(`pageTitle over hard limit: ${record.pageTitle.length} chars — "${record.pageTitle}"`);
    } else if (record.pageTitle.length > TITLE_TARGET) {
      warnings.push(`pageTitle slightly long: ${record.pageTitle.length} chars (target ${TITLE_TARGET})`);
    }
    // Generic title pattern check
    if (record.pageTitle.includes('Key Differences & Should You Read First?')) {
      failures.push(`pageTitle is generic pattern — titles pass may not have run`);
    }
  }

  if (!record.metaDesc) {
    warnings.push('metaDesc missing');
  } else if (record.metaDesc.length > META_LIMIT) {
    failures.push(`metaDesc too long: ${record.metaDesc.length} chars (max ${META_LIMIT})`);
  } else if (record.metaDesc.length < 50) {
    warnings.push(`metaDesc suspiciously short: ${record.metaDesc.length} chars — may not have been updated`);
  }

  // ── Pass 2 checks ───────────────────────────────────────────────────────────

  if (!record.ctaBlocks || record.ctaBlocks.length === 0) {
    failures.push('ctaBlocks missing — Pass 2 may not have run');
  } else {
    if (record.ctaBlocks.length !== 3) {
      failures.push(`ctaBlocks has ${record.ctaBlocks.length} items — expected 3`);
    }

    const locations = record.ctaBlocks.map(b => b.location);
    for (const loc of VALID_LOCATIONS) {
      if (!locations.includes(loc)) {
        failures.push(`ctaBlocks missing location: "${loc}"`);
      }
    }

    for (const cta of record.ctaBlocks) {
      if (!cta.href) {
        failures.push(`ctaBlock missing href (location: ${cta.location})`);
      } else if (cta.href !== record.affiliateLink) {
        warnings.push(`ctaBlock href doesn't match affiliateLink (location: ${cta.location})`);
      }
      if (!cta.text) {
        failures.push(`ctaBlock missing text (location: ${cta.location})`);
      } else if (!VALID_CTA_TEXTS.has(cta.text) && !cta.text.startsWith('Start with ')) {
        warnings.push(`ctaBlock unexpected text: "${cta.text}" (location: ${cta.location})`);
      }
    }
  }

  // ── Immutable field checks ───────────────────────────────────────────────────

  if (original) {
    const immutable = [
      'slug', 'bookTitle', 'author', 'bookYear', 'filmYear',
      'affiliateLink', 'youtubeId', 'verdictText', 'verdictClass',
      'storyBrief', 'verdictBox',
    ];
    for (const field of immutable) {
      if (original[field] !== record[field]) {
        failures.push(`immutable field changed: ${field}`);
      }
    }
  }

  return { failures, warnings };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  let files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (SINGLE_SLUG) {
    files = [`${SINGLE_SLUG}.json`];
  } else if (LAST_N > 0) {
    files = files.slice(-LAST_N);
  }

  console.log(`\nquality-gate.js`);
  console.log(`Source:    ${SRC_DIR}`);
  console.log(`Files:     ${files.length}`);
  console.log(`Fail fast: ${FAIL_FAST ? 'yes' : 'no'}`);
  console.log(`\n${'─'.repeat(50)}`);

  let totalFailures = 0;
  let totalWarnings = 0;
  let clean         = 0;
  const failedSlugs = [];

  for (const file of files) {
    const slug     = file.replace('.json', '');
    const filePath = path.join(SRC_DIR, file);
    const origPath = path.join(EXTRACT_DIR, file);

    let record, original;
    try {
      record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`  ✗  ${slug}: failed to parse JSON — ${e.message}`);
      totalFailures++;
      if (FAIL_FAST) process.exit(1);
      continue;
    }

    try {
      original = fs.existsSync(origPath)
        ? JSON.parse(fs.readFileSync(origPath, 'utf8'))
        : null;
    } catch { original = null; }

    const { failures, warnings } = checkRecord(record, original);

    if (failures.length > 0) {
      console.log(`\n  ✗  ${slug}`);
      for (const f of failures) console.log(`       FAIL: ${f}`);
      for (const w of warnings) console.log(`       WARN: ${w}`);
      totalFailures += failures.length;
      failedSlugs.push(slug);
      if (FAIL_FAST) {
        console.log(`\n  Hard stop — fix issues in ${slug} before continuing.`);
        process.exit(1);
      }
    } else if (warnings.length > 0) {
      if (!WARN_ONLY) {
        console.log(`  ⚠  ${slug}`);
        for (const w of warnings) console.log(`       WARN: ${w}`);
      } else {
        console.log(`  ⚠  ${slug}: ${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}`);
      }
      totalWarnings += warnings.length;
    } else {
      if (!WARN_ONLY) console.log(`  ✓  ${slug}`);
      clean++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Total:    ${files.length}`);
  console.log(`Clean:    ${clean}`);
  console.log(`Warnings: ${totalWarnings}`);
  console.log(`Failures: ${totalFailures}`);

  if (failedSlugs.length > 0) {
    console.log(`\nFailed pages:`);
    for (const s of failedSlugs) console.log(`  ${s}`);
    console.log(`\nQUALITY GATE FAILED`);
    process.exit(1);
  } else if (totalWarnings > 0 && STRICT) {
    console.log(`\nQUALITY GATE FAILED (warnings in strict mode)`);
    process.exit(2);
  } else {
    console.log(`\nQUALITY GATE PASSED`);
    process.exit(0);
  }
}

// Only auto-run when called directly — not when required as a module
if (require.main === module) {
  run();
}

// ── Exported function for use in pipeline-revise.js ──────────────────────────

module.exports = { checkRecord };
