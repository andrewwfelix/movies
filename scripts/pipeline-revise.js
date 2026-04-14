#!/usr/bin/env node

/**
 * pipeline-revise.js
 * BooksVersusMovies.com — LLM revision pipeline
 *
 * Runs extracted JSON through revision passes via OpenRouter.
 * Output goes to pipeline/2-revised/.
 *
 * Usage:
 *   node pipeline-revise.js --slug atonement              (Pass 1 only)
 *   node pipeline-revise.js --slug atonement --pass titles (titles only)
 *   node pipeline-revise.js --slug atonement --pass both  (Pass 1 + 2)
 *   node pipeline-revise.js --all                         (all pages, Pass 1)
 *   node pipeline-revise.js --all --pass titles           (all pages, titles)
 *   node pipeline-revise.js --all --pass both             (all pages, Pass 1 + 2)
 *
 * Pass values:
 *   1       — structural overlay (quickAnswer, FAQ cleanup)
 *   titles  — page title + meta description optimisation (Sonnet)
 *   2       — conversion layer (ctaBlocks)
 *   both    — Pass 1 + Pass 2 (no titles)
 *   all     — Pass 1 + titles + Pass 2
 *
 * Options:
 *   --slug                    Process a single page by slug
 *   --all                     Process all files in pipeline/1-extracted/
 *   --pass                    1 | titles | 2 | both | all  (default: 1)
 *   --force                   Overwrite existing files in pipeline/2-revised/
 *   --dry                     Dry run — print what would happen without calling the API
 *   --delay                   Milliseconds between API calls (default: 500)
 *   --quality-check-interval  Run quality gate every N pages, hard-stop on failure (default: off)
 *
 * Environment (.env in project root):
 *   OPENROUTER_API_KEY   Required.
 *
 * Models: configured in config/models.json
 * Destination: scripts/pipeline-revise.js
 */

const fs               = require('fs');
const path             = require('path');
const https            = require('https');
const { createLogger } = require('./logger');
const { checkRecord }  = require('./quality-gate');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SINGLE_SLUG      = get('--slug', null);
const RUN_ALL          = hasFlag('--all');
const PASS             = get('--pass', '1');
const FORCE            = hasFlag('--force');
const DRY_RUN          = hasFlag('--dry');
const DELAY_MS         = parseInt(get('--delay', '500'), 10);
const QUALITY_INTERVAL = parseInt(get('--quality-check-interval', '0'), 10);

const EXTRACTED_DIR = path.resolve(__dirname, '../pipeline/1-extracted');
const REVISED_DIR   = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_DIR       = REVISED_DIR;

// Derived pass flags
const RUN_PASS1   = ['1', 'both', 'all'].includes(PASS);
const RUN_TITLES  = ['titles', 'all'].includes(PASS);
const RUN_PASS2   = ['2', 'both', 'all'].includes(PASS);

// Input directory: Pass 1 reads from 1-extracted; all other passes read
// from 2-revised to pick up Pass 1 output.
const IN_DIR = RUN_PASS1 ? EXTRACTED_DIR : REVISED_DIR;
const PROMPTS_DIR = path.resolve(__dirname, './prompts');
const CONFIG_PATH = path.resolve(__dirname, '../config/models.json');

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const API_KEY = process.env.OPENROUTER_API_KEY;

// ── Load model config ─────────────────────────────────────────────────────────

function loadModelConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Model config not found: ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// ── Prompt loader ─────────────────────────────────────────────────────────────

function loadPrompt(filename) {
  const promptPath = path.join(PROMPTS_DIR, filename);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf8').trim();
}

// ── OpenRouter API call ───────────────────────────────────────────────────────
// Includes retry logic with exponential backoff for transient errors.
// MAX_RETRIES attempts, starting at RETRY_BASE_MS delay, doubling each time.

const MAX_RETRIES    = 3;
const RETRY_BASE_MS  = 10000; // 10 seconds — enough for brief connectivity drops

function callOpenRouterOnce(model, systemPrompt, userContent, maxTokens, temperature) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens:  maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
    });

    const options = {
      hostname: 'openrouter.ai',
      path:     '/api/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   'https://booksversusmovies.com',
        'X-Title':        'BooksVersusMovies Pipeline',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const SOCKET_TIMEOUT_MS = 90000; // 90 seconds — abort if no response by then

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`OpenRouter error: ${parsed.error.message}`));
            return;
          }
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) {
            reject(new Error(`Empty response: ${JSON.stringify(parsed)}`));
            return;
          }
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\nRaw: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(SOCKET_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${SOCKET_TIMEOUT_MS / 1000}s`));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callOpenRouter(model, systemPrompt, userContent, maxTokens, temperature) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOpenRouterOnce(model, systemPrompt, userContent, maxTokens, temperature);
    } catch (err) {
      lastError = err;
      // Don't retry on auth errors or bad request errors — they won't recover
      const msg = err.message.toLowerCase();
      if (msg.includes('user not found') || msg.includes('invalid api key') ||
          msg.includes('401') || msg.includes('400')) {
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        console.log(`  ↻  Attempt ${attempt} failed (${err.message.slice(0, 60)}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
}

// ── JSON response parser ──────────────────────────────────────────────────────

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// ── Build titles payload ──────────────────────────────────────────────────────
// Sends only the fields needed for title generation — keeps token count low
// and avoids truncation errors on longer pages.

function buildTitlesPayload(record) {
  return JSON.stringify({
    // ── TITLE ANCHOR — BUILD YOUR TITLE FROM THIS LINE ──────────────────────
    // This is the sharpest distillation of what makes this comparison unique.
    // Your title must transform this insight into something emotionally felt.
    TITLE_ANCHOR: record.quickAnswer?.oneLineReason || null,
    // ────────────────────────────────────────────────────────────────────────
    slug:         record.slug,
    bookTitle:    record.bookTitle,
    author:       record.author,
    genre:        record.genre,
    mediaType:    record.mediaType,
    mediaLabel:   record.mediaLabel,
    filmYear:     record.filmYear,
    bookYear:     record.bookYear,
    director:     record.director,
    verdictText:  record.verdictText,
    verdictClass: record.verdictClass,
    reviewBody:   record.reviewBody,
    currentPageTitle: record.pageTitle,
    currentMetaDesc:  record.metaDesc,
    quickAnswer:  record.quickAnswer,
  }, null, 2);
}

// ── Validate titles response ──────────────────────────────────────────────────

function validateTitles(pageTitle, metaDesc) {
  const errors  = [];
  const warnings = [];
  if (!pageTitle)                    errors.push('pageTitle missing');
  if (pageTitle?.length > 75)        errors.push(`pageTitle too long: ${pageTitle.length} chars — will not write`);
  else if (pageTitle?.length > 65)   warnings.push(`pageTitle slightly long: ${pageTitle.length} chars (target 65)`);
  if (!metaDesc)                     errors.push('metaDesc missing');
  if (metaDesc?.length > 155)        errors.push(`metaDesc too long: ${metaDesc.length} chars (max 155) — not written`);
  return { errors, warnings };
}

// ── Validate revision ─────────────────────────────────────────────────────────

function validateRevision(original, revised, pass) {
  const errors = [];

  const immutable = [
    'slug', 'filename', 'pipelineVersion', 'bookTitle', 'author',
    'bookYear', 'filmYear', 'affiliateLink', 'youtubeId',
    'verdictText', 'verdictClass', 'storyBrief', 'verdictBox',
    'relatedSectionTitle',
  ];

  for (const field of immutable) {
    if (original[field] !== revised[field]) {
      errors.push(`immutable field changed: ${field}`);
    }
  }

  if (pass === '1') {
    if (!revised.quickAnswer) {
      errors.push('quickAnswer is still null after Pass 1');
    } else {
      if (!revised.quickAnswer.winner)        errors.push('quickAnswer.winner missing');
      if (!revised.quickAnswer.readFirst)     errors.push('quickAnswer.readFirst missing');
      if (!revised.quickAnswer.oneLineReason) errors.push('quickAnswer.oneLineReason missing');
      const wordCount = (revised.quickAnswer.oneLineReason || '').split(' ').length;
      if (wordCount > 15) errors.push(`quickAnswer.oneLineReason too long (${wordCount} words)`);
    }
    if (JSON.stringify(original.differences) !== JSON.stringify(revised.differences)) {
      errors.push('differences array was modified — must not change in Pass 1');
    }
    if (JSON.stringify(original.readFirst) !== JSON.stringify(revised.readFirst)) {
      errors.push('readFirst was modified — must not change in Pass 1');
    }
  }

  if (pass === '2') {
    if (!revised.ctaBlocks || revised.ctaBlocks.length === 0) {
      errors.push('ctaBlocks is still null/empty after Pass 2');
    } else {
      for (const cta of revised.ctaBlocks) {
        if (!cta.location) errors.push('ctaBlock missing location');
        if (!cta.text)     errors.push('ctaBlock missing text');
        if (!cta.href)     errors.push('ctaBlock missing href');
      }
    }
  }

  return errors;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ── Process single file ───────────────────────────────────────────────────────

async function processFile(slug, modelConfig, prompts, log, titlesReview) {
  const inPath  = path.join(IN_DIR,  `${slug}.json`);
  const outPath = path.join(OUT_DIR, `${slug}.json`);

  if (!fs.existsSync(inPath)) {
    log.error(slug, `source file not found: ${inPath}`);
    return { success: false, slug };
  }

  if (!FORCE && fs.existsSync(outPath)) {
    // Smart skip — check whether the required fields for the requested pass
    // are already populated. If not, process even without --force.
    let needsProcessing = false;
    try {
      const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      if (RUN_PASS1  && !existing.quickAnswer)                              needsProcessing = true;
      if (RUN_TITLES && (!existing.pageTitle || existing.pageTitle.length < 10)) needsProcessing = true;
      if (RUN_PASS2  && (!existing.ctaBlocks || existing.ctaBlocks.length === 0)) needsProcessing = true;
    } catch {
      needsProcessing = true; // Can't parse — reprocess
    }

    if (!needsProcessing) {
      log.skip(`${slug}.json`, 'already exists in 2-revised');
      return { success: true, slug, skipped: true };
    }
    // Fall through — file exists but is missing required fields
    log.info(`${slug}.json — re-processing (missing required fields for pass: ${PASS})`);
  }

  const original = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  let current    = JSON.parse(JSON.stringify(original));

  // ── Pass 1 ───────────────────────────────────────────────────────────────────
  if (RUN_PASS1) {
    if (DRY_RUN) {
      log.info(`[DRY] Would run Pass 1 on ${slug} using ${modelConfig.pass1.model}`);
    } else {
      log.info(`  ↻  ${slug} — Pass 1 (${modelConfig.pass1.model})…`);
      try {
        const raw     = await callOpenRouter(
          modelConfig.pass1.model, prompts.pass1,
          JSON.stringify(current, null, 2),
          modelConfig.pass1.maxTokens, modelConfig.pass1.temperature,
        );
        const revised = parseJsonResponse(raw);
        const errors  = validateRevision(original, revised, '1');

        if (errors.length > 0) {
          log.warn(`${slug}.json`, `Pass 1 validation: ${errors.join(' | ')}`);
        } else {
          const qa = revised.quickAnswer;
          log.pass(`${slug}.json`, `Pass 1 — winner: "${qa.winner}" · readFirst: "${qa.readFirst}" · reason: "${qa.oneLineReason}"`);
        }
        current = revised;
      } catch (err) {
        log.error(`${slug}.json`, `Pass 1 failed: ${err.message}`);
        return { success: false, slug, error: err.message };
      }
    }
  }

  // ── Titles pass ───────────────────────────────────────────────────────────────
  if (RUN_TITLES) {
    if (!prompts.titles) {
      log.warn(`${slug}.json`, 'Titles pass requested but pass1b-titles.txt not found — skipping');
    } else if (DRY_RUN) {
      log.info(`[DRY] Would run titles pass on ${slug} using ${modelConfig.titles.model}`);
    } else {
      log.info(`  ↻  ${slug} — titles (${modelConfig.titles.model})…`);
      try {
        const payload = buildTitlesPayload(current);
        const raw     = await callOpenRouter(
          modelConfig.titles.model, prompts.titles,
          payload,
          modelConfig.titles.maxTokens, modelConfig.titles.temperature,
        );
        const result      = parseJsonResponse(raw);
        const { errors, warnings } = validateTitles(result.pageTitle, result.metaDesc);

        if (errors.length > 0) {
          // Hard failure — do not write
          log.warn(`${slug}.json`, `Titles validation failed — not written: ${errors.join(' | ')}`);
        } else {
          const oldTitle = current.pageTitle;
          const oldMeta  = current.metaDesc;
          current.pageTitle = result.pageTitle;
          current.metaDesc  = result.metaDesc;
          if (warnings.length > 0) {
            log.warn(`${slug}.json`, `Titles written with warnings: ${warnings.join(' | ')}`);
          } else {
            log.pass(`${slug}.json`, `Titles complete`);
          }
          log.info(`  BEFORE title (${oldTitle?.length || 0} chars): ${oldTitle}`);
          log.info(`  AFTER  title (${result.pageTitle.length} chars): ${result.pageTitle}`);
          log.info(`  BEFORE meta  (${oldMeta?.length || 0} chars): ${oldMeta}`);
          log.info(`  AFTER  meta  (${result.metaDesc.length} chars): ${result.metaDesc}`);
        }
      } catch (err) {
        log.error(`${slug}.json`, `Titles pass failed: ${err.message}`);
        // Non-fatal — continue with existing title
      }
    }
  }

  // ── Pass 2 ───────────────────────────────────────────────────────────────────
  if (RUN_PASS2) {
    if (!prompts.pass2) {
      log.warn(`${slug}.json`, 'Pass 2 requested but pass2-conversion.txt not found — skipping');
    } else if (DRY_RUN) {
      log.info(`[DRY] Would run Pass 2 on ${slug} using ${modelConfig.pass2.model}`);
    } else {
      log.info(`  ↻  ${slug} — Pass 2 (${modelConfig.pass2.model})…`);
      try {
        const raw     = await callOpenRouter(
          modelConfig.pass2.model, prompts.pass2,
          JSON.stringify(current, null, 2),
          modelConfig.pass2.maxTokens, modelConfig.pass2.temperature,
        );
        const revised = parseJsonResponse(raw);
        const errors  = validateRevision(original, revised, '2');

        if (errors.length > 0) {
          log.warn(`${slug}.json`, `Pass 2 validation: ${errors.join(' | ')}`);
        } else {
          log.pass(`${slug}.json`, `Pass 2 — ${revised.ctaBlocks?.length || 0} CTA blocks added`);
        }
        current = revised;
      } catch (err) {
        log.error(`${slug}.json`, `Pass 2 failed: ${err.message}`);
        return { success: false, slug, error: err.message };
      }
    }
  }

  // ── Write output ──────────────────────────────────────────────────────────────
  if (!DRY_RUN) {
    fs.writeFileSync(outPath, JSON.stringify(current, null, 2), 'utf8');
  }

  return { success: true, slug, record: current };
}

// ── Checkpoint ────────────────────────────────────────────────────────────────

function runCheckpoint(results, log) {
  const successful = results.filter(r => r.success && !r.skipped);
  const records    = successful.map(r => r.record).filter(Boolean);

  if (records.length === 0) {
    log.info('No records to checkpoint');
    return;
  }

  const checks = [];

  if (RUN_PASS1) {
    checks.push(
      {
        name:   'All revised pages have quickAnswer',
        passed: records.every(r => r.quickAnswer !== null),
        detail: records.filter(r => !r.quickAnswer).map(r => r.slug).join(', '),
      },
      {
        name:   'All quickAnswer.winner values are valid',
        passed: records.every(r => ['Book','Film','Series','Too Close to Call'].includes(r.quickAnswer?.winner)),
        detail: records.filter(r => !['Book','Film','Series','Too Close to Call'].includes(r.quickAnswer?.winner))
          .map(r => `${r.slug}: "${r.quickAnswer?.winner}"`).join(', '),
      },
      {
        name:   'All quickAnswer.oneLineReason under 15 words',
        passed: records.every(r => (r.quickAnswer?.oneLineReason || '').split(' ').length <= 15),
        detail: records.filter(r => (r.quickAnswer?.oneLineReason || '').split(' ').length > 15)
          .map(r => `${r.slug}: "${r.quickAnswer?.oneLineReason}"`).join(', '),
      },
    );
  }

  if (RUN_TITLES) {
    checks.push(
      {
        name:   'All pages have pageTitle under 75 chars',
        passed: records.every(r => r.pageTitle && r.pageTitle.length <= 75),
        detail: records.filter(r => !r.pageTitle || r.pageTitle.length > 75)
          .map(r => `${r.slug} (${r.pageTitle?.length})`).join(', '),
      },
      {
        name:   'All pages have pageTitle at target 65 chars or under',
        passed: records.every(r => r.pageTitle && r.pageTitle.length <= 65),
        detail: records.filter(r => !r.pageTitle || r.pageTitle.length > 65)
          .map(r => `${r.slug} (${r.pageTitle?.length})`).join(', '),
      },
      {
        name:   'All pages have metaDesc under 160 chars',
        passed: records.every(r => r.metaDesc && r.metaDesc.length <= 160),
        detail: records.filter(r => !r.metaDesc || r.metaDesc.length > 160)
          .map(r => `${r.slug} (${r.metaDesc?.length})`).join(', '),
      },
    );
  }

  if (RUN_PASS2) {
    checks.push({
      name:   'All revised pages have ctaBlocks',
      passed: records.every(r => r.ctaBlocks && r.ctaBlocks.length > 0),
      detail: records.filter(r => !r.ctaBlocks || r.ctaBlocks.length === 0)
        .map(r => r.slug).join(', '),
    });
  }

  checks.push({
    name:   'No immutable fields changed',
    passed: results.filter(r => r.immutableChanged).length === 0,
    detail: results.filter(r => r.immutableChanged).map(r => r.slug).join(', '),
  });

  const allPassed = checks.every(c => c.passed);
  log.checkpoint(allPassed ? 'PASSED' : 'FAILED', checks);
  return allPassed;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const log = createLogger('pipeline-revise');

  if (!DRY_RUN && !API_KEY) {
    log.error('pipeline-revise.js', 'OPENROUTER_API_KEY not set — add it to .env');
    log.close();
    process.exit(1);
  }

  if (!SINGLE_SLUG && !RUN_ALL) {
    log.error('pipeline-revise.js', 'Specify --slug <slug> or --all');
    log.close();
    process.exit(1);
  }

  // Load model config
  let modelConfig;
  try {
    modelConfig = loadModelConfig();
    log.info(`Model config loaded from config/models.json`);
    if (RUN_PASS1)  log.info(`Pass 1 model:  ${modelConfig.pass1.model} (temp: ${modelConfig.pass1.temperature})`);
    if (RUN_TITLES) log.info(`Titles model:  ${modelConfig.titles.model} (temp: ${modelConfig.titles.temperature})`);
    if (RUN_PASS2)  log.info(`Pass 2 model:  ${modelConfig.pass2.model} (temp: ${modelConfig.pass2.temperature})`);
  } catch (e) {
    log.error('pipeline-revise.js', e.message);
    log.close();
    process.exit(1);
  }

  // Load prompts
  const prompts = {};

  if (RUN_PASS1) {
    try {
      prompts.pass1 = loadPrompt('pass1-structural.txt');
      log.info(`Loaded pass1-structural.txt (${prompts.pass1.length} chars)`);
    } catch (e) {
      log.error('pipeline-revise.js', e.message);
      log.close();
      process.exit(1);
    }
  }

  if (RUN_TITLES) {
    try {
      prompts.titles = loadPrompt('pass1b-titles.txt');
      log.info(`Loaded pass1b-titles.txt (${prompts.titles.length} chars)`);
    } catch {
      log.warn('pipeline-revise.js', 'pass1b-titles.txt not found — titles pass will be skipped');
    }
  }

  if (RUN_PASS2) {
    try {
      prompts.pass2 = loadPrompt('pass2-conversion.txt');
      log.info(`Loaded pass2-conversion.txt (${prompts.pass2.length} chars)`);
    } catch {
      log.warn('pipeline-revise.js', 'pass2-conversion.txt not found — Pass 2 will be skipped');
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    log.info(`Created output directory: ${OUT_DIR}`);
  }

  // Determine files
  let slugs = [];
  if (SINGLE_SLUG) {
    slugs = [SINGLE_SLUG];
  } else {
    if (!fs.existsSync(IN_DIR)) {
      log.error('pipeline-revise.js', `Input directory not found: ${IN_DIR}`);
      log.close();
      process.exit(1);
    }
    slugs = fs.readdirSync(IN_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort();
  }

  log.info(`pipeline-revise.js`);
  log.info(`Pass:    ${PASS}`);
  log.info(`Files:   ${slugs.length}`);
  log.info(`Force:   ${FORCE ? 'yes' : 'no'}`);
  log.info(`Dry run: ${DRY_RUN ? 'yes' : 'no'}`);
  if (DELAY_MS > 0 && !DRY_RUN) log.info(`Delay:   ${DELAY_MS}ms between calls`);

  log.section('Processing');

  const results      = [];
  const titlesReview = [];
  let succeeded = 0;
  let skipped   = 0;
  let failed    = 0;

  for (let i = 0; i < slugs.length; i++) {
    const result = await processFile(slugs[i], modelConfig, prompts, log, titlesReview);
    results.push(result);

    if (result.skipped)      skipped++;
    else if (result.success) succeeded++;
    else                     failed++;

    if (!DRY_RUN && DELAY_MS > 0 && i < slugs.length - 1) {
      await sleep(DELAY_MS);
    }

    // ── Periodic quality gate ─────────────────────────────────────────────────
    if (!DRY_RUN && QUALITY_INTERVAL > 0 && (i + 1) % QUALITY_INTERVAL === 0) {
      log.section(`Quality gate — pages ${i + 2 - QUALITY_INTERVAL} to ${i + 1}`);
      const recentSlugs = slugs.slice(Math.max(0, i + 1 - QUALITY_INTERVAL), i + 1);
      let gateFailed = false;

      for (const s of recentSlugs) {
        const revPath  = path.join(OUT_DIR, `${s}.json`);
        const origPath = path.join(EXTRACTED_DIR, `${s}.json`);
        if (!fs.existsSync(revPath)) continue;
        try {
          const record   = JSON.parse(fs.readFileSync(revPath, 'utf8'));
          const original = fs.existsSync(origPath)
            ? JSON.parse(fs.readFileSync(origPath, 'utf8')) : null;
          const { failures, warnings } = checkRecord(record, original);
          if (failures.length > 0) {
            log.error(`${s}.json`, `Quality gate: ${failures.join(' | ')}`);
            gateFailed = true;
          } else if (warnings.length > 0) {
            log.warn(`${s}.json`, `Quality gate warnings: ${warnings.join(' | ')}`);
          } else {
            log.pass(`${s}.json`, 'Quality gate passed');
          }
        } catch (e) {
          log.error(`${s}.json`, `Quality gate parse error: ${e.message}`);
          gateFailed = true;
        }
      }

      if (gateFailed) {
        log.error('pipeline-revise.js', `Quality gate FAILED at page ${i + 1} — stopping batch. Fix issues and re-run.`);
        log.close();
        process.exit(1);
      } else {
        log.info(`Quality gate passed for pages ${i + 2 - QUALITY_INTERVAL}-${i + 1}`);
      }
    }
  }

  log.summary({
    'Total:':     slugs.length,
    'Succeeded:': succeeded,
    'Skipped:':   skipped,
    'Failed:':    failed,
    'Pass:':      PASS,
    'Dry run:':   DRY_RUN ? 'yes' : 'no',
  });

  // Write titles review file
  if (!DRY_RUN && RUN_TITLES && titlesReview.length > 0) {
    const reviewDate = new Date().toISOString().split('T')[0];
    const reviewPath = path.resolve(__dirname, `../logs/titles-review-${reviewDate}.txt`);
    const lines = [
      `BooksVersusMovies.com — Titles Review`,
      `Generated: ${new Date().toISOString()}`,
      `Pages: ${titlesReview.length}`,
      '='.repeat(60),
      '',
    ];
    for (const entry of titlesReview) {
      lines.push(`${entry.slug}  [${entry.status}]`);
      if (entry.anchor) {
        lines.push(`  ANCHOR: ${entry.anchor}`);
      }
      lines.push(`  BEFORE title (${entry.before.title?.length || 0}): ${entry.before.title}`);
      lines.push(`  AFTER  title (${entry.after.title?.length  || 0}): ${entry.after.title}`);
      lines.push(`  BEFORE meta  (${entry.before.meta?.length  || 0}): ${entry.before.meta}`);
      lines.push(`  AFTER  meta  (${entry.after.meta?.length   || 0}): ${entry.after.meta}`);
      if (entry.warnings?.length > 0) {
        lines.push(`  WARNINGS: ${entry.warnings.join(' | ')}`);
      }
      if (entry.reason) {
        lines.push(`  FAILED: ${entry.reason}`);
      }
      lines.push('');
    }
    fs.writeFileSync(reviewPath, lines.join('\n'), 'utf8');
    console.log(`\n✓ Titles review → ${reviewPath}`);
  }

  if (!DRY_RUN && results.length > 1) {
    runCheckpoint(results, log);
  } else if (!DRY_RUN && results.length === 1) {
    log.info('Single file mode — skipping full checkpoint');
    const r = results[0];
    if (r.success && r.record) {
      if (r.record.quickAnswer) {
        log.info(`quickAnswer.winner:        ${r.record.quickAnswer.winner}`);
        log.info(`quickAnswer.readFirst:     ${r.record.quickAnswer.readFirst}`);
        log.info(`quickAnswer.oneLineReason: ${r.record.quickAnswer.oneLineReason}`);
      }
      if (RUN_TITLES) {
        const src = JSON.parse(fs.readFileSync(path.join(IN_DIR, `${r.slug}.json`), 'utf8'));
        log.info(`BEFORE title (${src.pageTitle?.length || 0} chars): ${src.pageTitle}`);
        log.info(`AFTER  title (${r.record.pageTitle?.length} chars): ${r.record.pageTitle}`);
        log.info(`BEFORE meta  (${src.metaDesc?.length || 0} chars): ${src.metaDesc}`);
        log.info(`AFTER  meta  (${r.record.metaDesc?.length} chars): ${r.record.metaDesc}`);
      }
    }
  }

  log.close();

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
