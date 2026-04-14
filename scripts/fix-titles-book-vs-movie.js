#!/usr/bin/env node

/**
 * fix-titles-book-vs-movie.js
 * BooksVersusMovies.com — one-time title tag fix
 *
 * Ensures every pageTitle contains "Book vs Movie" (or "Book vs Series").
 * Transforms existing titles from:
 *   "Atonement: Read It First or Briony's Confession Means Nothing"
 * To:
 *   "Atonement Book vs Movie: Read It First or Briony's Confession Means Nothing"
 *
 * Rules:
 *   - If pageTitle already contains "book vs movie" or "book vs series" — skip
 *   - If pageTitle starts with bookTitle — insert "Book vs Movie" after it
 *   - Keeps existing hook intact
 *   - Trims to 65 chars max if result is too long (truncates hook, not the phrase)
 *   - Updates both pipeline/2-revised/*.json and data/reviews/*.json
 *
 * Usage:
 *   node scripts/fix-titles-book-vs-movie.js          (dry run preview)
 *   node scripts/fix-titles-book-vs-movie.js --write  (apply changes)
 *   node scripts/fix-titles-book-vs-movie.js --slug atonement --write
 *
 * After running with --write:
 *   node scripts/pipeline-render.js --all --force
 *
 * Destination: scripts/fix-titles-book-vs-movie.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const WRITE    = hasFlag('--write');
const SLUG_ARG = get('--slug', null);

const ROOT        = path.resolve(__dirname, '..');
const REVISED_DIR = path.join(ROOT, 'pipeline', '2-revised');
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');
const MAX_TITLE   = 65;

// ── Build the corrected title ─────────────────────────────────────────────────

function fixTitle(pageTitle, bookTitle, mediaType) {
  if (!pageTitle || !bookTitle) return null;

  const lower = pageTitle.toLowerCase();

  // Already has the phrase — skip
  if (lower.includes('book vs movie') || lower.includes('book vs series') ||
      lower.includes('book vs miniseries') || lower.includes('book vs film')) {
    return null;
  }

  const phrase = mediaType === 'series' ? 'Book vs Series' : 'Book vs Movie';

  // "Atonement: Hook" → "Atonement Book vs Movie: Hook"
  // "The Shining: Hook" → "The Shining Book vs Movie: Hook"
  const colonIdx = pageTitle.indexOf(': ');
  let newTitle;

  if (colonIdx > -1) {
    const prefix = pageTitle.slice(0, colonIdx);   // "Atonement"
    const hook   = pageTitle.slice(colonIdx + 2);  // "Read It First..."

    // Check prefix roughly matches bookTitle (case-insensitive, allow minor diff)
    const prefixClean = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bookClean   = bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (prefixClean === bookClean || bookClean.startsWith(prefixClean) || prefixClean.startsWith(bookClean)) {
      newTitle = `${prefix} ${phrase}: ${hook}`;
    } else {
      // Title doesn't start with book name — prepend cleanly
      newTitle = `${bookTitle} ${phrase}: ${pageTitle}`;
    }
  } else {
    // No colon — just prepend
    newTitle = `${bookTitle} ${phrase}: ${pageTitle}`;
  }

  // Trim if over MAX_TITLE — truncate hook, not the phrase
  if (newTitle.length > MAX_TITLE) {
    const phraseEnd = newTitle.indexOf(': ') + 2;
    const base      = newTitle.slice(0, phraseEnd);  // "Title Book vs Movie: "
    const hook      = newTitle.slice(phraseEnd);
    const remaining = MAX_TITLE - base.length - 1;   // -1 for ellipsis
    newTitle = remaining > 10
      ? `${base}${hook.slice(0, remaining)}…`
      : base.trimEnd();
  }

  return newTitle;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(REVISED_DIR)) {
    console.error(`✗ pipeline/2-revised/ not found`);
    process.exit(1);
  }

  let files = fs.readdirSync(REVISED_DIR).filter(f => f.endsWith('.json')).sort();

  if (SLUG_ARG) {
    files = files.filter(f => f.replace('.json', '') === SLUG_ARG);
    if (files.length === 0) {
      console.error(`✗ No file found for slug: ${SLUG_ARG}`);
      process.exit(1);
    }
  }

  console.log(`\nfix-titles-book-vs-movie.js`);
  console.log(`Mode:   ${WRITE ? 'WRITE' : 'DRY RUN (add --write to apply)'}`);
  console.log(`Files:  ${files.length}`);
  console.log(`${'─'.repeat(60)}`);

  let fixed   = 0;
  let skipped = 0;
  let noTitle = 0;

  for (const file of files) {
    const slug      = file.replace('.json', '');
    const revisedPath = path.join(REVISED_DIR, file);
    const reviewPath  = path.join(REVIEWS_DIR, file);

    let record;
    try {
      record = JSON.parse(fs.readFileSync(revisedPath, 'utf8'));
    } catch (e) {
      console.log(`  ✗  ${slug}: parse error — ${e.message}`);
      continue;
    }

    if (!record.pageTitle) {
      noTitle++;
      continue;
    }

    const newTitle = fixTitle(record.pageTitle, record.bookTitle, record.mediaType);

    if (!newTitle) {
      skipped++;
      continue;
    }

    console.log(`  ✓  ${slug}`);
    console.log(`     Before: ${record.pageTitle}`);
    console.log(`     After:  ${newTitle}`);
    console.log(`     Chars:  ${newTitle.length}`);

    if (WRITE) {
      // Update pipeline/2-revised/
      record.pageTitle = newTitle;
      fs.writeFileSync(revisedPath, JSON.stringify(record, null, 2), 'utf8');

      // Update data/reviews/ if it exists
      if (fs.existsSync(reviewPath)) {
        const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
        review.pageTitle = newTitle;
        fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2), 'utf8');
      }
    }

    fixed++;
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Fixed:   ${fixed}`);
  console.log(`  Skipped: ${skipped} (already have book vs movie)`);
  console.log(`  No title: ${noTitle}`);

  if (!WRITE && fixed > 0) {
    console.log(`\n[DRY RUN] No files written. Run with --write to apply.`);
  }

  if (WRITE && fixed > 0) {
    console.log(`\n✓ Done. Next step:`);
    console.log(`  node scripts\\pipeline-render.js --all --force`);
  }
}

run();
