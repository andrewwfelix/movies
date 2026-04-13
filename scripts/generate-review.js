#!/usr/bin/env node

/**
 * generate-review.js
 * BooksVersusMovies.com — end-to-end greenfield review generator
 *
 * Orchestrates the full happy path for a new review:
 *   1. Validate input file
 *   2. Check book cover image exists
 *   3. Stage 1 — factual extraction (Haiku)
 *   4. Pause for Stage 1 review (skippable with --no-review)
 *   5. Stage 2 — full review generation (Sonnet/Haiku)
 *   6. Titles pass (Sonnet)
 *   7. Pass 2 — CTA blocks (Haiku)
 *   8. Schema validation
 *   9. Render
 *  10. Copy HTML to project root
 *
 * Usage:
 *   node scripts/generate-review.js --slug the-godfather
 *   node scripts/generate-review.js --slug the-godfather --no-review
 *   node scripts/generate-review.js --slug the-godfather --dry
 *   node scripts/generate-review.js --slug the-godfather --force
 *
 * Options:
 *   --slug        Required. Slug of the review to generate.
 *   --no-review   Skip the Stage 1 human review pause.
 *   --dry         Validate inputs and image only, no API calls.
 *   --force       Re-run all steps even if output already exists.
 *
 * Prerequisites:
 *   - data/greenfield/inputs/<slug>.json must exist
 *   - images/<slug>.jpg must exist
 */

const fs      = require('fs');
const path    = require('path');
const https   = require('https');
const readline = require('readline');
const { jsonrepair } = require('jsonrepair');
const { validateRecord } = require('./validate-json-schema');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SLUG       = get('--slug', null);
const NO_REVIEW  = hasFlag('--no-review');
const DRY_RUN    = hasFlag('--dry');
const FORCE      = hasFlag('--force');

if (!SLUG) {
  console.error('✗ --slug required. Usage: node scripts/generate-review.js --slug the-godfather');
  process.exit(1);
}

const ROOT         = path.resolve(__dirname, '..');
const INPUTS_DIR   = path.join(ROOT, 'data', 'greenfield', 'inputs');
const STAGE1_DIR   = path.join(ROOT, 'data', 'greenfield', 'stage1');
const STAGE2_DIR   = path.join(ROOT, 'data', 'greenfield', 'stage2');
const REVISED_DIR  = path.join(ROOT, 'pipeline', '2-revised');
const RENDERED_DIR = path.join(ROOT, 'pipeline', '3-rendered');
const IMAGES_DIR   = path.join(ROOT, 'images');
const PROMPT1_PATH = path.join(ROOT, 'scripts', 'prompts', 'greenfield-stage1.txt');
const PROMPT2_PATH = path.join(ROOT, 'scripts', 'prompts', 'greenfield-stage2.txt');
const PASS2_PATH   = path.join(ROOT, 'scripts', 'prompts', 'pass2-conversion.txt');
const TITLES_PATH  = path.join(ROOT, 'scripts', 'prompts', 'pass1b-titles.txt');
const MODELS_PATH  = path.join(ROOT, 'config', 'models.json');
const TODAY        = new Date().toISOString().split('T')[0];

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY = process.env.OPENROUTER_API_KEY;

// ── Logger ────────────────────────────────────────────────────────────────────

const STEPS = {
  current: 0,
  total: 10,
};

function step(n, label) {
  STEPS.current = n;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Step ${n}/${STEPS.total} — ${label}`);
  console.log(`${'─'.repeat(60)}`);
}

function log(msg)    { console.log(`  ${msg}`); }
function ok(msg)     { console.log(`  ✓  ${msg}`); }
function warn(msg)   { console.log(`  ⚠  ${msg}`); }
function fail(msg)   { console.error(`  ✗  ${msg}`); }
function info(msg)   { console.log(`  →  ${msg}`); }

function abort(msg) {
  fail(msg);
  console.log(`\n✗ Generation aborted at step ${STEPS.current}/${STEPS.total}`);
  process.exit(1);
}

// ── Load models ───────────────────────────────────────────────────────────────

function loadModels() {
  const config = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8'));
  return {
    stage1:  config.pass1?.model      || 'anthropic/claude-haiku-4-5',
    stage2:  config.greenfield?.model || 'anthropic/claude-sonnet-4-5',
    titles:  config.titles?.model     || 'anthropic/claude-sonnet-4-5',
    pass2:   config.pass2?.model      || 'anthropic/claude-haiku-4-5',
  };
}

// ── API call ──────────────────────────────────────────────────────────────────

function callModel(model, systemPrompt, userContent, maxTokens = 9000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens:  maxTokens,
      temperature: 0.4,
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
        'X-Title':        'BooksVersusMovies Generate',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { reject(new Error(parsed.error.message)); return; }
          const text = parsed.choices?.[0]?.message?.content?.trim();
          if (!text) { reject(new Error('Empty response')); return; }
          resolve(text);
        } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
      });
    });

    req.setTimeout(90000, () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── JSON wrapper ──────────────────────────────────────────────────────────────

async function callModelJSON(model, prompt, userContent, maxTokens = 9000, retries = 2) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const instruction = attempt > 1
        ? `${prompt}\n\nCRITICAL: Previous response could not be parsed as JSON. Return ONLY raw JSON. No markdown, no explanation.`
        : prompt;
      const raw  = await callModel(model, instruction, userContent, maxTokens);
      const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(jsonrepair(clean));
    } catch (e) {
      lastError = e.message;
      if (attempt < retries) process.stdout.write(` ↺ retry...`);
    }
  }
  throw new Error(`JSON parse failed after ${retries} attempts: ${lastError}`);
}

// ── Human review pause ────────────────────────────────────────────────────────

function waitForReview(filePath, message) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`\n  📄 Review: ${filePath}`);
    console.log(`  ${message}`);
    rl.question('\n  Press ENTER to continue or Ctrl+C to abort... ', () => {
      rl.close();
      resolve();
    });
  });
}

// ── Steps ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  generate-review.js`);
  console.log(`  Slug:      ${SLUG}`);
  console.log(`  No-review: ${NO_REVIEW ? 'yes' : 'no'}`);
  console.log(`  Dry run:   ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`  Force:     ${FORCE ? 'yes' : 'no'}`);
  console.log(`${'═'.repeat(60)}`);

  const models = loadModels();

  // ── Step 1: Validate input ──────────────────────────────────────────────────
  step(1, 'Validate input file');
  const inputPath = path.join(INPUTS_DIR, `${SLUG}.json`);
  if (!fs.existsSync(inputPath)) {
    abort(`Input file not found: ${inputPath}\n  Create data/greenfield/inputs/${SLUG}.json first`);
  }
  let input;
  try {
    input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (e) {
    abort(`Failed to parse input file: ${e.message}`);
  }
  const required = ['bookTitle', 'slug', 'affiliateLink'];
  const missing  = required.filter(f => !input[f]);
  if (missing.length > 0) abort(`Input missing required fields: ${missing.join(', ')}`);
  if (input.slug !== SLUG) abort(`Input slug "${input.slug}" doesn't match --slug "${SLUG}"`);
  ok(`Input valid: ${input.bookTitle}`);
  info(`affiliateLink: ${input.affiliateLink}`);
  info(`youtubeId:     ${input.youtubeId || '(none)'}`);

  // ── Step 2: Check image ─────────────────────────────────────────────────────
  step(2, 'Check book cover image');
  const imagePath = path.join(IMAGES_DIR, `${SLUG}.jpg`);
  if (!fs.existsSync(imagePath)) {
    abort(`Book cover image not found: images/${SLUG}.jpg\n  Add the image before generating`);
  }
  const imageSize = fs.statSync(imagePath).size;
  ok(`images/${SLUG}.jpg found (${Math.round(imageSize / 1024)}KB)`);

  if (DRY_RUN) {
    console.log(`\n[DRY] Stopping here — all pre-flight checks passed.`);
    process.exit(0);
  }

  if (!API_KEY) abort('OPENROUTER_API_KEY not set in .env');

  // ── Step 3: Stage 1 — factual extraction ───────────────────────────────────
  step(3, `Stage 1 — factual extraction (${models.stage1})`);
  const stage1Path = path.join(STAGE1_DIR, `${SLUG}.json`);
  let stage1Data;

  if (!FORCE && fs.existsSync(stage1Path)) {
    stage1Data = JSON.parse(fs.readFileSync(stage1Path, 'utf8'));
    info(`Stage 1 already exists — skipping (use --force to re-run)`);
  } else {
    const prompt1 = fs.readFileSync(PROMPT1_PATH, 'utf8').trim();
    process.stdout.write('  ↻  Calling API...');
    try {
      stage1Data = await callModelJSON(models.stage1, prompt1, `bookTitle: ${input.bookTitle}\nslug: ${SLUG}`, 1000);
      stage1Data = { ...stage1Data, slug: SLUG, bookCoverImage: `${SLUG}.jpg` };
      if (!fs.existsSync(STAGE1_DIR)) fs.mkdirSync(STAGE1_DIR, { recursive: true });
      fs.writeFileSync(stage1Path, JSON.stringify(stage1Data, null, 2), 'utf8');
      process.stdout.write(` ✓\n`);
    } catch (e) {
      abort(`Stage 1 failed: ${e.message}`);
    }
  }

  ok(`author: ${stage1Data.author}`);
  ok(`bookYear: ${stage1Data.bookYear}`);
  ok(`filmYear: ${stage1Data.filmYear}`);
  ok(`director: ${stage1Data.director || '(none)'}`);
  ok(`mediaType: ${stage1Data.mediaType}`);
  info(`Written to: data/greenfield/stage1/${SLUG}.json`);

  // ── Step 4: Review Stage 1 ──────────────────────────────────────────────────
  step(4, 'Stage 1 human review');
  if (NO_REVIEW) {
    info('Skipping review (--no-review)');
  } else {
    await waitForReview(stage1Path, 'Verify author, years, director are correct. Edit the file if needed.');
    ok('Stage 1 approved — continuing');
    // Reload in case user edited the file
    stage1Data = JSON.parse(fs.readFileSync(stage1Path, 'utf8'));
  }

  // ── Step 5: Stage 2 — full review generation ───────────────────────────────
  step(5, `Stage 2 — full review generation (${models.stage2})`);
  const stage2Path  = path.join(STAGE2_DIR, `${SLUG}.json`);
  const revisedPath = path.join(REVISED_DIR, `${SLUG}.json`);
  let reviewData;

  if (!FORCE && fs.existsSync(stage2Path)) {
    info('Stage 2 already exists — skipping (use --force to re-run)');
    reviewData = JSON.parse(fs.readFileSync(stage2Path, 'utf8'));
  } else {
    const prompt2 = fs.readFileSync(PROMPT2_PATH, 'utf8').trim();
    process.stdout.write('  ↻  Calling API (this may take 30-60 seconds)...');
    let stage2Raw;
    try {
      stage2Raw = await callModelJSON(models.stage2, prompt2, JSON.stringify(stage1Data, null, 2), 9000);
    } catch (e) {
      abort(`Stage 2 failed: ${e.message}`);
    }
    process.stdout.write(` ✓\n`);

    // Content checks
    const contentFields = ['storyBrief', 'quickAnswer', 'characters', 'differences', 'readFirst', 'verdictBox', 'verdictText', 'verdictClass', 'faq', 'related'];
    const missingFields = contentFields.filter(f => !stage2Raw[f]);
    if (missingFields.length > 0) abort(`Stage 2 missing fields: ${missingFields.join(', ')}`);
    const charErrors = (stage2Raw.characters || []).filter(c => typeof c.inBook !== 'string' || typeof c.inFilm !== 'string');
    if (charErrors.length > 0) abort(`characters[].inBook/inFilm must be strings — re-run stage 2`);

    // Build final merged record
    reviewData = {
      slug:             SLUG,
      filename:         `${SLUG}.html`,
      lastUpdated:      TODAY,
      pipelineVersion:  '1',
      generation:       'greenfield',
      pageTitle:        null,
      metaDesc:         null,
      bookTitle:        stage1Data.bookTitle,
      author:           stage1Data.author,
      bookYear:         stage1Data.bookYear,
      genre:            stage1Data.genre,
      mediaType:        stage1Data.mediaType,
      mediaLabel:       stage1Data.mediaLabel || 'The Film',
      filmYear:         stage1Data.filmYear,
      director:         stage1Data.director || null,
      starringLine:     stage1Data.starringLine,
      reviewBody:       stage1Data.reviewBody,
      ratingValue:      stage1Data.ratingValue || '4',
      affiliateLink:      input.affiliateLink,
      affiliateLinkAlt:   input.affiliateLinkAlt   || null,
      videoAffiliateLink: input.videoAffiliateLink || null,
      youtubeId:          input.youtubeId          || null,
      trailerUrl:         input.youtubeId ? `https://www.youtube.com/watch?v=${input.youtubeId}` : null,
      bookCoverImage:     `${SLUG}.jpg`,
      storyBrief:         stage2Raw.storyBrief,
      quickAnswer:        stage2Raw.quickAnswer,
      characters:         stage2Raw.characters,
      differences:        stage2Raw.differences,
      readFirst:          stage2Raw.readFirst,
      verdictBox:         stage2Raw.verdictBox,
      verdictText:        stage2Raw.verdictText,
      verdictClass:       stage2Raw.verdictClass,
      faq:                stage2Raw.faq,
      ctaBlocks:          null,
      relatedSectionTitle: stage2Raw.relatedSectionTitle || 'More Comparisons',
      related:             stage2Raw.related,
      hasSpoilerWarning:  false,
      hasQuickAnswer:     true,
      hasCharTable:       true,
    };

    if (!fs.existsSync(STAGE2_DIR)) fs.mkdirSync(STAGE2_DIR, { recursive: true });
    fs.writeFileSync(stage2Path,  JSON.stringify(reviewData, null, 2), 'utf8');
    fs.writeFileSync(revisedPath, JSON.stringify(reviewData, null, 2), 'utf8');
  }

  ok(`verdict: ${reviewData.verdictText}`);
  ok(`oneLineReason: ${reviewData.quickAnswer?.oneLineReason}`);
  info(`Written to: data/greenfield/stage2/${SLUG}.json`);
  info(`Copied to:  pipeline/2-revised/${SLUG}.json`);

  // ── Step 6: Titles pass ─────────────────────────────────────────────────────
  step(6, `Titles pass (${models.titles})`);
  process.stdout.write('  ↻  Calling API...');
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `node "${path.join(ROOT, 'scripts', 'pipeline-revise.js')}" --slug ${SLUG} --pass titles --force`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    process.stdout.write(` ✓\n`);
    // Extract title from result
    const titleMatch = result.match(/AFTER\s+title \(\d+ chars\): (.+)/);
    if (titleMatch) ok(`pageTitle: ${titleMatch[1].trim()}`);
  } catch (e) {
    abort(`Titles pass failed: ${e.message}`);
  }

  // ── Step 7: Pass 2 — CTA blocks ────────────────────────────────────────────
  step(7, `Pass 2 — CTA blocks (${models.pass2})`);
  process.stdout.write('  ↻  Calling API...');
  try {
    const { execSync } = require('child_process');
    execSync(
      `node "${path.join(ROOT, 'scripts', 'pipeline-revise.js')}" --slug ${SLUG} --pass 2 --force`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    process.stdout.write(` ✓\n`);
    const revised = JSON.parse(fs.readFileSync(revisedPath, 'utf8'));
    ok(`ctaBlocks: ${revised.ctaBlocks?.length || 0} blocks added`);
  } catch (e) {
    abort(`Pass 2 failed: ${e.message}`);
  }

  // ── Step 8: Schema validation ───────────────────────────────────────────────
  step(8, 'Schema validation');
  const finalRecord = JSON.parse(fs.readFileSync(revisedPath, 'utf8'));
  const validation  = validateRecord(finalRecord, 'revised');
  if (!validation.valid) {
    validation.errors.forEach(e => warn(e));
    abort(`Schema validation failed — fix errors before rendering`);
  }
  ok('Schema validation passed (schema-revised)');

  // ── Step 9: Render ──────────────────────────────────────────────────────────
  step(9, 'Render HTML');
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `node "${path.join(ROOT, 'scripts', 'pipeline-render.js')}" --slug ${SLUG} --force`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    process.stdout.write('  ');
    if (result.includes('CHECKPOINT FAILED')) {
      abort(`Render checkpoint failed:\n${result}`);
    }
    ok(`Rendered to pipeline/3-rendered/${SLUG}.html`);
  } catch (e) {
    abort(`Render failed: ${e.message}`);
  }

  // ── Step 10: Copy to root ───────────────────────────────────────────────────
  step(10, 'Copy HTML to project root');
  const renderedPath = path.join(RENDERED_DIR, `${SLUG}.html`);
  const rootPath     = path.join(ROOT, `${SLUG}.html`);
  fs.copyFileSync(renderedPath, rootPath);
  ok(`Copied to ${SLUG}.html`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ✓ Generation complete: ${input.bookTitle}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n  Live at: https://booksversusmovies.com/${SLUG}`);
  console.log(`  Local:   ${rootPath}`);
  console.log(`\n  Next steps:`);
  console.log(`    1. Open ${SLUG}.html in browser and review`);
  console.log(`    2. git add . && git commit -m "Add ${input.bookTitle} review"`);
  console.log(`    3. git checkout main && git merge dev && git push`);
  console.log(`    4. git checkout dev`);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
