#!/usr/bin/env node

/**
 * pipeline-pillar.js
 * BooksVersusMovies.com — Pillar page JSON generator
 *
 * Reads config/pillars.json and generates a content JSON file for each pillar.
 * Two-pass: outline → prose. Both passes use models from pillars.json config.
 * Output JSON is rendered to HTML by pipeline-pillar-render.js (separate step).
 *
 * Usage:
 *   node scripts/pipeline-pillar.js                        (all pillars)
 *   node scripts/pipeline-pillar.js --slug should-you-read-the-book-first
 *   node scripts/pipeline-pillar.js --dry
 *
 * Output: data/pillars/<slug>.json
 *
 * Destination: scripts/pipeline-pillar.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const getArg  = flag => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : null; };
const hasFlag = flag => args.includes(flag);

const SLUG_FILTER = getArg('--slug');
const DRY_RUN     = hasFlag('--dry');
const FORCE       = hasFlag('--force');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');
const CONFIG_PATH  = path.join(ROOT, 'config', 'pillars.json');
const OUTPUT_DIR   = path.join(ROOT, 'data', 'pillars');

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY = process.env.OPENROUTER_API_KEY;

// ── API call ──────────────────────────────────────────────────────────────────

function callModel(model, systemPrompt, userContent, maxTokens = 2000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: maxTokens,
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
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   'https://booksversusmovies.com',
        'X-Title':        'BooksVersusMovies Pillar Pipeline',
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

    req.setTimeout(90000, () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseJSON(text) {
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch {}
  throw new Error('Could not parse JSON from model response');
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function outlineSystemPrompt(site) {
  return `You are a content strategist for ${site.name}.
Site tone: ${site.tone}.
Your job is to expand a section outline into richer key points — more specific, more opinionated, more useful.
Return ONLY a JSON array of sections. Each section must have: id, h2, key_points (array of strings).
No markdown fences, no explanation.`;
}

function outlineUserPrompt(pillar) {
  return `Expand the key points for each section of this pillar page.
Make each key point specific, opinionated, and useful to a reader.
Keep the h2 headings exactly as given. Add 2-3 more key points per section where useful.

Pillar title: ${pillar.h1}
Sections:
${JSON.stringify(pillar.sections, null, 2)}`;
}

function proseSystemPrompt(site) {
  return `You are a writer for ${site.name}.
Site tone: ${site.tone}.
Your job is to turn section outlines into polished prose paragraphs.
Rules:
- 2-3 paragraphs per section, 100-200 words each
- No bullet points in the prose — write in flowing paragraphs
- Opinionated but not aggressive — the site has a clear point of view
- Where relevant, mention that the site has 170+ book vs movie comparisons
- Return ONLY a JSON array. Each item must have: id, h2, prose (a single string with paragraph breaks as \\n\\n)
- No markdown fences, no explanation`;
}

function proseUserPrompt(pillar, expandedSections) {
  return `Write 2-3 prose paragraphs for each section of this pillar page.

Page title: ${pillar.h1}
Page purpose: ${pillar.meta_description}

Sections to write:
${JSON.stringify(expandedSections, null, 2)}`;
}

// ── Generate one pillar ───────────────────────────────────────────────────────

async function generatePillar(pillar, models, site) {
  const outputPath = path.join(OUTPUT_DIR, `${pillar.slug}.json`);

  if (!FORCE && fs.existsSync(outputPath)) {
    console.log(`  → Skipping ${pillar.slug} (exists — use --force to overwrite)`);
    return;
  }

  // Pass 1: expand outline
  process.stdout.write(`  ↻  Pass 1 (outline)...`);
  const outlineRaw = await callModel(
    models.outline,
    outlineSystemPrompt(site),
    outlineUserPrompt(pillar),
    9000
  );
  const expandedSections = parseJSON(outlineRaw);
  process.stdout.write(` ✓\n`);

  // Pass 2: generate prose
  process.stdout.write(`  ↻  Pass 2 (prose)...`);
  const proseRaw = await callModel(
    models.prose,
    proseSystemPrompt(site),
    proseUserPrompt(pillar, expandedSections),
    3000
  );
  const proseSections = parseJSON(proseRaw);
  process.stdout.write(` ✓\n`);

  // Merge into final output
  const output = {
    type:             'pillar',
    slug:             pillar.slug,
    h1:               pillar.h1,
    title_tag:        pillar.title_tag,
    meta_description: pillar.meta_description,
    generatedAt:      new Date().toISOString().split('T')[0],
    sections:         proseSections,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`  ✓  → data/pillars/${pillar.slug}.json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`✗ config/pillars.json not found`);
    process.exit(1);
  }

  const config  = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const { site, models, pillars } = config;

  let targets = pillars;
  if (SLUG_FILTER) {
    targets = pillars.filter(p => p.slug === SLUG_FILTER);
    if (targets.length === 0) {
      console.error(`✗ No pillar found with slug: ${SLUG_FILTER}`);
      process.exit(1);
    }
  }

  console.log(`\npipeline-pillar.js`);
  console.log(`Outline model: ${models.outline}`);
  console.log(`Prose model:   ${models.prose}`);
  console.log(`Pillars:       ${targets.length}`);
  console.log(`${'─'.repeat(52)}`);

  if (DRY_RUN) {
    targets.forEach(p => console.log(`  [DRY] Would generate: ${p.slug}`));
    console.log(`\n[DRY RUN] No files written.`);
    return;
  }

  if (!API_KEY) {
    console.error('✗ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let passed = 0;
  let failed = 0;

  for (const pillar of targets) {
    console.log(`\n── ${pillar.h1}`);
    try {
      await generatePillar(pillar, models, site);
      passed++;
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(52)}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\nNext step: node scripts/pipeline-pillar-render.js`);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
