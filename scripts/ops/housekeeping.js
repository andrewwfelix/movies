#!/usr/bin/env node

/**
 * housekeeping.js
 * BooksVersusMovies.com — Archive old scripts before greenfield work
 *
 * Usage:
 *   node scripts/housekeeping.js
 * Destination: scripts/ops/housekeeping.js
 */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.resolve(__dirname);
const ARCHIVE_DIR = path.resolve(SCRIPTS_DIR, 'archive');

const LEGACY_DIR = path.resolve(ARCHIVE_DIR, 'legacy');
const V1_PIPELINE_DIR = path.resolve(ARCHIVE_DIR, 'v1-pipeline');
const DEPRECATED_DIR = path.resolve(ARCHIVE_DIR, 'deprecated');

// Files we are confident should be archived
const TO_ARCHIVE = {
  legacy: [
    'extract-metadata.js',           // old v1 version
    'html-to-json.js',               // early extraction
    'pipeline-extract.js'            // superseded
  ],
  v1_pipeline: [
    'pipeline-revise-old.js',        // early revision script
    'pipeline-revise-v1.js'
  ],
  deprecated: [
    'fix-cta-titles.js',
    'log-all-titles.js',
    'review-pipeline-output.js'      // if no longer used
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${path.relative(process.cwd(), dir)}`);
  }
}

function archiveFile(file, targetDir) {
  const sourcePath = path.join(SCRIPTS_DIR, file);
  const targetPath = path.join(targetDir, file);

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  File not found (skipping): ${file}`);
    return false;
  }

  // Add archive note at top if not already present
  let content = fs.readFileSync(sourcePath, 'utf8');

  if (!content.includes('ARCHIVED:')) {
    const archiveNote = `/**
 * ARCHIVED: ${new Date().toISOString().split('T')[0]}
 * Reason: Superseded by newer pipeline scripts.
 * Do not use for production. Kept for historical reference only.
 */\n\n`;
    content = archiveNote + content;
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  fs.unlinkSync(sourcePath);

  console.log(`✅ Archived: ${file} → archive/${path.relative(ARCHIVE_DIR, targetDir)}`);
  return true;
}

function run() {
  console.log('🚀 Starting housekeeping...\n');

  ensureDir(LEGACY_DIR);
  ensureDir(V1_PIPELINE_DIR);
  ensureDir(DEPRECATED_DIR);

  let archivedCount = 0;

  // Archive legacy files
  TO_ARCHIVE.legacy.forEach(file => {
    if (archiveFile(file, LEGACY_DIR)) archivedCount++;
  });

  // Archive v1 pipeline files
  TO_ARCHIVE.v1_pipeline.forEach(file => {
    if (archiveFile(file, V1_PIPELINE_DIR)) archivedCount++;
  });

  // Archive deprecated files
  TO_ARCHIVE.deprecated.forEach(file => {
    if (archiveFile(file, DEPRECATED_DIR)) archivedCount++;
  });

  console.log(`\n✅ Housekeeping complete. Archived ${archivedCount} files.`);
  console.log(`\nNext steps:`);
  console.log(`1. Review scripts/archive/ to make sure everything looks correct`);
  console.log(`2. Update completed-tasks.md with today's housekeeping entry`);
  console.log(`3. Commit on the 'housekeeping' branch`);
  console.log(`4. When ready, merge to main and continue with greenfield pipeline`);
}

run();