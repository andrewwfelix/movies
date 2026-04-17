#!/usr/bin/env node

/**
 * scripts/content/consolidate-docs.js
 * Consolidates all files in a given folder into a single text file.
 *
 * Usage:
 *   node scripts/content/consolidate-docs.js                        (defaults to docs/)
 *   node scripts/content/consolidate-docs.js --folder brainstorming
 *   node scripts/content/consolidate-docs.js --folder docs/surveys
 *   node scripts/content/consolidate-docs.js --folder advice/inputs
 *   node scripts/content/consolidate-docs.js --out my-output.txt
 *
 * Output: <folder>/consolidated-<foldername>.txt
 *   or use --out to specify a custom output path
 *
 * Destination: scripts/content/consolidate-docs.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const getArg = flag => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : null; };

const FOLDER_ARG = getArg('--folder') || 'docs';
const OUT_ARG    = getArg('--out');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, FOLDER_ARG);

if (!fs.existsSync(targetDir)) {
  console.error(`✗ Folder not found: ${targetDir}`);
  process.exit(1);
}

const folderName = path.basename(targetDir);
const defaultOut = path.join(targetDir, `consolidated-${folderName}.txt`);
const outputFile = OUT_ARG ? path.resolve(ROOT, OUT_ARG) : defaultOut;

// ── Walk ──────────────────────────────────────────────────────────────────────

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = walk(targetDir)
  .filter(f => path.resolve(f) !== path.resolve(outputFile))
  .sort();

if (files.length === 0) {
  console.error(`✗ No files found in: ${targetDir}`);
  process.exit(1);
}

let output = '';
for (const file of files) {
  const relativePath = path.relative(targetDir, file);
  const content = fs.readFileSync(file, 'utf8');
  output += `\n\n===== ${relativePath} =====\n\n${content}`;
}

// Ensure output directory exists
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outputFile, output.trimStart(), 'utf8');

console.log(`✓ Consolidated ${files.length} files`);
console.log(`  Source: ${path.relative(ROOT, targetDir)}`);
console.log(`  Output: ${path.relative(ROOT, outputFile)}`);
