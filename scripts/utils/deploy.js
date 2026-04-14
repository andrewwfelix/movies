#!/usr/bin/env node

/**
 * deploy.js
 * BooksVersusMovies.com — deploy downloaded files to project
 *
 * Scans Downloads folder for files with a Destination: comment/key,
 * copies each to the correct location in the project, and optionally
 * deletes from Downloads after successful copy.
 *
 * Usage:
 *   node deploy.js              (preview — show what would be copied)
 *   node deploy.js --write      (copy files to project)
 *   node deploy.js --write --clean   (copy + delete from Downloads)
 *
 * How to mark a file for deployment:
 *   JS/txt files:   add  * Destination: scripts/pipeline-guide.js  in header comment
 *   JSON files:     add  "_destination": "config/models.json"  as a key
 *   md/toml files:  add  # Destination: docs/strategy/kanban.md  as first line
 *
 * Destination: scripts/utils/deploy.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args     = process.argv.slice(2);
const WRITE    = args.includes('--write');
const CLEAN    = args.includes('--clean');

const PROJECT  = path.resolve(__dirname, '../..');
const DOWNLOADS_ROOT = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads');
const DOWNLOADS_FILES = path.join(DOWNLOADS_ROOT, 'files');
const DOWNLOADS = fs.existsSync(DOWNLOADS_FILES) ? DOWNLOADS_FILES : DOWNLOADS_ROOT;

// ── Extract destination from a file ──────────────────────────────────────────

function getDestination(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // JSON — look for _destination key
    if (ext === '.json') {
      try {
        const obj = JSON.parse(content);
        if (obj._destination) return obj._destination;
      } catch {}
      return null;
    }

    // All other files — look for "Destination:" in first 30 lines
    const lines = content.split('\n').slice(0, 30);
    for (const line of lines) {
      const m = line.match(/Destination:\s*(.+)/);
      if (m) return m[1].trim().replace(/\*\/$/, '').replace(/\)$/, '').trim();
    }

    return null;
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(DOWNLOADS)) {
    console.error(`✗ Downloads folder not found: ${DOWNLOADS}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DOWNLOADS).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.js', '.json', '.txt', '.md', '.toml', '.bat', '.css'].includes(ext);
  });

  console.log(`\ndeploy.js`);
  console.log(`Mode:      ${WRITE ? (CLEAN ? 'WRITE + CLEAN' : 'WRITE') : 'PREVIEW'}`);
  console.log(`Downloads: ${DOWNLOADS}${DOWNLOADS === DOWNLOADS_FILES ? " (files/ subfolder)" : " (root — create files/ subfolder for cleaner workflow)"}`);
  console.log(`Project:   ${PROJECT}`);
  console.log(`Files:     ${files.length} eligible`);
  console.log(`${'─'.repeat(60)}`);

  let deployed  = 0;
  let skipped   = 0;
  let noTarget  = 0;

  for (const file of files) {
    const srcPath  = path.join(DOWNLOADS, file);
    const dest     = getDestination(srcPath);

    if (!dest) {
      noTarget++;
      continue;
    }

    // Normalize path separators
    const normalDest = dest.replace(/\//g, path.sep);
    const destPath   = path.join(PROJECT, normalDest);
    const destDir    = path.dirname(destPath);

    console.log(`  ✓  ${file}`);
    console.log(`       → ${normalDest}`);

    if (WRITE) {
      // Ensure destination directory exists
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`       Created: ${path.relative(PROJECT, destDir)}`);
      }

      fs.copyFileSync(srcPath, destPath);

      if (CLEAN) {
        fs.unlinkSync(srcPath);
        console.log(`       Deleted from Downloads`);
      }
    }

    deployed++;
  }

  console.log(`${'─'.repeat(60)}`);
  console.log(`  Deployed:  ${deployed}`);
  console.log(`  No target: ${noTarget} (no Destination: comment — skipped)`);

  if (!WRITE) {
    console.log(`\n[PREVIEW] No files copied. Run with --write to deploy.`);
    console.log(`          Add --clean to also delete from Downloads after copying.`);
  } else {
    console.log(`\n✓ Done.`);
    if (deployed > 0) {
      console.log(`\nSuggested next step:`);
      console.log(`  git add . && git commit -m "deploy: update files from session"`);
    }
  }
}

run();
