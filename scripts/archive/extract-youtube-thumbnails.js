#!/usr/bin/env node

/**
 * extract_youtube_thumbnails.js
 *
 * Scans all .html files in a directory and extracts YouTube video IDs,
 * outputting the file name, video ID, thumbnail URL, and watch URL.
 *
 * Usage:
 *   node extract_youtube_thumbnails.js [directory]
 *
 * If no directory is provided, defaults to the current working directory.
 *
 * Examples:
 *   node extract_youtube_thumbnails.js .
 *   node extract_youtube_thumbnails.js /path/to/your/site
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname, resolve } from 'path';

// ── Config ──────────────────────────────────────────────────────────────────

const DIR = resolve(process.argv[2] || '.');

// Matches all common YouTube URL patterns and captures the 11-char video ID:
//   https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
const YT_REGEX = /(?:youtube\.com\/vi\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g;

// ── Read directory ───────────────────────────────────────────────────────────

let htmlFiles;

try {
  htmlFiles = readdirSync(DIR)
    .filter(f => extname(f).toLowerCase() === '.html')
    .sort();
} catch (err) {
  console.error(`\n❌  Could not read directory: ${DIR}`);
  console.error(`    ${err.message}\n`);
  process.exit(1);
}

if (htmlFiles.length === 0) {
  console.log(`\nNo .html files found in: ${DIR}\n`);
  process.exit(0);
}

// ── Extract IDs ──────────────────────────────────────────────────────────────

const results = [];

for (const file of htmlFiles) {
  try {
    const content = readFileSync(join(DIR, file), 'utf-8');
    const ids = new Set();

    // Reset lastIndex each time — required when reusing a /g regex
    YT_REGEX.lastIndex = 0;
    let match;
    while ((match = YT_REGEX.exec(content)) !== null) {
      ids.add(match[1]);
    }

    for (const id of ids) {
      results.push({
        file,
        id,
        thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        watch:     `https://www.youtube.com/watch?v=${id}`,
      });
    }
  } catch (_err) {
    // Skip unreadable files silently and carry on
  }
}

// ── Nothing found ────────────────────────────────────────────────────────────

if (results.length === 0) {
  console.log('\nNo YouTube IDs found in any .html file.\n');
  process.exit(0);
}

// ── Table output ─────────────────────────────────────────────────────────────

const uniqueFiles = new Set(results.map(r => r.file)).size;
const col1        = Math.max(...results.map(r => r.file.length), 4);
const THUMB_W     = 55;
const divider     = '─'.repeat(col1 + 2 + 11 + 2 + THUMB_W + 2 + 43);

console.log(`\nScanning: ${DIR}`);
console.log(`Found ${results.length} YouTube ID(s) across ${uniqueFiles} file(s).\n`);

console.log(divider);
console.log(
  `${'FILE'.padEnd(col1)}  ${'VIDEO ID'.padEnd(11)}  ${'THUMBNAIL URL'.padEnd(THUMB_W)}  WATCH URL`
);
console.log(divider);

for (const { file, id, thumbnail, watch } of results) {
  console.log(
    `${file.padEnd(col1)}  ${id.padEnd(11)}  ${thumbnail.padEnd(THUMB_W)}  ${watch}`
  );
}

console.log(divider);

// ── JSON output — handy for pasting into calendar.html updates ───────────────

console.log('\n── JSON (copy-paste ready for calendar updates) ─────────────────────────────\n');

const json = {};
for (const { file, id, thumbnail, watch } of results) {
  const key = file.replace('.html', '');
  json[key] = { id, thumbnail, watch };
}

console.log(JSON.stringify(json, null, 2));
console.log();
