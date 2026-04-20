#!/usr/bin/env node

/**
 * scripts/utils/trim-index.js
 * BooksVersusMovies.com — Extract fold-relevant HTML for LLM layout review
 *
 * Reads a rendered review page from the project root and outputs:
 *   - The full <head> block (CSS links only relevant)
 *   - <body> through the end of the first difference section
 *
 * Usage:
 *   node scripts/utils/trim-index.js                          -- uses reminders-of-him.html
 *   node scripts/utils/trim-index.js --slug gone-girl         -- any review page
 *   node scripts/utils/trim-index.js --out trim-output.html   -- custom output filename
 *
 * Output: pipeline/trim-index-{slug}.html
 *
 * Destination: scripts/utils/trim-index.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };

const SLUG    = get('--slug', 'reminders-of-him');
const OUT     = get('--out', null);

const ROOT      = path.resolve(__dirname, '..', '..');
const SRC_FILE  = path.join(ROOT, `${SLUG}.html`);
const OUT_FILE  = OUT
  ? path.join(ROOT, OUT)
  : path.join(ROOT, 'pipeline', `trim-index-${SLUG}.html`);

if (!fs.existsSync(SRC_FILE)) {
  console.error(`✗ File not found: ${SLUG}.html`);
  console.error(`  Expected at: ${SRC_FILE}`);
  process.exit(1);
}

const html = fs.readFileSync(SRC_FILE, 'utf8');

// ── Extract <head> ────────────────────────────────────────────────────────────

const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
if (!headMatch) {
  console.error('✗ Could not find <head> block');
  process.exit(1);
}

// Strip everything from head except meta charset, title, and link/style tags
const headRaw = headMatch[0];
const headLines = headRaw.split('\n').filter(line => {
  const l = line.trim().toLowerCase();
  return (
    l.startsWith('<head') ||
    l.startsWith('</head') ||
    l.startsWith('<meta charset') ||
    l.startsWith('<meta name="viewport') ||
    l.startsWith('<title') ||
    l.startsWith('<link') ||
    l.startsWith('<style')
  );
});
const head = headLines.join('\n');

// ── Extract body through end of first difference section ──────────────────────

const bodyStart = html.indexOf('<body');
if (bodyStart === -1) {
  console.error('✗ Could not find <body> tag');
  process.exit(1);
}

const bodyHtml = html.slice(bodyStart);

// Find the end of the first difference section.
// Try common class patterns used in pipeline-render.js
const DIFFERENCE_PATTERNS = [
  /class="difference[^"]*"/i,
  /class="differences[^"]*"/i,
  /id="differences"/i,
  /class="key-difference[^"]*"/i,
];

let firstDiffStart = -1;
for (const pattern of DIFFERENCE_PATTERNS) {
  const m = bodyHtml.search(pattern);
  if (m !== -1 && (firstDiffStart === -1 || m < firstDiffStart)) {
    firstDiffStart = m;
  }
}

let trimmedBody;

if (firstDiffStart === -1) {
  console.warn('⚠ Could not find differences section — outputting full body (may be large)');
  trimmedBody = bodyHtml;
} else {
  // Find the closing tag of the first difference block
  // Walk forward from firstDiffStart to find the second difference or a closing section wrapper
  const afterFirst = bodyHtml.indexOf('class="difference', firstDiffStart + 50);
  const cutPoint   = afterFirst !== -1 ? afterFirst : firstDiffStart + 2000;

  // Back up to the nearest clean tag boundary before cutPoint
  const beforeCut  = bodyHtml.lastIndexOf('<', cutPoint);
  trimmedBody      = bodyHtml.slice(0, beforeCut) + '\n\n<!-- ... remaining differences omitted for review ... -->\n\n</body>\n</html>';
}

// ── Assemble output ───────────────────────────────────────────────────────────

const output = `<!DOCTYPE html>
<!-- TRIMMED FOR LLM LAYOUT REVIEW — fold analysis only -->
<!-- Source: ${SLUG}.html -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- This file contains: <head> CSS links + body through first difference section -->

${head}
${trimmedBody}`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, output, 'utf8');

const lineCount = output.split('\n').length;
const sizeKb    = Math.round(Buffer.byteLength(output) / 1024);

console.log(`\ntrim-index.js`);
console.log(`Source:  ${SLUG}.html`);
console.log(`Output:  ${path.relative(ROOT, OUT_FILE)}`);
console.log(`Size:    ${sizeKb}kb / ${lineCount} lines`);
console.log(`\nShare this file + style.css + the desktop screenshot with other LLMs.`);
console.log(`Prompt: "Fix the desktop fold problem — comparison data should be visible without scrolling."`);
console.log(`        "Preserve the existing design language. Minimal changes only."\n`);
