#!/usr/bin/env node

/**
 * review-pipeline-output.js
 * BooksVersusMovies.com — pipeline output review summary
 *
 * Reads all JSON files in pipeline/2-revised/ and produces a clean
 * tabular summary for QA review before rendering and deployment.
 *
 * Usage:
 *   node review-pipeline-output.js
 *   node review-pipeline-output.js --out logs/pipeline-review.txt
 *   node review-pipeline-output.js --issues-only
 *   node review-pipeline-output.js --field oneLineReason
 *
 * Options:
 *   --out          Write output to file in addition to stdout
 *   --issues-only  Show only pages with warnings or failures
 *   --field        Show a specific field for all pages (e.g. oneLineReason, pageTitle)
 * Destination: scripts/reporting/review-pipeline-output.js
 */

const fs   = require('fs');
const path = require('path');

const args       = process.argv.slice(2);
const get        = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag    = flag => args.includes(flag);

const SRC_DIR    = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_FILE   = get('--out', null) ? path.resolve(__dirname, '../', get('--out', null)) : null;
const ISSUES_ONLY = hasFlag('--issues-only');
const FIELD      = get('--field', null);

const TITLE_TARGET = 65;
const TITLE_LIMIT  = 75;
const META_LIMIT   = 155;
const REASON_WORDS = 15;

const GENERIC_PHRASES = [
  'both versions', 'both have', 'each version', 'has its strengths',
  'offers more depth', 'depending on', 'both are', 'unique in its own',
  'something for everyone', 'hard to choose', 'different but equal',
  'equally rewarding', 'both equally', 'neither diminishes',
  'complement each other', 'worth experiencing', 'illuminate each other',
];

function isGeneric(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(p => lower.includes(p));
}

function pad(str, len) {
  const s = (str || '').toString();
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('✗ No JSON files found in pipeline/2-revised/');
    process.exit(1);
  }

  const lines = [];
  const out   = s => lines.push(s);

  out(`BooksVersusMovies.com — Pipeline Output Review`);
  out(`===============================================`);
  out(`Generated: ${new Date().toISOString().split('T')[0]}`);
  out(`Pages:     ${files.length}`);
  out(``);

  // ── Single field mode ───────────────────────────────────────────────────────
  if (FIELD) {
    out(`Field: ${FIELD}`);
    out(`${'─'.repeat(80)}`);
    for (const file of files) {
      const slug = file.replace('.json', '');
      try {
        const r = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
        const value = FIELD.includes('.')
          ? FIELD.split('.').reduce((obj, key) => obj?.[key], r)
          : r[FIELD];
        out(`${slug.padEnd(45)} ${value || '(missing)'}`);
      } catch (e) {
        out(`${slug.padEnd(45)} ERROR: ${e.message}`);
      }
    }
    const output = lines.join('\n');
    console.log(output);
    if (OUT_FILE) fs.writeFileSync(OUT_FILE, output, 'utf8');
    return;
  }

  // ── Full summary mode ────────────────────────────────────────────────────────
  const stats = {
    total: files.length,
    missingQuickAnswer: 0,
    missingCtaBlocks: 0,
    genericReason: 0,
    longTitle: 0,
    longMeta: 0,
    warnings: 0,
  };

  // Header
  out(`${'SLUG'.padEnd(42)} ${'WINNER'.padEnd(20)} ${'READ'.padEnd(22)} ${'TITLE CHARS'.padEnd(12)} ${'META CHARS'.padEnd(11)} ${'CTA'.padEnd(4)} ${'FLAGS'}`);
  out(`${'─'.repeat(130)}`);

  const issueRows = [];

  for (const file of files) {
    const slug = file.replace('.json', '');
    let r;
    try {
      r = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
    } catch (e) {
      out(`  ✗  ${slug}: failed to parse — ${e.message}`);
      continue;
    }

    const flags = [];

    // quickAnswer
    const qa = r.quickAnswer;
    const winner    = qa?.winner    || '(missing)';
    const readFirst = qa?.readFirst || '(missing)';
    const reason    = qa?.oneLineReason || '';

    if (!qa) { flags.push('NO_QA'); stats.missingQuickAnswer++; }
    else {
      if (!reason)              flags.push('NO_REASON');
      else if (isGeneric(reason)) { flags.push('GENERIC'); stats.genericReason++; }
      else if (reason.split(' ').length > REASON_WORDS) flags.push('LONG_REASON');
    }

    // title
    const titleLen = (r.pageTitle || '').length;
    if (!r.pageTitle)          flags.push('NO_TITLE');
    else if (titleLen > TITLE_LIMIT)  { flags.push(`TITLE_${titleLen}`); stats.longTitle++; }
    else if (titleLen > TITLE_TARGET) flags.push(`TITLE_${titleLen}⚠`);

    // meta
    const metaLen = (r.metaDesc || '').length;
    if (!r.metaDesc)           flags.push('NO_META');
    else if (metaLen > META_LIMIT)   { flags.push(`META_${metaLen}`); stats.longMeta++; }
    else if (metaLen < 50)    flags.push('SHORT_META');

    // ctaBlocks
    const ctaCount = r.ctaBlocks?.length || 0;
    if (ctaCount !== 3) { flags.push(`CTA_${ctaCount}`); stats.missingCtaBlocks++; }

    const hasIssue = flags.length > 0;
    if (hasIssue) stats.warnings++;

    const flagStr  = flags.join(' ');
    const status   = hasIssue ? '⚠ ' : '✓ ';
    const row = `${status}${pad(slug, 42)} ${pad(winner, 20)} ${pad(readFirst, 22)} ${String(titleLen).padEnd(12)} ${String(metaLen).padEnd(11)} ${String(ctaCount).padEnd(4)} ${flagStr}`;

    if (!ISSUES_ONLY || hasIssue) out(row);
    if (hasIssue) issueRows.push({ slug, flags, reason, title: r.pageTitle });
  }

  // ── oneLineReason detail for issues ─────────────────────────────────────────
  if (issueRows.length > 0) {
    out(``);
    out(`── Issues detail ────────────────────────────────────────────────────`);
    for (const row of issueRows) {
      out(`\n  ${row.slug}`);
      out(`    Flags:  ${row.flags.join(', ')}`);
      if (row.reason) out(`    Reason: ${row.reason}`);
      if (row.title)  out(`    Title:  ${row.title}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  out(``);
  out(`── Summary ──────────────────────────────────────────────────────────`);
  out(`  Total pages:           ${stats.total}`);
  out(`  Pages with issues:     ${stats.warnings}`);
  out(`  Missing quickAnswer:   ${stats.missingQuickAnswer}`);
  out(`  Generic oneLineReason: ${stats.genericReason}`);
  out(`  Title over target:     ${stats.longTitle}`);
  out(`  Meta over limit:       ${stats.longMeta}`);
  out(`  Wrong CTA count:       ${stats.missingCtaBlocks}`);
  out(stats.warnings === 0 ? `\n  ✓ All pages clean` : `\n  ⚠ ${stats.warnings} page(s) need attention`);

  const output = lines.join('\n');
  console.log(output);

  if (OUT_FILE) {
    fs.writeFileSync(OUT_FILE, output, 'utf8');
    console.error(`\n✓ Written to ${OUT_FILE}`);
  }
}

run();
