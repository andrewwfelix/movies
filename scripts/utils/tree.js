#!/usr/bin/env node

/**
 * tree.js
 * BooksVersusMovies.com — project structure viewer
 *
 * Prints a filtered tree of the project directory to stdout.
 * High-volume folders (reviews/, images/) are summarised with counts
 * instead of listing every file. Only relevant extensions are shown.
 *
 * Usage (run from project root):
 *   node scripts/utils/tree.js                              — full tree, depth 4
 *   node scripts/utils/tree.js --depth 2                   — shallower tree
 *   node scripts/utils/tree.js --dir docs                  — scan docs/ only
 *   node scripts/utils/tree.js --save                      — also write to docs/project-structure.md
 *   node scripts/utils/tree.js --dir docs > docs-tree.txt  — pipe output to file
 *   node scripts/utils/tree.js > project-tree.txt          — full tree to file
 *
 * Options:
 *   --dir     Root directory to scan. Relative paths resolved from project root.
 *             Default: project root (one level up from scripts/)
 *   --depth   Maximum depth to display (default: 4)
 *   --save    Write output to docs/project-structure.md in addition to stdout
 *
 * Destination: scripts/utils/tree.js
 */

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args  = process.argv.slice(2);
const get   = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };

// Resolve --dir relative to project root (one level up from scripts/utils/)
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const dirArg       = get('--dir', null);
const ROOT         = dirArg ? path.resolve(PROJECT_ROOT, dirArg) : PROJECT_ROOT;

const SAVE      = args.includes('--save');
const DOCS_DIR  = path.resolve(PROJECT_ROOT, 'docs');
const OUT_PATH  = path.join(DOCS_DIR, 'project-structure.md');
const MAX_DEPTH = parseInt(get('--depth', '4'), 10);

// ── Ignore rules ──────────────────────────────────────────────────────────────

// Directories to skip entirely — never shown in output
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
]);

// Only show files with these extensions (whitelist approach keeps output readable)
const SHOW_EXTENSIONS = new Set([
  '.js', '.json', '.md', '.txt', '.csv', '.html', '.css', '.xml',
]);

// Always show these specific filenames regardless of extension
const ALWAYS_SHOW = new Set([
  'robots.txt', 'sitemap.xml', '.env.example', 'package.json',
]);

// Always hide these specific filenames (noisy or generated)
const ALWAYS_HIDE = new Set([
  'package-lock.json',
  'browse.html',
]);

// Summarise these high-volume leaf directories with file counts instead of listing
const SUMMARISE_DIRS = new Set([
  'reviews', 'images', 'archive', 'reviews-to-review',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns true if a file should appear in the tree output
function shouldShowFile(filename) {
  if (ALWAYS_HIDE.has(filename)) return false;
  if (ALWAYS_SHOW.has(filename)) return true;
  const ext = path.extname(filename).toLowerCase();
  return SHOW_EXTENSIONS.has(ext);
}

// Returns a human-readable file size string
function getFileSize(filepath) {
  try {
    const bytes = fs.statSync(filepath).size;
    if (bytes < 1024)      return `${bytes}b`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)}kb`;
    return `${(bytes/(1024*1024)).toFixed(1)}mb`;
  } catch { return ''; }
}

// Counts files in a directory, optionally filtered by extension
function countFiles(dirpath, ext) {
  try {
    return fs.readdirSync(dirpath)
      .filter(f => !ext || path.extname(f).toLowerCase() === ext)
      .length;
  } catch { return 0; }
}

// ── Output ────────────────────────────────────────────────────────────────────

// Collect lines for --save mode; always print to stdout
const lines = [];
function out(line) {
  console.log(line);
  if (SAVE) lines.push(line);
}

// ── Tree renderer ─────────────────────────────────────────────────────────────

function renderTree(dirpath, prefix, depth) {
  if (depth > MAX_DEPTH) return;

  let entries;
  try { entries = fs.readdirSync(dirpath); }
  catch (e) {
    out(`${prefix}  [error reading directory: ${e.message}]`);
    return;
  }

  // Sort: directories first, then files, both alphabetical
  const dirs  = entries.filter(e => { try { return fs.statSync(path.join(dirpath, e)).isDirectory(); } catch { return false; } }).sort();
  const files = entries.filter(e => { try { return fs.statSync(path.join(dirpath, e)).isFile();      } catch { return false; } }).sort();

  // Apply filters
  const filteredDirs  = dirs.filter(e  => !IGNORE_DIRS.has(e));
  const filteredFiles = files.filter(e => shouldShowFile(e));
  const all = [...filteredDirs, ...filteredFiles];

  all.forEach((entry, i) => {
    const fullpath    = path.join(dirpath, entry);
    const isLast      = i === all.length - 1;
    const connector   = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    let stat;
    try { stat = fs.statSync(fullpath); } catch { return; }

    if (stat.isDirectory()) {
      // Summarise high-volume leaf directories with counts
      if (SUMMARISE_DIRS.has(entry)) {
        const htmlCount = countFiles(fullpath, '.html');
        const jsonCount = countFiles(fullpath, '.json');
        const csvCount  = countFiles(fullpath, '.csv');
        const counts = [
          htmlCount > 0 ? `${htmlCount} .html` : null,
          jsonCount > 0 ? `${jsonCount} .json` : null,
          csvCount  > 0 ? `${csvCount} .csv`   : null,
        ].filter(Boolean).join(', ');
        out(`${prefix}${connector}${entry}/  [${counts || 'empty'}]`);
        return;
      }

      out(`${prefix}${connector}${entry}/`);
      renderTree(fullpath, prefix + childPrefix, depth + 1);

    } else {
      // Show file with size
      const size    = getFileSize(fullpath);
      const sizeStr = size ? `  (${size})` : '';
      out(`${prefix}${connector}${entry}${sizeStr}`);
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Validate the target directory exists
if (!fs.existsSync(ROOT)) {
  console.error(`✗ Directory not found: ${ROOT}`);
  process.exit(1);
}

const rootName = path.basename(ROOT);
out('');
out(`${rootName}/`);
renderTree(ROOT, '', 1);
out('');
out(`Root:      ${ROOT}`);
out(`Max depth: ${MAX_DEPTH}`);
if (dirArg) out(`Filter:    --dir ${dirArg}`);

// ── Save to docs ──────────────────────────────────────────────────────────────

if (SAVE) {
  const now     = new Date().toISOString().split('T')[0];
  const header  = `# Project Structure\n_Generated: ${now}_\n\`\`\`\n`;
  const footer  = `\`\`\`\n`;
  const content = header + lines.join('\n') + '\n' + footer;

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, content, 'utf8');
  console.log(`\n✓ Saved → ${OUT_PATH}`);
}
