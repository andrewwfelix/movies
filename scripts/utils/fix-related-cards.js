#!/usr/bin/env node

/**
 * scripts/utils/fix-related-cards.js
 * BooksVersusMovies.com — Fixes broken related card slugs in review JSONs
 *
 * For each review JSON with a broken related slug (points to non-existent review),
 * finds the best genre/verdict match from existing reviews and replaces it.
 *
 * Usage:
 *   node scripts/utils/fix-related-cards.js --dry     (preview changes)
 *   node scripts/utils/fix-related-cards.js           (apply changes)
 *
 * Destination: scripts/utils/fix-related-cards.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const DRY = process.argv.includes('--dry');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT        = process.cwd();
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');

// ── Load all reviews ──────────────────────────────────────────────────────────

function loadAllReviews() {
  const reviews = {};
  for (const file of fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.json'))) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf8'));
      reviews[data.slug] = data;
    } catch {}
  }
  return reviews;
}

// ── Genre matching ────────────────────────────────────────────────────────────
// Extract genre tokens from a genre string like "Literary Fiction / Thriller"

function genreTokens(genre) {
  if (!genre) return [];
  return genre.toLowerCase().split(/[\/,\s]+/).filter(t => t.length > 3);
}

function genreScore(a, b) {
  const tokensA = genreTokens(a);
  const tokensB = genreTokens(b);
  return tokensA.filter(t => tokensB.includes(t)).length;
}

// ── Find best replacement ─────────────────────────────────────────────────────

function findBestReplacement(brokenSlug, sourceReview, allReviews, alreadyUsed) {
  const sourceGenre   = sourceReview.genre || '';
  const sourceVerdict = sourceReview.verdictClass || '';

  const candidates = Object.values(allReviews)
    .filter(r => {
      if (r.slug === sourceReview.slug) return false; // not self
      if (alreadyUsed.has(r.slug)) return false;      // not already in related
      return true;
    })
    .map(r => {
      let score = 0;
      score += genreScore(sourceGenre, r.genre || '') * 3;
      if (r.verdictClass === sourceVerdict) score += 2;
      return { slug: r.slug, title: r.bookTitle, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const allReviews = loadAllReviews();
  const existingSlugs = new Set(Object.keys(allReviews));

  console.log(`\nfix-related-cards.js`);
  console.log(`Reviews loaded: ${existingSlugs.size}`);
  console.log(`Dry run: ${DRY ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(60)}`);

  let totalFixed = 0;
  let totalSkipped = 0;
  let pagesChanged = 0;

  for (const [slug, review] of Object.entries(allReviews)) {
    if (!Array.isArray(review.related) || review.related.length === 0) continue;

    const alreadyUsed = new Set(
      review.related.map(r => (typeof r === 'string' ? r : r.slug)).filter(s => existingSlugs.has(s))
    );

    let changed = false;
    const newRelated = review.related.map(rel => {
      const relSlug  = typeof rel === 'string' ? rel : rel.slug;
      const relTitle = typeof rel === 'string' ? rel : rel.title;

      if (existingSlugs.has(relSlug)) {
        alreadyUsed.add(relSlug);
        return rel; // fine
      }

      // Broken — find replacement
      const replacement = findBestReplacement(relSlug, review, allReviews, alreadyUsed);

      if (replacement) {
        alreadyUsed.add(replacement.slug);
        changed = true;
        totalFixed++;
        console.log(`  ✓  ${slug}`);
        console.log(`       ${relSlug} → ${replacement.slug} (${replacement.title})`);
        return { slug: replacement.slug, title: replacement.title };
      } else {
        totalSkipped++;
        console.log(`  ⚠  ${slug} — no replacement found for: ${relSlug}`);
        return rel;
      }
    });

    if (changed) {
      pagesChanged++;
      if (!DRY) {
        review.related = newRelated;
        fs.writeFileSync(
          path.join(REVIEWS_DIR, `${slug}.json`),
          JSON.stringify(review, null, 2),
          'utf8'
        );
      }
    }
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Fixed:        ${totalFixed}`);
  console.log(`  Skipped:      ${totalSkipped}`);
  console.log(`  Pages changed: ${pagesChanged}`);

  if (DRY) {
    console.log(`\n[DRY RUN] No files modified. Re-run without --dry to apply.`);
  } else if (pagesChanged > 0) {
    console.log(`\nNext step: node scripts/pipeline-render.js --all --force`);
  }
}

run();
