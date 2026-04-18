#!/usr/bin/env node

/**
 * fix-related-cards-spotlight.js
 * BooksVersusMovies.com
 *
 * Repairs ONLY spotlight related-card links.
 * Strictly scoped to .related-card elements.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────

const DRY = process.argv.includes('--dry');
const DEBUG = process.argv.includes('--debug');

// ─────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────

const ROOT = process.cwd();
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');
const SPOTLIGHT_FILES = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('spotlight-') && f.endsWith('.html'));

// ─────────────────────────────────────────────
// Load valid review slugs
// ─────────────────────────────────────────────

function loadReviewSlugs() {
  const files = fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.json'));
  const slugs = new Set();

  for (const file of files) {
    try {
      const json = JSON.parse(
        fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf8')
      );
      if (json.slug) slugs.add(json.slug);
    } catch {}
  }

  return slugs;
}

// ─────────────────────────────────────────────
// Extract ONLY related-card links
// ─────────────────────────────────────────────

function extractRelatedCards(html) {
  const regex = /<a\s+class="related-card"[^>]*href="\/([^"]+)"/g;

  const results = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    results.push(match[1].replace(/\.html$/, ''));
  }

  return results;
}

// ─────────────────────────────────────────────
// Replace broken slug
// ─────────────────────────────────────────────

function replaceSlug(broken, sourceSlug, allSlugs) {
  // simple fallback: pick first valid match not equal to source
  for (const slug of allSlugs) {
    if (slug !== sourceSlug) return slug;
  }
  return broken;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

function run() {
  const validSlugs = loadReviewSlugs();

  console.log(`\n🔧 Spotlight Fixer (STRICT MODE)`);
  console.log(`Spotlights: ${SPOTLIGHT_FILES.length}`);
  console.log(`Reviews:    ${validSlugs.size}`);
  console.log(`Dry run:    ${DRY}`);
  console.log(`──────────────────────\n`);

  let fixed = 0;
  let broken = 0;

  for (const file of SPOTLIGHT_FILES) {
    const filePath = path.join(ROOT, file);
    const html = fs.readFileSync(filePath, 'utf8');

    const relatedSlugs = extractRelatedCards(html);

    if (relatedSlugs.length === 0) continue;

    let updatedHtml = html;
    let changed = false;

    if (DEBUG) {
      console.log(`📄 ${file}`);
      console.log(`   Related cards: ${relatedSlugs.length}`);
    }

    for (const slug of relatedSlugs) {
      if (validSlugs.has(slug)) {
        if (DEBUG) console.log(`   ✔ ${slug}`);
        continue;
      }

      broken++;

      const replacement = replaceSlug(slug, slug, validSlugs);

      console.log(`❌ ${file} → ${slug} → ${replacement}`);

      // Replace only within related-card href
      const pattern = new RegExp(
        `(<a\\s+class="related-card"[^>]*href="\\/)${
          slug
        }(\\.html"?[^>]*>)`,
        'g'
      );

      updatedHtml = updatedHtml.replace(pattern, `$1${replacement}$2`);
      changed = true;
      fixed++;
    }

    if (changed && !DRY) {
      fs.writeFileSync(filePath, updatedHtml, 'utf8');
    }
  }

  console.log(`\n──────────────────────`);
  console.log(`Broken found: ${broken}`);
  console.log(`Fixed:        ${fixed}`);
  console.log(`──────────────────────`);

  if (DRY) {
    console.log(`(DRY RUN) No files written`);
  }
}

run();