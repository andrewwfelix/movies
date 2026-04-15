#!/usr/bin/env node

/**
 * pipeline-generate.js
 * BooksVersusMovies.com — greenfield review generator (Step 5)
 *
 * Two-stage generation:
 *   Stage 1: Haiku extracts factual metadata from book title alone
 *   Stage 2: Sonnet generates full review JSON using Stage 1 output
 *
 * Input format (data/greenfield/inputs/*.json):
 * {
 *   "bookTitle": "The Godfather",
 *   "slug": "the-godfather",
 *   "affiliateLink": "https://amzn.to/xxxxx",
 *   "youtubeId": "sY1S34973zA",
 *   "videoAffiliateLink": "https://amzn.to/xxxxx"
 * }
 *
 * Usage:
 *   node pipeline-generate.js                        (process all inputs)
 *   node pipeline-generate.js --slug the-godfather   (single page)
 *   node pipeline-generate.js --stage 1              (stage 1 only)
 *   node pipeline-generate.js --stage 2              (stage 2 only, reads stage 1 output)
 *   node pipeline-generate.js --dry                  (validate inputs, no API calls)
 *   node pipeline-generate.js --force                (re-run even if output exists)
 *
 * Outputs:
 *   data/greenfield/stage1/*.json   factual metadata (review before stage 2)
 *   data/greenfield/stage2/*.json   full review JSON (feeds into pipeline passes)
 *   pipeline/2-revised/*.json       copied here when stage 2 complete
 * Destination: scripts/pipeline-generate.js
 * Destination: scripts/pipeline-generate.js
 */

const fs    = require('fs');
const { jsonrepair } = require('jsonrepair');
const { validateRecord } = require('./utils/validate-json-schema');
const path  = require('path');
const https = require('https');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SLUG_ARG  = get('--slug', null);
const STAGE_ARG = get('--stage', 'all');
const DRY_RUN   = hasFlag('--dry');
const FORCE     = hasFlag('--force');

const ROOT         = path.resolve(__dirname, '..');
const INPUTS_DIR   = path.join(ROOT, 'data', 'greenfield', 'inputs');
const STAGE1_DIR   = path.join(ROOT, 'data', 'greenfield', 'stage1');
const STAGE2_DIR   = path.join(ROOT, 'data', 'greenfield', 'stage2');
const REVISED_DIR  = path.join(ROOT, 'pipeline', '2-revised');
const PROMPT1_PATH = path.join(ROOT, 'scripts', 'prompts', 'greenfield-stage1.txt');
const PROMPT2_PATH = path.join(ROOT, 'scripts', 'prompts', 'greenfield-stage2.txt');
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

// ── Load models ───────────────────────────────────────────────────────────────

function loadModels() {
  const config = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8'));
  return {
    stage1: config.pass1?.model   || 'anthropic/claude-haiku-4-5',
    stage2: config.greenfield?.model || 'anthropic/claude-sonnet-4-5',
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
        'X-Title':        'BooksVersusMovies Greenfield',
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

// ── Parse JSON from model response ───────────────────────────────────────────

function parseJSON(text) {
  // Strip markdown fences if present
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  // jsonrepair handles all common model output issues:
  // unclosed arrays, trailing commas, } instead of ], extra text, etc.
  return JSON.parse(jsonrepair(clean));
}

// ── Validate input ────────────────────────────────────────────────────────────

function validateInput(input) {
  const required = ['bookTitle', 'slug', 'affiliateLink'];
  const missing  = required.filter(f => !input[f]);
  if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(', ')}`);
  if (!/^[a-z0-9-]+$/.test(input.slug)) throw new Error(`Invalid slug format: ${input.slug}`);
}

// ── Validate stage 1 output ───────────────────────────────────────────────────

function validateStage1(data) {
  const required = ['bookTitle', 'author', 'bookYear', 'genre', 'mediaType', 'filmYear', 'starringLine', 'reviewBody'];
  const missing  = required.filter(f => !data[f]);
  if (missing.length > 0) throw new Error(`Stage 1 missing fields: ${missing.join(', ')}`);
}

// ── Validate stage 2 output via JSON Schema ──────────────────────────────────

function validateStage2(data) {
  const result = validateRecord(data, 'greenfield');
  if (!result.valid) {
    throw new Error(`Schema validation failed:\n${result.errors.map(e => '  - ' + e).join('\n')}`);
  }
}

// ── Load inputs ───────────────────────────────────────────────────────────────

function loadInputs() {
  if (!fs.existsSync(INPUTS_DIR)) {
    console.error(`✗ Inputs directory not found: ${INPUTS_DIR}`);
    console.error(`  Create it and add input JSON files.`);
    process.exit(1);
  }

  let files = fs.readdirSync(INPUTS_DIR).filter(f => f.endsWith('.json')).sort();

  if (SLUG_ARG) {
    files = files.filter(f => f.replace('.json', '') === SLUG_ARG);
    if (files.length === 0) {
      console.error(`✗ No input file found for slug: ${SLUG_ARG}`);
      process.exit(1);
    }
  }

  return files.map(file => {
    const input = JSON.parse(fs.readFileSync(path.join(INPUTS_DIR, file), 'utf8'));
    validateInput(input);
    return input;
  });
}

// ── Stage 1 ───────────────────────────────────────────────────────────────────

async function runStage1(input, prompt1, models) {
  const outPath = path.join(STAGE1_DIR, `${input.slug}.json`);

  if (!FORCE && fs.existsSync(outPath)) {
    console.log(`  → Stage 1: ${input.slug} — already exists, skipping`);
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  process.stdout.write(`  ↻  Stage 1 (${models.stage1})...`);
  const userContent = `bookTitle: ${input.bookTitle}\nslug: ${input.slug}`;
  const raw         = await callModel(models.stage1, prompt1, userContent, 1000);
  const data        = parseJSON(raw);

  validateStage1(data);

  // Merge with input fields
  const merged = { ...data, slug: input.slug, bookCoverImage: `${input.slug}.jpg` };
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
  process.stdout.write(` ✓\n`);
  console.log(`     author: ${data.author} | year: ${data.bookYear} | film: ${data.filmYear} | director: ${data.director || 'n/a'}`);

  return merged;
}

// ── Stage 2 ───────────────────────────────────────────────────────────────────

async function runStage2(input, stage1Data, prompt2, models) {
  const outPath     = path.join(STAGE2_DIR, `${input.slug}.json`);
  const revisedPath = path.join(REVISED_DIR, `${input.slug}.json`);

  if (!FORCE && fs.existsSync(outPath)) {
    console.log(`  → Stage 2: ${input.slug} — already exists, skipping`);
    return;
  }

  process.stdout.write(`  ↻  Stage 2 (${models.stage2})...`);
  const userContent = JSON.stringify(stage1Data, null, 2);

  let raw, data;
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const instruction = attempt > 1
        ? `${prompt2}\n\nCRITICAL: Your previous response could not be parsed as JSON. Return ONLY the raw JSON object. No markdown fences, no explanation.`
        : prompt2;
      raw  = await callModel(models.stage2, instruction, userContent, 9000);
      data = parseJSON(raw);
      break; // JSON parsed successfully — exit retry loop
    } catch (e) {
      if (attempt === maxRetries) throw new Error(`JSON parse failed after ${maxRetries} attempts: ${e.message}`);
      process.stdout.write(` ↺ retry ${attempt}...`);
    }
  }

  // Content checks after successful parse — not retried, fail fast
  const contentFields = ['storyBrief', 'quickAnswer', 'characters', 'differences', 'readFirst', 'verdictBox', 'verdictText', 'verdictClass', 'faq', 'related'];
  const missing = contentFields.filter(f => !data[f]);
  if (missing.length > 0) throw new Error(`Missing content fields: ${missing.join(', ')}`);
  if (!data.quickAnswer?.oneLineReason) throw new Error('quickAnswer.oneLineReason missing');
  const charErrors = (data.characters || []).filter(c => typeof c.inBook !== 'string' || typeof c.inFilm !== 'string');
  if (charErrors.length > 0) throw new Error(`characters[].inBook and inFilm must be strings — check prompt`);

  const warnings = [];
  if (warnings.length > 0) {
    process.stdout.write(` ⚠\n`);
    warnings.forEach(w => console.log(`     ⚠  ${w}`));
  } else {
    process.stdout.write(` ✓\n`);
  }

  // Merge everything together
  const final = {
    // Identity
    slug:             input.slug,
    filename:         `${input.slug}.html`,
    lastUpdated:      TODAY,
    pipelineVersion:  '1',
    generation:       'greenfield',

    // SEO (populated by titles pass)
    pageTitle:        null,
    metaDesc:         null,

    // Stage 1 metadata
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

    // Affiliate / media (from input)
    affiliateLink:      input.affiliateLink,
    affiliateLinkAlt:   input.affiliateLinkAlt   || null,
    videoAffiliateLink: input.videoAffiliateLink || null,
    youtubeId:          input.youtubeId          || null,
    trailerUrl:         input.youtubeId ? `https://www.youtube.com/watch?v=${input.youtubeId}` : null,
    bookCoverImage:     `${input.slug}.jpg`,

    // Stage 2 content
    storyBrief:         data.storyBrief,
    quickAnswer:        data.quickAnswer,
    characters:         data.characters,
    differences:        data.differences,
    readFirst:          data.readFirst,
    verdictBox:         data.verdictBox,
    verdictText:        data.verdictText,
    verdictClass:       data.verdictClass,
    faq:                data.faq,
    ctaBlocks:          null,

    // Related
    relatedSectionTitle: data.relatedSectionTitle || 'More Comparisons',
    related:             data.related,

    // Flags
    hasSpoilerWarning: false,
    hasQuickAnswer:    true,
    hasCharTable:      true,
  };

  fs.writeFileSync(outPath, JSON.stringify(final, null, 2), 'utf8');
  fs.writeFileSync(revisedPath, JSON.stringify(final, null, 2), 'utf8');

  // Validate the fully merged output against greenfield schema
  const schemaResult = validateRecord(final, 'greenfield');
  if (!schemaResult.valid) {
    console.log(`\n  ⚠  Schema warnings on final output:`);
    schemaResult.errors.forEach(e => console.log(`     - ${e}`));
  }

  console.log(`     verdict: ${data.verdictText}`);
  console.log(`     → Copied to pipeline/2-revised/${input.slug}.json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // Ensure directories exist
  for (const dir of [INPUTS_DIR, STAGE1_DIR, STAGE2_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const inputs = loadInputs();
  const models = loadModels();

  console.log(`\npipeline-generate.js`);
  console.log(`Inputs:  ${inputs.length}`);
  console.log(`Stage 1: ${models.stage1}`);
  console.log(`Stage 2: ${models.stage2}`);
  console.log(`Stage:   ${STAGE_ARG}`);
  console.log(`Force:   ${FORCE ? 'yes' : 'no'}`);
  console.log('');

  if (DRY_RUN) {
    console.log('Input validation passed:');
    inputs.forEach(i => console.log(`  ✓  ${i.slug} — ${i.bookTitle}`));
    console.log('\n[DRY] No API calls made.');
    return;
  }

  if (!API_KEY) {
    console.error('✗ OPENROUTER_API_KEY not set');
    process.exit(1);
  }

  const prompt1 = fs.readFileSync(PROMPT1_PATH, 'utf8').trim();
  const prompt2 = fs.readFileSync(PROMPT2_PATH, 'utf8').trim();

  let succeeded = 0;
  let failed    = 0;

  for (const input of inputs) {
    console.log(`\n── ${input.bookTitle} (${input.slug}) ──`);
    try {
      let stage1Data;

      if (STAGE_ARG === 'all' || STAGE_ARG === '1') {
        stage1Data = await runStage1(input, prompt1, models);
      } else {
        // Stage 2 only — load existing stage 1
        const s1Path = path.join(STAGE1_DIR, `${input.slug}.json`);
        if (!fs.existsSync(s1Path)) {
          console.log(`  ✗  Stage 1 output not found for ${input.slug} — run --stage 1 first`);
          failed++;
          continue;
        }
        stage1Data = JSON.parse(fs.readFileSync(s1Path, 'utf8'));
        console.log(`  → Stage 1: loaded from ${s1Path}`);
      }

      if (STAGE_ARG === 'all' || STAGE_ARG === '2') {
        await runStage2(input, stage1Data, prompt2, models);
      }

      succeeded++;
    } catch (err) {
      console.error(`  ✗  ${input.slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);

  if (succeeded > 0 && (STAGE_ARG === 'all' || STAGE_ARG === '2')) {
    console.log(`\nNext steps:`);
    console.log(`  1. Review stage 2 output in data/greenfield/stage2/`);
    console.log(`  2. Add book cover images to images/`);
    console.log(`  3. Run titles pass:  node scripts\\pipeline-revise.js --pass titles`);
    console.log(`  4. Run Pass 2:       node scripts\\pipeline-revise.js --pass pass2`);
    console.log(`  5. Render:           node scripts\\pipeline-render.js`);
  }
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
