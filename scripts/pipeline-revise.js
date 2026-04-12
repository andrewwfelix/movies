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
 *   --slug    Process a single page by slug
 *   --all     Process all files in pipeline/1-extracted/
 *   --pass    1 | titles | 2 | both | all  (default: 1)
 *   --force   Overwrite existing files in pipeline/2-revised/
 *   --dry     Dry run — print what would happen without calling the API
 *   --delay   Milliseconds between API calls (default: 500)
 *
 * Environment (.env in project root):
 *   OPENROUTER_API_KEY   Required.
 *
 * Models: configured in config/models.json
 */

const fs               = require('fs');
const path             = require('path');
const https            = require('https');
const { createLogger } = require('./logger');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SINGLE_SLUG = get('--slug', null);
const RUN_ALL     = hasFlag('--all');
const PASS        = get('--pass', '1');
const FORCE       = hasFlag('--force');
const DRY_RUN     = hasFlag('--dry');
const DELAY_MS    = parseInt(get('--delay', '500'), 10);

// Derived pass flags
const RUN_PASS1   = ['1', 'both', 'all'].includes(PASS);
const RUN_TITLES  = ['titles', 'all'].includes(PASS);
const RUN_PASS2   = ['2', 'both', 'all'].includes(PASS);

const IN_DIR      = path.resolve(__dirname, '../pipeline/1-extracted');
const OUT_DIR     = path.resolve(__dirname, '../pipeline/2-revised');
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

function callOpenRouter(model, systemPrompt, userContent, maxTokens, temperature) {
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

    req.on('error', reject);
    req.write(body);
    req.end();
  });
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
  const errors = [];
  if (!pageTitle)                   errors.push('pageTitle missing');
  if (pageTitle?.length > 70)       errors.push(`pageTitle too long: ${pageTitle.length} chars`);
  if (!metaDesc)                    errors.push('metaDesc missing');
  if (metaDesc?.length > 160)       errors.push(`metaDesc too long: ${metaDesc.length} chars`);
  return errors;
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

async function processFile(slug, modelConfig, prompts, log) {
  const inPath  = path.join(IN_DIR,  `${slug}.json`);
  const outPath = path.join(OUT_DIR, `${slug}.json`);

  if (!fs.existsSync(inPath)) {
    log.error(slug, `source file not found: ${inPath}`);
    return { success: false, slug };
  }

  if (!FORCE && fs.existsSync(outPath)) {
    log.skip(`${slug}.json`, 'already exists in 2-revised');
    return { success: true, slug, skipped: true };
  }

  const original = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  let current    = JSON.parse(JSON.stringify(original));

  // ── Pass 1 ───────────────────────────────────────────────────────────────────
  if (RUN_PASS1) {
    if (DRY_RUN) {
      log.info(`[DRY] Would run Pass 1 on ${slug} using ${modelConfig.pass1.model}`);
    } else {
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
      try {
        const payload = buildTitlesPayload(current);
        const raw     = await callOpenRouter(
          modelConfig.titles.model, prompts.titles,
          payload,
          modelConfig.titles.maxTokens, modelConfig.titles.temperature,
        );
        const result  = parseJsonResponse(raw);
        const errors  = validateTitles(result.pageTitle, result.metaDesc);

        if (errors.length > 0) {
          log.warn(`${slug}.json`, `Titles validation: ${errors.join(' | ')}`);
        } else {
          current.pageTitle = result.pageTitle;
          current.metaDesc  = result.metaDesc;
          log.pass(`${slug}.json`, `Titles — "${result.pageTitle}" (${result.pageTitle.length} chars)`);
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
        name:   'All pages have pageTitle under 70 chars',
        passed: records.every(r => r.pageTitle && r.pageTitle.length <= 70),
        detail: records.filter(r => !r.pageTitle || r.pageTitle.length > 70)
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

  const results = [];
  let succeeded = 0;
  let skipped   = 0;
  let failed    = 0;

  for (let i = 0; i < slugs.length; i++) {
    const result = await processFile(slugs[i], modelConfig, prompts, log);
    results.push(result);

    if (result.skipped)      skipped++;
    else if (result.success) succeeded++;
    else                     failed++;

    if (!DRY_RUN && DELAY_MS > 0 && i < slugs.length - 1) {
      await sleep(DELAY_MS);
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
        log.info(`pageTitle (${r.record.pageTitle?.length} chars): ${r.record.pageTitle}`);
        log.info(`metaDesc  (${r.record.metaDesc?.length} chars): ${r.record.metaDesc}`);
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
