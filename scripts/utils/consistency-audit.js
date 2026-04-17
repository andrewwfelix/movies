#!/usr/bin/env node

/**
 * scripts/utils/consistency-audit.js
 * BooksVersusMovies.com — Audits pages, images, and data for mismatches
 *
 * Checks:
 *   1. Review JSONs missing rendered HTML in project root
 *   2. HTML pages in project root missing a review JSON
 *   3. Review JSONs where expected cover image (slug.jpg) is missing
 *   4. Images in images/ with no corresponding review JSON (orphaned)
 *   5. Placeholder affiliate links (amzn.to/xxxxx)
 *   6. Related card slugs pointing to non-existent pages
 *   7. Greenfield input JSONs already live as rendered pages
 *   8. Duplicate slugs across reviews, pillars, spotlights
 *
 * Usage:
 *   node scripts/utils/consistency-audit.js
 *   node scripts/utils/consistency-audit.js --verbose
 *   node scripts/utils/consistency-audit.js --fix-report   (saves report to data/reports/)
 *
 * Destination: scripts/utils/consistency-audit.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const SAVE    = args.includes('--fix-report');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT          = process.cwd();
const REVIEWS_DIR   = path.join(ROOT, 'data', 'reviews');
const PILLARS_DIR   = path.join(ROOT, 'data', 'pillars');
const GREENFIELD_DIR = path.join(ROOT, 'data', 'greenfield');
const IMAGES_DIR    = path.join(ROOT, 'images');
const REPORTS_DIR   = path.join(ROOT, 'data', 'reports');

// HTML files to ignore in root (not review pages)
const IGNORE_HTML = new Set([
  'index.html', 'about.html', 'auteurs.html', 'upcoming-adaptations.html',
  'featured.html', 'spotlight-dune.html', 'spotlight-fight-club.html',
  'spotlight-gone-girl.html', 'spotlight-lonesome-dove.html',
  'spotlight-the-shining.html', 'spotlight-reminders-of-him.html',
]);

// Pillar slugs (auto-discovered from data/pillars/)
function getPillarSlugs() {
  if (!fs.existsSync(PILLARS_DIR)) return new Set();
  return new Set(fs.readdirSync(PILLARS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getReviewSlugs() {
  if (!fs.existsSync(REVIEWS_DIR)) return new Set();
  return new Set(fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));
}

function getRootHtmlSlugs() {
  return new Set(
    fs.readdirSync(ROOT)
      .filter(f => f.endsWith('.html') && !IGNORE_HTML.has(f))
      .map(f => f.replace('.html', ''))
  );
}

function getImageSlugs() {
  if (!fs.existsSync(IMAGES_DIR)) return new Set();
  return new Set(
    fs.readdirSync(IMAGES_DIR)
      .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
      .map(f => f.replace(/\.(jpg|jpeg|png|webp)$/i, ''))
  );
}

function getGreenfieldSlugs() {
  if (!fs.existsSync(GREENFIELD_DIR)) return new Set();
  return new Set(
    fs.readdirSync(GREENFIELD_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );
}

function loadReviewJSON(slug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, `${slug}.json`), 'utf8'));
  } catch { return null; }
}

// ── Checks ────────────────────────────────────────────────────────────────────

function checkMissingHTML(reviewSlugs, rootHtmlSlugs) {
  const missing = [...reviewSlugs].filter(s => !rootHtmlSlugs.has(s));
  return { name: 'Review JSON missing rendered HTML', items: missing };
}

function checkOrphanedHTML(reviewSlugs, rootHtmlSlugs, pillarSlugs) {
  const orphaned = [...rootHtmlSlugs].filter(s => !reviewSlugs.has(s) && !pillarSlugs.has(s));
  return { name: 'HTML in root with no review JSON or pillar JSON', items: orphaned };
}

function checkMissingImages(reviewSlugs, imageSlugs) {
  const missing = [...reviewSlugs].filter(s => !imageSlugs.has(s));
  return { name: 'Review JSON missing cover image (slug.jpg)', items: missing };
}

function checkOrphanedImages(reviewSlugs, imageSlugs) {
  const orphaned = [...imageSlugs].filter(s => !reviewSlugs.has(s));
  return { name: 'Images with no corresponding review JSON (orphaned)', items: orphaned };
}

function checkPlaceholderLinks(reviewSlugs) {
  const placeholders = [];
  for (const slug of reviewSlugs) {
    const data = loadReviewJSON(slug);
    if (!data) continue;
    const links = [data.affiliateLink, data.affiliateLinkAlt, data.videoAffiliateLink].filter(Boolean);
    for (const link of links) {
      if (link.includes('xxxxx') || link.includes('XXXXX')) {
        placeholders.push(`${slug} — ${link}`);
        break;
      }
    }
  }
  return { name: 'Placeholder affiliate links (xxxxx)', items: placeholders };
}

function checkBrokenRelated(reviewSlugs) {
  const broken = [];
  for (const slug of reviewSlugs) {
    const data = loadReviewJSON(slug);
    if (!data || !Array.isArray(data.related)) continue;
    for (const rel of data.related) {
      const relSlug = rel.slug || rel;
      if (!reviewSlugs.has(relSlug)) {
        broken.push(`${slug} → related: ${relSlug}`);
      }
    }
  }
  return { name: 'Related card slugs pointing to non-existent review', items: broken };
}

function checkGreenfieldAlreadyLive(greenfieldSlugs, rootHtmlSlugs) {
  const alreadyLive = [...greenfieldSlugs].filter(s => rootHtmlSlugs.has(s));
  return { name: 'Greenfield inputs already live as HTML (can be cleaned up)', items: alreadyLive };
}

function checkDuplicateSlugs(reviewSlugs, pillarSlugs, rootHtmlSlugs) {
  const duplicates = [];
  const pillarAndReview = [...pillarSlugs].filter(s => reviewSlugs.has(s));
  if (pillarAndReview.length > 0) {
    pillarAndReview.forEach(s => duplicates.push(`${s} — exists in both data/reviews/ and data/pillars/`));
  }
  return { name: 'Duplicate slugs across reviews and pillars', items: duplicates };
}

// ── Report ────────────────────────────────────────────────────────────────────

function printCheck(check, index) {
  const icon = check.items.length === 0 ? '✓' : '✗';
  const count = check.items.length === 0 ? 'clean' : `${check.items.length} issue${check.items.length !== 1 ? 's' : ''}`;
  console.log(`\n  ${icon}  ${check.name} (${count})`);
  if (check.items.length > 0 && (VERBOSE || check.items.length <= 5)) {
    check.items.forEach(item => console.log(`       → ${item}`));
  } else if (check.items.length > 5 && !VERBOSE) {
    check.items.slice(0, 3).forEach(item => console.log(`       → ${item}`));
    console.log(`       … and ${check.items.length - 3} more (run --verbose to see all)`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log(`\nconsistency-audit.js`);
  console.log(`${'─'.repeat(60)}`);

  const reviewSlugs    = getReviewSlugs();
  const rootHtmlSlugs  = getRootHtmlSlugs();
  const imageSlugs     = getImageSlugs();
  const pillarSlugs    = getPillarSlugs();
  const greenfieldSlugs = getGreenfieldSlugs();

  console.log(`  Reviews:     ${reviewSlugs.size}`);
  console.log(`  Root HTML:   ${rootHtmlSlugs.size}`);
  console.log(`  Images:      ${imageSlugs.size}`);
  console.log(`  Pillars:     ${pillarSlugs.size}`);
  console.log(`  Greenfields: ${greenfieldSlugs.size}`);
  console.log(`${'─'.repeat(60)}`);

  const checks = [
    checkMissingHTML(reviewSlugs, rootHtmlSlugs),
    checkOrphanedHTML(reviewSlugs, rootHtmlSlugs, pillarSlugs),
    checkMissingImages(reviewSlugs, imageSlugs),
    checkOrphanedImages(reviewSlugs, imageSlugs),
    checkPlaceholderLinks(reviewSlugs),
    checkBrokenRelated(reviewSlugs),
    checkGreenfieldAlreadyLive(greenfieldSlugs, rootHtmlSlugs),
    checkDuplicateSlugs(reviewSlugs, pillarSlugs, rootHtmlSlugs),
  ];

  checks.forEach((check, i) => printCheck(check, i));

  const totalIssues = checks.reduce((sum, c) => sum + c.items.length, 0);
  const failedChecks = checks.filter(c => c.items.length > 0).length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Checks:      ${checks.length}`);
  console.log(`  Issues:      ${totalIssues}`);
  console.log(`  Clean:       ${checks.length - failedChecks}/${checks.length}`);

  if (SAVE) {
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, `consistency-audit-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({ date: new Date().toISOString(), checks }, null, 2), 'utf8');
    console.log(`\n  Report saved → ${path.relative(ROOT, reportPath)}`);
  }

  console.log('');
}

run();
