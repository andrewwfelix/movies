#!/usr/bin/env node

/**
 * fix-cta-titles.js
 * BooksVersusMovies.com — fix over-long after-verdict CTA text
 *
 * Reads all JSON files in pipeline/2-revised/, checks the after-verdict
 * ctaBlock text, and replaces "Start with [long title] →" with
 * "Start with the book →" when bookTitle exceeds MAX_TITLE_LENGTH chars.
 *
 * No API calls — pure deterministic fix.
 *
 * Usage:
 *   node fix-cta-titles.js
 *   node fix-cta-titles.js --dry    (preview changes without writing)
 *   node fix-cta-titles.js --max 20 (override max title length, default 20)
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SRC_DIR         = path.resolve(__dirname, '../pipeline/2-revised');
const DRY_RUN         = hasFlag('--dry');
const MAX_TITLE_LEN   = parseInt(get('--max', '20'), 10);
const FALLBACK_TEXT   = 'Start with the book →';

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`\nfix-cta-titles.js`);
  console.log(`Max title length: ${MAX_TITLE_LEN} chars`);
  console.log(`Dry run: ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`Files: ${files.length}\n`);

  let fixed   = 0;
  let skipped = 0;
  let clean   = 0;

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    let record;

    try {
      record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`  ✗  ${file}: failed to parse — ${e.message}`);
      continue;
    }

    if (!record.ctaBlocks || !Array.isArray(record.ctaBlocks)) {
      console.log(`  –  ${file}: no ctaBlocks — skipping`);
      skipped++;
      continue;
    }

    const afterVerdict = record.ctaBlocks.find(b => b.location === 'after-verdict');
    if (!afterVerdict) {
      skipped++;
      continue;
    }

    const bookTitle       = record.bookTitle || '';
    const currentText     = afterVerdict.text;
    const expectedSpecific = `Start with ${bookTitle} →`;
    const isSpecific      = currentText === expectedSpecific;
    const titleTooLong    = bookTitle.length > MAX_TITLE_LEN;

    // Valid non-specific texts — Too Close to Call and Movie Wins verdicts
    const validFallbacks  = new Set([
      'Start with the book →',
      'Get the book →',
      'Read the source material →',
    ]);

    if (isSpecific && titleTooLong) {
      // Needs fixing — title too long for button
      console.log(`  ⚠  ${file}`);
      console.log(`       bookTitle: "${bookTitle}" (${bookTitle.length} chars — over limit)`);
      console.log(`       BEFORE: "${currentText}"`);
      console.log(`       AFTER:  "${FALLBACK_TEXT}"`);

      if (!DRY_RUN) {
        afterVerdict.text = FALLBACK_TEXT;
        fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
      }
      fixed++;
    } else if (isSpecific && !titleTooLong) {
      // Short title — specific text is correct
      clean++;
    } else if (validFallbacks.has(currentText)) {
      // Valid fallback text — correct for verdict type
      clean++;
    } else {
      // Genuinely unexpected — log but don't touch
      console.log(`  ?  ${file}: unexpected CTA text: "${currentText}"`);
      skipped++;
    }
  }

  console.log(`\n── Summary ───────────────────────────────────────`);
  console.log(`  Fixed:   ${fixed}`);
  console.log(`  Clean:   ${clean}`);
  console.log(`  Skipped: ${skipped}`);
  if (DRY_RUN && fixed > 0) {
    console.log(`\n  Dry run — no files written. Run without --dry to apply.`);
  } else if (fixed > 0) {
    console.log(`\n  ✓ ${fixed} file${fixed !== 1 ? 's' : ''} updated`);
  } else {
    console.log(`\n  ✓ Nothing to fix`);
  }
}

run();
