#!/usr/bin/env node

/**
 * tree.js
 * BooksVersusMovies.com — project structure viewer
 *
 * Usage:
 *   node tree.js
 *   node tree.js --depth 2
 *   node tree.js --dir ../
 *
 * Options:
 *   --dir     Root directory to scan (default: ../ relative to scripts/)
 *   --depth   Maximum depth to display (default: 4)
 */

const fs   = require('fs');
const path = require('path');

const args  = process.argv.slice(2);
const get   = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };

const ROOT  = path.resolve(__dirname, get('--dir', '../'));
const MAX_DEPTH = parseInt(get('--depth', '4'), 10);

// ── Ignore rules ─────────────────────────────────────────────────────────────
// Directories to skip entirely
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
]);

// File extensions to show (whitelist — everything else is hidden)
const SHOW_EXTENSIONS = new Set([
  '.js', '.json', '.md', '.txt', '.csv',
  '.html', '.css', '.xml', '.txt',
]);

// Specific filenames to always show regardless of extension
const ALWAYS_SHOW = new Set([
  'robots.txt', 'sitemap.xml', '.env.example', 'package.json',
  'package-lock.json',
]);

// Specific filenames to always hide
const ALWAYS_HIDE = new Set([
  'package-lock.json',   // noisy, not useful to review
  'browse.html',         // generated file, large
]);

// Folders where we show a summary count instead of listing every file
// (because they contain many similar files)
const SUMMARISE_DIRS = new Set([
  'reviews',
  'images',
  'archive',
  'reviews-to-review',
]);

// Folders where we show contents of subdirs but summarise leaf files
const SUMMARISE_DATA_DIRS = new Set([
  'reviews',   // data/reviews — many json files
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function shouldShowFile(filename) {
  if (ALWAYS_HIDE.has(filename)) return false;
  if (ALWAYS_SHOW.has(filename)) return true;
  const ext = path.extname(filename).toLowerCase();
  return SHOW_EXTENSIONS.has(ext);
}

function getFileSize(filepath) {
  try {
    const bytes = fs.statSync(filepath).size;
    if (bytes < 1024)       return `${bytes}b`;
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(0)}kb`;
    return `${(bytes/(1024*1024)).toFixed(1)}mb`;
  } catch { return ''; }
}

function countFiles(dirpath, ext) {
  try {
    return fs.readdirSync(dirpath)
      .filter(f => !ext || path.extname(f).toLowerCase() === ext)
      .length;
  } catch { return 0; }
}

// ── Tree renderer ─────────────────────────────────────────────────────────────

function renderTree(dirpath, prefix, depth, dirName) {
  if (depth > MAX_DEPTH) return;

  let entries;
  try { entries = fs.readdirSync(dirpath); }
  catch { return; }

  // Sort: directories first, then files, both alphabetical
  const dirs  = entries.filter(e => {
    try { return fs.statSync(path.join(dirpath, e)).isDirectory(); } catch { return false; }
  }).sort();

  const files = entries.filter(e => {
    try { return fs.statSync(path.join(dirpath, e)).isFile(); } catch { return false; }
  }).sort();

  const all = [...dirs, ...files];
  const filtered = all.filter(e => {
    const fullpath = path.join(dirpath, e);
    try {
      const stat = fs.statSync(fullpath);
      if (stat.isDirectory()) return !IGNORE_DIRS.has(e);
      return shouldShowFile(e);
    } catch { return false; }
  });

  filtered.forEach((entry, i) => {
    const fullpath   = path.join(dirpath, entry);
    const isLast     = i === filtered.length - 1;
    const connector  = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    let stat;
    try { stat = fs.statSync(fullpath); } catch { return; }

    if (stat.isDirectory()) {
      // Summarise high-volume leaf directories
      if (SUMMARISE_DIRS.has(entry)) {
        const htmlCount = countFiles(fullpath, '.html');
        const jsonCount = countFiles(fullpath, '.json');
        const csvCount  = countFiles(fullpath, '.csv');
        const counts = [
          htmlCount > 0 ? `${htmlCount} .html` : null,
          jsonCount > 0 ? `${jsonCount} .json` : null,
          csvCount  > 0 ? `${csvCount} .csv`  : null,
        ].filter(Boolean).join(', ');
        const summary = counts ? `  [${counts}]` : '  [empty]';
        console.log(`${prefix}${connector}${entry}/${summary}`);
        return;
      }

      console.log(`${prefix}${connector}${entry}/`);
      renderTree(fullpath, prefix + childPrefix, depth + 1, entry);

    } else {
      const size = getFileSize(fullpath);
      const sizeStr = size ? `  (${size})` : '';
      console.log(`${prefix}${connector}${entry}${sizeStr}`);
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

const rootName = path.basename(ROOT);
console.log('');
console.log(`${rootName}/`);
renderTree(ROOT, '', 1, rootName);
console.log('');
console.log(`Root: ${ROOT}`);
console.log(`Max depth: ${MAX_DEPTH}`);
