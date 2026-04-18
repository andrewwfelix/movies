#!/usr/bin/env node

/**
 * validate-spotlights.js
 * BooksVersusMovies.com
 *
 * Validates spotlight related-card links against real review slugs.
 * Outputs clear mapping of:
 *   spotlight-page → broken-slug
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────

const DEBUG = process.argv.includes('--debug');

// ─────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────

const ROOT = process.cwd();
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');

// Spotlights live in root (confirmed by your structure)
const SPOTLIGHT_DIR = ROOT;

// ─────────────────────────────────────────────
// Load valid review slugs (source of truth)
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
    } catch (e) {
      if (DEBUG) console.log(`⚠️ Failed reading ${file}`);
    }
  }

  return slugs;
}

// ─────────────────────────────────────────────
// Load spotlight files
// ─────────────────────────────────────────────

function loadSpotlights() {
  return fs.readdirSync(SPOTLIGHT_DIR)
    .filter(f => f.startsWith('spotlight-') && f.endsWith('.html'));
}

// ─────────────────────────────────────────────
// Extract ONLY related-card slugs
// ─────────────────────────────────────────────

function extractRelatedSlugs(html) {
  const regex = /class="related-card"[^>]*href="\/([^"]+)"/g;

  const slugs = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    let slug = match[1].trim().replace(/\.html$/, '');
    slugs.push(slug);
  }

  return slugs;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

function run() {
  const reviewSlugs = loadReviewSlugs();
  const spotlightFiles = loadSpotlights();

  console.log(`\n🔍 Spotlight Validator`);
  console.log(`Reviews loaded:   ${reviewSlugs.size}`);
  console.log(`Spotlights found: ${spotlightFiles.length}`);
  console.log(`Debug:            ${DEBUG}`);
  console.log(`────────────────────────────────────`);

  let totalBroken = 0;
  let totalValid = 0;

  for (const file of spotlightFiles) {
    const filePath = path.join(SPOTLIGHT_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');

    const slugs = extractRelatedSlugs(html);

    if (DEBUG) {
      console.log(`\n📄 ${file}`);
      console.log(`   Related cards: ${slugs.length}`);
    }

    let fileHasIssues = false;

    for (const slug of slugs) {
      if (reviewSlugs.has(slug)) {
        totalValid++;
        if (DEBUG) console.log(`   ✔ ${slug}`);
      } else {
        totalBroken++;
        fileHasIssues = true;
        console.log(`❌ ${file} → ${slug} (missing in reviews)`);
      }
    }

    if (DEBUG && !fileHasIssues) {
      console.log(`   ✔ all valid`);
    }
  }

  console.log(`────────────────────────────`);
  console.log(`Valid:  ${totalValid}`);
  console.log(`Broken: ${totalBroken}`);
  console.log(`────────────────────────────`);
}

run();