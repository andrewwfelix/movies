#!/usr/bin/env node

/**
 * scripts/utils/seo-llm-fullpage.js
 * BooksVersusMovies.com — Full-page v3.1 schema field generator
 *
 * Generates all new v3.1 structural fields for each page using
 * six focused Claude Sonnet calls per page. Each call targets one
 * field group, validates output, and saves immediately to source JSON.
 * Progress is never lost — failed calls are retried once, then flagged.
 *
 * Call sequence per page:
 *   1. Identity + keywords  (primaryKeyword, secondaryKeywords, targetQueries, winnerStatement, entities, hook)
 *   2. Snippet paragraph    (snippetParagraph)
 *   3. At-a-glance table   (atAGlanceTable)
 *   4. Key differences list (keyDifferencesList)
 *   5. Optimized H2s        (optimizedH2s)
 *   6. Open Graph + images  (og, images)
 *
 * Usage:
 *   node scripts/utils/seo-llm-fullpage.js                   -- all pages
 *   node scripts/utils/seo-llm-fullpage.js --slug gone-girl  -- one page
 *   node scripts/utils/seo-llm-fullpage.js --limit 10        -- first N
 *   node scripts/utils/seo-llm-fullpage.js --dry             -- preview only
 *   node scripts/utils/seo-llm-fullpage.js --call 2          -- one call only
 *
 * Destination: scripts/utils/seo-llm-fullpage.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const get       = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag   = f => args.includes(f);

const SLUG_FILTER  = get('--slug', null);
const DRY_RUN      = hasFlag('--dry');
const LIMIT        = parseInt(get('--limit', '0')) || 0;
const CALL_FILTER  = parseInt(get('--call', '0')) || 0; // run only one call number

// ── Paths + Config ───────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..', '..');
const SRC_DIR     = path.join(ROOT, 'pipeline', '2-revised');
const SITE_URL    = 'https://booksversusmovies.com';
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-review.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('✗ config/seo-review.json not found');
  process.exit(1);
}

const CONFIG   = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const FP       = CONFIG.fullpage;
const DEV_MODE = hasFlag('--dev') || process.env.DEV_MODE === 'true';
const MODE     = DEV_MODE ? 'dev' : 'prod';

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

function callClaude(model, systemPrompt, userContent, maxTokens) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      temperature: 0.2,
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
        'HTTP-Referer':   SITE_URL,
        'X-Title':        'BooksVersusMovies FullPage SEO',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { resolve({ error: parsed.error.message }); return; }
          const text  = parsed.choices?.[0]?.message?.content?.trim() || '';
          const clean = text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
          // Extract JSON object or array from anywhere in response
          const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (!match) { resolve({ error: `No JSON found in response: ${clean.slice(0,100)}` }); return; }
          try   { resolve({ data: JSON.parse(match[0]) }); }
          catch { resolve({ error: `JSON parse failed: ${match[0].slice(0,100)}` }); }
        } catch (e) { resolve({ error: e.message }); }
      });
    });
    req.setTimeout(60000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body); req.end();
  });
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function callWithRetry(model, systemPrompt, userContent, maxTokens, validate) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await callClaude(model, systemPrompt, userContent, maxTokens);
    if (result.error) {
      if (attempt === 2) return { error: result.error };
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    const validation = validate ? validate(result.data) : { ok: true };
    if (validation.ok) return { data: result.data };
    if (attempt === 2) return { error: `Validation failed: ${validation.reason}` };
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ── Validation helpers ────────────────────────────────────────────────────────

const ok  = ()       => ({ ok: true });
const fail = reason  => ({ ok: false, reason });

function validateSnippetParagraph(d) {
  if (typeof d !== 'string') return fail('not a string');
  const words = d.trim().split(/\s+/).length;
  if (words > 110) return fail(`too long: ${words} words (max 100)`);
  if (words < 30)  return fail(`too short: ${words} words (min 30)`);
  return ok();
}

function validateAtAGlanceTable(d) {
  if (!Array.isArray(d)) return fail('not an array');
  if (d.length < 3 || d.length > 6) return fail(`wrong length: ${d.length} rows (need 3-6)`);
  for (const row of d) {
    if (!row.feature) return fail('row missing feature');
    if (!row.book)    return fail(`row "${row.feature}" missing book value`);
    if (!row.film)    return fail(`row "${row.feature}" missing film value`);
  }
  return ok();
}

function validateKeyDifferencesList(d) {
  if (!Array.isArray(d)) return fail('not an array');
  if (d.length < 3 || d.length > 5) return fail(`wrong length: ${d.length} items (need 3-5)`);
  for (const item of d) {
    if (!item.label) return fail('item missing label');
    if (!item.text)  return fail(`item "${item.label}" missing text`);
  }
  return ok();
}

function validateOptimizedH2s(d) {
  if (typeof d !== 'object' || Array.isArray(d)) return fail('not an object');
  const required = ['keyDifferences', 'readFirst'];
  for (const key of required) {
    if (!d[key]) return fail(`missing required H2: ${key}`);
    if (!d[key].includes('?')) return fail(`H2 "${key}" is not a question`);
  }
  return ok();
}

function validateIdentity(d) {
  if (typeof d !== 'object') return fail('not an object');
  if (!d.primaryKeyword)    return fail('missing primaryKeyword');
  if (!d.winnerStatement)   return fail('missing winnerStatement');
  if (!Array.isArray(d.entities) || d.entities.length === 0) return fail('missing entities');
  return ok();
}

function validateOg(d) {
  if (typeof d !== 'object') return fail('not an object');
  if (!d.og)                 return fail('missing og object');
  if (!d.og.title)           return fail('missing og.title');
  if (!d.og.description)     return fail('missing og.description');
  return ok();
}

// ── System prompts ────────────────────────────────────────────────────────────

const VOICE_NOTE = `Voice: BooksVersusMovies.com is opinionated, specific, and sides-taking. It picks winners. It does not hedge. Editorial register is confident and literary without being academic.`;

const PROMPTS = {

  1: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Given a book vs movie comparison page, generate identity and keyword fields.

Return ONLY a JSON object with exactly these fields:
{
  "primaryKeyword": "the exact query most searchers use (e.g. 'gone girl book vs movie')",
  "secondaryKeywords": ["3-5 related queries"],
  "targetQueries": ["3-5 queries this page should rank for, in question format where possible"],
  "winnerStatement": "One declarative sentence: '[Title] book/film is better than the [year] [film/adaptation].'",
  "hook": "One-line emotional entry point for CTR — specific, punchy, site voice.",
  "entities": ["Real people and works named on this page — author, director, lead actors, book title, film title"]
}`,

  2: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Generate a snippet paragraph for Google featured snippet capture.

STRICT RULES:
- Under 100 words. Hard limit.
- Structure: main difference → verdict → read/watch first
- First sentence format: "The main difference between the [Title] book and the [year] [film/series] is [specific structural difference]."
- Second sentence: verdict with specific reason
- Final sentence: clear read/watch first recommendation

Return ONLY a JSON object:
{ "snippetParagraph": "the paragraph text here" }`,

  3: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Generate an at-a-glance comparison table for Google snippet extraction.

STRICT RULES:
- 4-5 rows exactly
- Every row must have feature, book, AND film values — no nulls, no N/A
- Parallel structure: both book and film values must be comparable phrases of similar length
- Punchy values — not prose. Max 6 words per cell.
- Feature names must be specific, not generic ("Point of view" not "POV difference")

Return ONLY a JSON array:
[
  { "feature": "Feature name", "book": "Book value", "film": "Film value" }
]`,

  4: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Generate a key differences bullet list for Google PAA and AI Overview extraction.

STRICT RULES:
- 3-5 items exactly
- Each item: label (bold, 1-3 words) + text (one sentence, specific)
- This is the index layer — not a summary of the differences sections but a tighter, more extractable version
- Labels must be specific nouns, not generic ("The letters" not "Key difference")

Return ONLY a JSON array:
[
  { "label": "Short label", "text": "One specific sentence about this difference." }
]`,

  5: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Generate question-format H2 overrides for People Also Ask targeting.

STRICT RULES:
- Every H2 must be a genuine search query someone would type
- Must include the book/film title in the question
- Must end with a question mark
- keyDifferences and readFirst are required. storyBrief and verdict are optional.

Return ONLY a JSON object:
{
  "storyBrief":     "What is [Title] about?",
  "keyDifferences": "How is the [Title] [movie/show] different from the book?",
  "readFirst":      "Should you read [Title] before watching the [movie/show]?",
  "verdict":        "Is the [Title] book or [movie/show] better?"
}`,

  6: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Generate Open Graph social meta tags and image alt text fields.

STRICT RULES:
- og.title: max 60 chars, matches page title
- og.description: max 150 chars, compelling social share description
- og.image: full URL using pattern https://booksversusmovies.com/images/[slug]-og.jpg
- og.imageAlt: descriptive alt text for the OG image
- bookCoverAlt: keyword-aligned alt text for the book cover image
- trailerThumbAlt: descriptive alt text for the trailer thumbnail

Return ONLY a JSON object:
{
  "og": {
    "title": "...",
    "description": "...",
    "image": "https://booksversusmovies.com/images/[slug]-og.jpg",
    "imageAlt": "..."
  },
  "images": {
    "bookCoverAlt": "...",
    "trailerThumbAlt": "..."
  }
}`,
};

// ── Field already populated check ─────────────────────────────────────────────

function callNeeded(page, callNum) {
  switch(callNum) {
    case 1: return !page.primaryKeyword || !page.winnerStatement || !page.entities?.length;
    case 2: return !page.snippetParagraph;
    case 3: return !page.atAGlanceTable || !page.atAGlanceTable.length;
    case 4: return !page.keyDifferencesList || !page.keyDifferencesList.length;
    case 5: return !page.optimizedH2s || !page.optimizedH2s.keyDifferences;
    case 6: return !page.og || !page.og.title;
    default: return true;
  }
}

// ── Apply result to page JSON ─────────────────────────────────────────────────

function applyResult(page, callNum, data) {
  switch(callNum) {
    case 1:
      page.primaryKeyword    = data.primaryKeyword    || page.primaryKeyword;
      page.secondaryKeywords = data.secondaryKeywords || page.secondaryKeywords || [];
      page.targetQueries     = data.targetQueries     || page.targetQueries     || [];
      page.winnerStatement   = data.winnerStatement   || page.winnerStatement;
      page.hook              = data.hook              || page.hook;
      page.entities          = data.entities          || page.entities          || [];
      break;
    case 2:
      page.snippetParagraph    = data.snippetParagraph;
      page.hasSnippetParagraph = true;
      break;
    case 3:
      page.atAGlanceTable    = data;
      page.hasAtAGlanceTable = true;
      break;
    case 4:
      page.keyDifferencesList    = data;
      page.hasKeyDifferencesList = true;
      break;
    case 5:
      page.optimizedH2s    = data;
      page.hasOptimizedH2s = true;
      break;
    case 6:
      page.og          = data.og;
      page.images      = data.images;
      page.hasOpenGraph = true;
      break;
  }
  page._schemaVersion = '3.1';
  page.lastUpdated    = new Date().toISOString().split('T')[0];
}

// ── Build user content for each call ─────────────────────────────────────────

function buildUserContent(page, callNum) {
  const base = `Slug: ${page.slug}
Book: ${page.bookTitle} (${page.bookYear}) by ${page.author}
Film: ${page.filmYear} ${page.mediaType} directed by ${page.director}
Genre: ${page.genre}
Verdict: ${page.verdictText}
One-line reason: ${page.quickAnswer?.oneLineReason || ''}`;

  switch(callNum) {
    case 1:
      return `${base}
Current title: ${page.pageTitle}
Current meta: ${page.metaDesc}`;

    case 2:
      return `${base}
Primary keyword: ${page.primaryKeyword || page.pageTitle}
Winner statement: ${page.winnerStatement || page.verdictText}
Key differences (titles only): ${(page.differences || []).map(d => d.title).slice(0,5).join('; ')}
Quick answer: ${JSON.stringify(page.quickAnswer || {})}
Read first summary: ${(page.readFirst || '').slice(0, 300)}`;

    case 3:
      return `${base}
Differences: ${(page.differences || []).map(d => d.title).join('; ')}
Characters: ${(page.characters || []).map(c => `${c.name} (${c.actor}): book: ${c.inBook?.slice(0,60)}... film: ${c.inFilm?.slice(0,60)}...`).join(' | ')}
Primary keyword: ${page.primaryKeyword || ''}`;

    case 4:
      return `${base}
Differences:
${(page.differences || []).map(d => `- ${d.title}: ${(d.body || '').slice(0,150)}...`).join('\n')}`;

    case 5:
      return `${base}
Primary keyword: ${page.primaryKeyword || ''}
Target queries: ${(page.targetQueries || []).join(', ')}`;

    case 6:
      return `${base}
Page title: ${page.pageTitle}
Meta description: ${page.metaDesc}
Winner statement: ${page.winnerStatement || ''}
Slug: ${page.slug}`;
  }
}

// ── Validators by call ────────────────────────────────────────────────────────

const VALIDATORS = {
  1: validateIdentity,
  2: d => validateSnippetParagraph(d.snippetParagraph),
  3: validateAtAGlanceTable,
  4: validateKeyDifferencesList,
  5: validateOptimizedH2s,
  6: validateOg,
};

// ── Call config helpers ──────────────────────────────────────────────────────

const CALL_KEYS = ['1_identity','2_snippet','3_table','4_differences','5_h2s','6_social'];

function getCallConfig(callNum) {
  const key = CALL_KEYS[callNum - 1];
  const cfg = FP.calls[key];
  const modeCfg = cfg[MODE];
  return {
    model:     modeCfg.model,
    label:     modeCfg.label,
    maxTokens: modeCfg.maxTokens * modeCfg.maxTokensMultiplier,
    requiresReview: cfg.requiresReview,
    fields:    cfg.fields,
  };
}

// ── Load records ──────────────────────────────────────────────────────────────

function loadRecords() {
  let files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  if (SLUG_FILTER) {
    files = files.filter(f => f.replace('.json','') === SLUG_FILTER);
    if (!files.length) { console.error(`✗ No JSON for: ${SLUG_FILTER}`); process.exit(1); }
  }
  if (LIMIT > 0) files = files.slice(0, LIMIT);
  return files.map(file => ({
    file,
    jsonPath: path.join(SRC_DIR, file),
    data: JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8')),
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const records = loadRecords();
  const callNums = CALL_FILTER ? [CALL_FILTER] : [1,2,3,4,5,6];

  console.log(`\nseo-llm-fullpage.js`);
  console.log(`Records:  ${records.length}`);
  console.log(`Calls:    ${callNums.join(', ')}`);
  console.log(`Dry run:  ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`Mode:     ${DEV_MODE ? 'DEV (haiku)' : 'PROD (sonnet)'}`);
  console.log(`Models:   ${CALL_KEYS.map((k,i) => `call${i+1}:${FP.calls[k][MODE].label}`).join(', ')}`);
  console.log(`${'─'.repeat(60)}`);

  if (DRY_RUN) {
    records.forEach(r => {
      const needed = callNums.filter(c => callNeeded(r.data, c));
      console.log(`  ${r.data.slug}: calls needed: [${needed.join(',')}]`);
    });
    return;
  }

  if (!API_KEY) { console.error('✗ OPENROUTER_API_KEY not set'); process.exit(1); }

  let totalApplied = 0;
  let totalSkipped = 0;
  let totalFailed  = 0;

  for (let i = 0; i < records.length; i++) {
    const { file, jsonPath, data: page } = records[i];
    console.log(`\n[${i+1}/${records.length}] ${page.slug}`);

    let pageModified = false;

    for (const callNum of callNums) {
      if (!callNeeded(page, callNum)) {
        process.stdout.write(`  Call ${callNum}: already populated — skip\n`);
        totalSkipped++;
        continue;
      }

      process.stdout.write(`  Call ${callNum}: generating...`);

      const callCfg     = getCallConfig(callNum);
      const userContent = buildUserContent(page, callNum);
      const systemPrompt = PROMPTS[callNum];
      const validate    = VALIDATORS[callNum];

      const result = await callWithRetry(callCfg.model, systemPrompt, userContent, callCfg.maxTokens, validate);

      if (result.error) {
        process.stdout.write(` ✗ ${result.error}\n`);
        totalFailed++;
        continue;
      }

      // Apply to page object
      applyResult(page, callNum, result.data);
      pageModified = true;

      // Save immediately after each successful call
      fs.writeFileSync(jsonPath, JSON.stringify(page, null, 2), 'utf8');

      process.stdout.write(` ✓ saved\n`);
      totalApplied++;

      // Small delay between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    if (pageModified) {
      console.log(`  → ${page.slug} updated and saved`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ Applied: ${totalApplied} fields across ${records.length} pages`);
  console.log(`→ Skipped: ${totalSkipped} already-populated fields`);
  if (totalFailed) console.log(`✗ Failed:  ${totalFailed} fields — review manually`);
  console.log(`\nNext: node scripts/pipeline-render.js --all --force\n`);
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
