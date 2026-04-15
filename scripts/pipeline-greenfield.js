#!/usr/bin/env node

/**
 * pipeline-greenfield.js
 * BooksVersusMovies.com — greenfield review orchestrator
 *
 * Runs the complete greenfield pipeline for one or all slugs:
 *   1. Generate  — pipeline-generate.js (Stage 1 + Stage 2)
 *   2. Titles    — pipeline-revise.js --pass titles
 *   3. Conversion — pipeline-revise.js --pass conversion
 *   4. Render    — pipeline-render.js
 *
 * Captures all output and errors into a single unified log file.
 * Stops at first failure per slug and reports clearly what went wrong.
 * Retries the titles pass once if the title comes back too long.
 *
 * Usage:
 *   node scripts/pipeline-greenfield.js --slug jaws
 *   node scripts/pipeline-greenfield.js --all
 *   node scripts/pipeline-greenfield.js --slug jaws --force
 *   node scripts/pipeline-greenfield.js --slug jaws --dry
 *
 * Options:
 *   --slug    Process a single slug
 *   --all     Process all inputs in data/greenfield/inputs/
 *   --force   Re-run even if output already exists
 *   --dry     Validate inputs only, no API calls
 *   --skip-generate   Skip generate step (use existing stage2 JSON)
 *   --skip-render     Skip render step
 *
 * Destination: scripts/pipeline-greenfield.js
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const { execSync, spawnSync } = require('child_process');

// ── Args ──────────────────────────────────────────────────────────────────────

const args         = process.argv.slice(2);
const get          = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag      = flag => args.includes(flag);

const SLUG_ARG     = get('--slug', null);
const ALL          = hasFlag('--all');
const FORCE        = hasFlag('--force');
const DRY          = hasFlag('--dry');
const SKIP_GEN     = hasFlag('--skip-generate');
const SKIP_RENDER  = hasFlag('--skip-render');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..');
const SCRIPTS     = path.join(ROOT, 'scripts');
const INPUTS_DIR  = path.join(ROOT, 'data', 'greenfield', 'inputs');
const REVISED_DIR = path.join(ROOT, 'pipeline', '2-revised');
const LOGS_DIR    = path.join(ROOT, 'logs');

// ── Logger ────────────────────────────────────────────────────────────────────

function createLog(slug) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

  const now      = new Date();
  const datePart = now.toISOString().split('T')[0];
  const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const logFile  = path.join(LOGS_DIR, `${datePart}_${timePart}_greenfield-${slug}.log`);
  const stream   = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });

  stream.write(`${'='.repeat(60)}\n`);
  stream.write(`Greenfield Pipeline: ${slug}\n`);
  stream.write(`Started: ${now.toISOString()}\n`);
  stream.write(`${'='.repeat(60)}\n\n`);

  const log = {
    write: (msg) => {
      stream.write(msg + '\n');
      process.stdout.write(msg + '\n');
    },
    section: (label) => {
      const line = `\n── ${label} ${'─'.repeat(Math.max(0, 45 - label.length))}`;
      stream.write(line + '\n');
      process.stdout.write(line + '\n');
    },
    close: () => {
      const footer = `\n${'='.repeat(60)}\nFinished: ${new Date().toISOString()}\nLog: ${logFile}\n${'='.repeat(60)}\n`;
      stream.write(footer);
      stream.end();
      console.log(`\n✓ Log → ${logFile}`);
    },
    path: logFile,
  };

  return log;
}

// ── Run a script and capture output ───────────────────────────────────────────

function runScript(scriptPath, scriptArgs, log) {
  const cmd = `node "${scriptPath}" ${scriptArgs.join(' ')}`;
  log.write(`\n$ ${cmd}`);

  // Use spawnSync with pipe so we can both show AND log output
  const result = spawnSync('node', [scriptPath, ...scriptArgs], {
    cwd:      ROOT,
    encoding: 'utf8',
    timeout:  180000,
    stdio:    ['inherit', 'pipe', 'pipe'],
  });

  // Stream stdout to console and log
  if (result.stdout) {
    result.stdout.split('\n').forEach(line => {
      if (line.trim()) {
        process.stdout.write(line + '\n');
        log.write(line);
      }
    });
  }

  // Stream stderr to console and log
  if (result.stderr) {
    result.stderr.split('\n').forEach(line => {
      if (line.trim()) {
        process.stderr.write(line + '\n');
        log.write(`[stderr] ${line}`);
      }
    });
  }

  if (result.error) {
    const msg = `Process error: ${result.error.message}`;
    log.write(`  ✗ ${msg}`);
    process.stderr.write(`  ✗ ${msg}\n`);
    return false;
  }

  if (result.status !== 0) {
    const msg = `Exit code: ${result.status}`;
    log.write(`  ✗ ${msg}`);
    process.stderr.write(`  ✗ ${msg}\n`);
    return false;
  }

  return true;
}

// ── Check if a field is populated in revised JSON ────────────────────────────

function checkField(slug, field) {
  const jsonPath = path.join(REVISED_DIR, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) return false;
  try {
    const r = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const val = r[field];
    if (val === null || val === undefined) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  } catch { return false; }
}

// ── Get all slugs to process ──────────────────────────────────────────────────

function getSlugs() {
  if (SLUG_ARG) return [SLUG_ARG];
  if (ALL) {
    return fs.readdirSync(INPUTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();
  }
  console.error('✗ Specify --slug <slug> or --all');
  process.exit(1);
}


// ── Auto-fix title if too long ────────────────────────────────────────────────

function fixTitleIfNeeded(slug, log) {
  const jsonPath = path.join(REVISED_DIR, `${slug}.json`);
  if (!fs.existsSync(jsonPath)) return false;

  let record;
  try { record = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
  catch { return false; }

  // If title is fine, nothing to do
  if (record.pageTitle && record.pageTitle.length <= 65) return true;

  // Build fallback: "[Book Title] Book vs Movie"
  const bookTitle = record.bookTitle || slug.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  const fallback  = `${bookTitle} Book vs Movie`;

  if (record.pageTitle) {
    log.write(`  ⚠ Title too long (${record.pageTitle.length} chars) — using fallback`);
  } else {
    log.write(`  ⚠ No title written by pass — using fallback`);
  }
  log.write(`    Fallback: ${fallback} (${fallback.length} chars)`);

  record.pageTitle = fallback;
  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2), 'utf8');
  return true;
}

// ── Process a single slug ─────────────────────────────────────────────────────

async function processSlug(slug) {
  const log = createLog(slug);

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`Greenfield: ${slug}`);
  console.log(`${'═'.repeat(55)}`);

  const inputPath = path.join(INPUTS_DIR, `${slug}.json`);
  if (!fs.existsSync(inputPath)) {
    log.write(`✗ Input not found: ${inputPath}`);
    log.close();
    return { slug, success: false, error: 'Input file not found' };
  }

  // ── Step 1: Generate ────────────────────────────────────────────────────────
  if (!SKIP_GEN) {
    log.section('Step 1: Generate (Stage 1 + Stage 2)');

    const genArgs = ['--slug', slug];
    if (FORCE) genArgs.push('--force');
    if (DRY)   genArgs.push('--dry');

    const genOk = runScript(
      path.join(SCRIPTS, 'pipeline-generate.js'),
      genArgs,
      log
    );

    if (!genOk && !DRY) {
      log.write(`\n✗ Generate step failed for ${slug} — stopping.`);
      log.close();
      return { slug, success: false, error: 'Generate failed' };
    }

    // Verify JSON landed in 2-revised
    if (!DRY && !fs.existsSync(path.join(REVISED_DIR, `${slug}.json`))) {
      log.write(`\n✗ ${slug}.json not found in pipeline/2-revised after generate — stopping.`);
      log.close();
      return { slug, success: false, error: 'Generate output missing' };
    }

    log.write(`  ✓ Generate complete`);
  } else {
    log.write(`  → Skipping generate (--skip-generate)`);
  }

  if (DRY) {
    log.write(`\n[DRY] Stopping after generate validation.`);
    log.close();
    return { slug, success: true, dry: true };
  }

  // ── Step 2: Titles pass ──────────────────────────────────────────────────────
  log.section('Step 2: Titles pass');

  if (!checkField(slug, 'pageTitle')) {
    const titlesOk = runScript(
      path.join(SCRIPTS, 'pipeline-revise.js'),
      ['--pass', 'titles', '--slug', slug, '--force'],
      log
    );

    // Always run fixTitleIfNeeded — handles both missing and too-long titles
    fixTitleIfNeeded(slug, log);

    if (!checkField(slug, 'pageTitle')) {
      log.write(`\n✗ Titles pass failed for ${slug} — could not generate or fix title.`);
      log.close();
      return { slug, success: false, error: 'Titles pass failed' };
    }

    log.write(`  ✓ Titles complete`);
  } else {
    log.write(`  → pageTitle already set — skipping titles pass`);
  }

  // ── Step 3: Conversion pass ──────────────────────────────────────────────────
  log.section('Step 3: Conversion pass (CTA blocks)');

  if (!checkField(slug, 'ctaBlocks')) {
    const convOk = runScript(
      path.join(SCRIPTS, 'pipeline-revise.js'),
      ['--pass', '2', '--slug', slug, '--force'],
      log
    );

    if (!convOk || !checkField(slug, 'ctaBlocks')) {
      log.write(`\n✗ Conversion pass failed for ${slug} — stopping.`);
      log.close();
      return { slug, success: false, error: 'Conversion pass failed' };
    }

    log.write(`  ✓ Conversion complete`);
  } else {
    log.write(`  → ctaBlocks already set — skipping conversion pass`);
  }

  // ── Step 4: Render ────────────────────────────────────────────────────────
  if (!SKIP_RENDER) {
    log.section('Step 4: Render');

    const renderOk = runScript(
      path.join(SCRIPTS, 'pipeline-render.js'),
      ['--slug', slug, '--force'],
      log
    );

    if (!renderOk) {
      log.write(`\n✗ Render failed for ${slug}.`);
      log.close();
      return { slug, success: false, error: 'Render failed' };
    }

    log.write(`  ✓ Render complete`);
  } else {
    log.write(`  → Skipping render (--skip-render)`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  log.section('Complete');
  log.write(`  ✓ ${slug} — all steps passed`);
  log.write(`\nNext steps:`);
  log.write(`  1. Check images/${slug}.jpg exists`);
  log.write(`  2. Open ${slug}.html in browser to review`);
  log.write(`  3. git add . && git commit -m "feat: ${slug} review"`);
  log.write(`  4. node scripts/ops/sitemap-generate.js`);

  log.close();
  return { slug, success: true };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\npipeline-greenfield.js`);
  console.log(`Mode:  ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force: ${FORCE ? 'yes' : 'no'}`);

  const slugs   = getSlugs();
  const results = [];

  for (const slug of slugs) {
    const result = await processSlug(slug);
    results.push(result);
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  if (slugs.length > 1) {
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`FINAL SUMMARY`);
    console.log(`${'═'.repeat(55)}`);

    const passed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    passed.forEach(r => console.log(`  ✓  ${r.slug}`));
    failed.forEach(r => console.log(`  ✗  ${r.slug} — ${r.error}`));

    console.log(`\n  Passed: ${passed.length}`);
    console.log(`  Failed: ${failed.length}`);
  }

  const anyFailed = results.some(r => !r.success);
  if (anyFailed) process.exit(1);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
