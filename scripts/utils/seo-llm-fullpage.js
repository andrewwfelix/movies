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
 *   node scripts/utils/seo-llm-fullpage.js --dev             -- use haiku models
 *   node scripts/utils/seo-llm-fullpage.js --force           -- rerun even if populated
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
const INPUT_DIR    = get('--input',  'pipeline/2-revised-v31');
const OUTPUT_DIR   = get('--output', null); // defaults based on mode below

// ── Paths + Config ───────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..', '..');
const SITE_URL    = 'https://booksversusmovies.com';
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-review.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('✗ config/seo-review.json not found');
  process.exit(1);
}

const CONFIG   = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const FP       = CONFIG.fullpage;
const DEV_MODE   = hasFlag('--dev') || process.env.DEV_MODE === 'true';
const MODE       = DEV_MODE ? 'dev' : 'prod';
const DEFAULT_OUT = DEV_MODE ? 'pipeline/2-revised-v31-haiku' : 'pipeline/2-revised-v31-sonnet';
const SRC_DIR      = path.join(ROOT, INPUT_DIR);
const OUT_DIR      = path.join(ROOT, OUTPUT_DIR || DEFAULT_OUT);
const ISSUES_DIR = path.join(ROOT, 'pipeline', 'content-issues');

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
    // On call 3 retry — if N/A is the issue, scrub it and retry with tighter prompt
    if (!validation.ok && attempt === 1) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    if (attempt === 2) return { error: `Validation failed: ${validation.reason}` };
  }
}

// ── Content issues logger ─────────────────────────────────────────────────────

function writeIssue(slug, callNum, issueType, detail) {
  if (!fs.existsSync(ISSUES_DIR)) fs.mkdirSync(ISSUES_DIR, { recursive: true });
  const filename = `${slug}-call${callNum}.json`;
  const payload  = {
    slug,
    callNum,
    issueType,
    detail,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ISSUES_DIR, filename), JSON.stringify(payload, null, 2), 'utf8');
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
- Every row must have feature, book, AND film values — no nulls, no N/A, no empty strings
- NEVER use "N/A" — if one version lacks something, describe what it has instead
  Example: instead of book:"N/A" use book:"Not applicable — prose medium" or rephrase the feature
- Parallel structure: both book and film values must be comparable phrases of similar length
- Punchy values — not prose. Max 6 words per cell.
- Feature names must be specific, not generic ("Point of view" not "POV difference")
- If a feature only applies to one version, reframe it so both versions have a meaningful value

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

  7: `You are an SEO specialist for BooksVersusMovies.com.
${VOICE_NOTE}

Convert each difference section title into a question-format H2 that targets People Also Ask queries.

STRICT RULES:
- Every question must include the book or film title
- Must end with a question mark
- Must match how a real person would type the query into Google
- Return one question per difference, in the same order as the input
- Keep questions specific — not "What is different?" but "Does the Gone Girl movie keep Amy's diary?"

Return ONLY a JSON array of strings, one per difference:
["Question for diff 1?", "Question for diff 2?", ...]`,
};

// ── Field already populated check ─────────────────────────────────────────────

function callNeeded(page, callNum) {
  const missing = v => v === null || v === undefined || (Array.isArray(v) && v.length === 0);
  switch(callNum) {
    case 1: return missing(page.primaryKeyword) || missing(page.winnerStatement) || missing(page.entities);
    case 2: return missing(page.snippetParagraph);
    case 3: return missing(page.atAGlanceTable);
    case 4: return missing(page.keyDifferencesList);
    case 5: return missing(page.optimizedH2s) || missing(page.optimizedH2s?.keyDifferences);
    case 6: return missing(page.og) || missing(page.og?.title);
    case 7: return (page.differences || []).some(d => d.question === null || d.question === undefined);
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
    case 7:
      // data is an array of question strings, apply to differences[] in order
      if (Array.isArray(data) && Array.isArray(page.differences)) {
        page.differences = page.differences.map((d, i) => ({
          ...d,
          question: data[i] || d.question || null,
        }));
      }
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

    case 7:
      return `${base}
Book title: ${page.bookTitle}
Film year: ${page.filmYear}
Difference titles to convert to questions:
${(page.differences || []).map((d, i) => `${i+1}. ${d.title}`).join('\n')}`;
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
  7: d => {
    if (!Array.isArray(d)) return fail('not an array');
    if (d.length === 0) return fail('empty array');
    if (!d.every(q => typeof q === 'string' && q.endsWith('?'))) return fail('all items must be strings ending with ?');
    return ok();
  },
};

// ── Page verification ─────────────────────────────────────────────────────────

function verifyPage(page, callNum) {
  const errors = [];
  const warn   = msg => errors.push(msg);

  switch(callNum) {
    case 1:
      if (!page.primaryKeyword || page.primaryKeyword.length < 5)
        warn('primaryKeyword too short or missing');
      if (!page.winnerStatement || page.winnerStatement.length < 10)
        warn('winnerStatement too short or missing');
      if (!Array.isArray(page.entities) || page.entities.length === 0)
        warn('entities array empty');
      break;

    case 2: {
      const para = page.snippetParagraph || '';
      const words = para.trim().split(/\s+/).length;
      if (words < 30)  warn(`snippetParagraph too short: ${words} words (min 30)`);
      if (words > 110) warn(`snippetParagraph too long: ${words} words (max 110)`);
      if (!para.match(/[.!?]$/)) warn('snippetParagraph does not end with punctuation');
      break;
    }

    case 3: {
      const table = page.atAGlanceTable || [];
      if (table.length < 3 || table.length > 6)
        warn(`atAGlanceTable wrong length: ${table.length} rows (need 3-6)`);
      table.forEach((row, i) => {
        if (!row.feature) warn(`table row ${i+1} missing feature`);
        if (!row.book)    warn(`table row ${i+1} missing book value`);
        if (!row.film)    warn(`table row ${i+1} missing film value`);
        // N/A is only a problem if the other cell has real content
        if (row.book === 'N/A' && row.film && row.film !== 'N/A' && row.film.length > 5)
          warn(`table row ${i+1} book value is N/A but film has content — parallel structure required`);
        if (row.film === 'N/A' && row.book && row.book !== 'N/A' && row.book.length > 5)
          warn(`table row ${i+1} film value is N/A but book has content — parallel structure required`);
      });
      break;
    }

    case 4: {
      const diffs = page.keyDifferencesList || [];
      if (diffs.length < 3 || diffs.length > 5)
        warn(`keyDifferencesList wrong length: ${diffs.length} (need 3-5)`);
      diffs.forEach((item, i) => {
        if (!item.label) warn(`keyDifferencesList item ${i+1} missing label`);
        if (!item.text)  warn(`keyDifferencesList item ${i+1} missing text`);
      });
      break;
    }

    case 5: {
      const h2s = page.optimizedH2s || {};
      if (!h2s.keyDifferences) warn('optimizedH2s missing keyDifferences');
      if (!h2s.readFirst)      warn('optimizedH2s missing readFirst');
      // Build a set of meaningful words from book title and slug
      const titleWords = [
        ...(page.bookTitle || '').toLowerCase().split(/\s+/),
        ...(page.slug || '').replace(/-/g,' ').toLowerCase().split(/\s+/),
        ...(page.bookTitle || '').toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g,'')),
      ].filter(w => w.length > 3);
      Object.entries(h2s).forEach(([k, v]) => {
        if (!v.endsWith('?')) warn(`optimizedH2s.${k} does not end with ?`);
        const vLower = v.toLowerCase();
        const hasTitle = titleWords.some(w => vLower.includes(w));
        if (!hasTitle) warn(`optimizedH2s.${k} does not contain book or film title`);
      });
      break;
    }

    case 6: {
      const og = page.og || {};
      if (!og.title)       warn('og.title missing');
      if (!og.description) warn('og.description missing');
      if (og.title && og.title.length > 60)
        warn(`og.title too long: ${og.title.length} chars (max 60)`);
      if (og.description && og.description.length > 150)
        warn(`og.description too long: ${og.description.length} chars (max 150)`);
      if (!og.image || !og.image.startsWith('https://'))
        warn('og.image missing or not a valid URL');
      break;
    }

    case 7: {
      const diffs = page.differences || [];
      const nullQ = diffs.filter(d => !d.question).length;
      if (nullQ > 0) warn(`${nullQ} differences[] still have null question`);
      diffs.forEach((d, i) => {
        if (d.question && !d.question.endsWith('?'))
          warn(`differences[${i}].question does not end with ?`);
      });
      break;
    }
  }

  return { ok: errors.length === 0, errors };
}

// ── Call config helpers ──────────────────────────────────────────────────────

const CALL_KEYS = ['1_identity','2_snippet','3_table','4_differences','5_h2s','6_social','7_questions'];

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
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR))    fs.mkdirSync(OUT_DIR,    { recursive: true });
  if (!fs.existsSync(ISSUES_DIR)) fs.mkdirSync(ISSUES_DIR, { recursive: true });

  let files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  if (SLUG_FILTER) {
    files = files.filter(f => f.replace('.json','') === SLUG_FILTER);
    if (!files.length) { console.error(`✗ No JSON for: ${SLUG_FILTER}`); process.exit(1); }
  }
  if (LIMIT > 0) files = files.slice(0, LIMIT);
  return files.map(file => {
    // Read from input dir — check output dir first in case of partial run
    const outPath = path.join(OUT_DIR, file);
    const srcPath = path.join(SRC_DIR, file);
    const readPath = fs.existsSync(outPath) ? outPath : srcPath;
    return {
      file,
      srcPath,
      outPath,
      data: JSON.parse(fs.readFileSync(readPath, 'utf8')),
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const records = loadRecords();
  const callNums = CALL_FILTER ? [CALL_FILTER] : [1,2,3,4,5,6,7];
  const FORCE    = hasFlag('--force');

  console.log(`\nseo-llm-fullpage.js`);
  console.log(`Input:    ${INPUT_DIR}`);
  console.log(`Output:   ${OUTPUT_DIR || DEFAULT_OUT}`);
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
    const { file, srcPath, outPath, data: page } = records[i];
    console.log(`\n[${i+1}/${records.length}] ${page.slug}`);

    let pageModified = false;

    for (const callNum of callNums) {
      if (!FORCE && !callNeeded(page, callNum)) {
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
        writeIssue(page.slug, callNum, 'api_error', result.error);
        totalFailed++;
        continue; // skip this call, keep going with remaining calls + pages
      }

      // Apply to page object
      applyResult(page, callNum, result.data);

      // Verify before saving
      const verification = verifyPage(page, callNum);
      if (!verification.ok) {
        process.stdout.write(` ✗ verification failed:\n`);
        verification.errors.forEach(e => console.log(`    → ${e}`));
        writeIssue(page.slug, callNum, 'verification_failed', verification.errors.join(' | '));
        totalFailed++;
        continue; // skip saving this call, keep going with remaining calls + pages
      }

      pageModified = true;

      // Save immediately after each successful verified call
      fs.writeFileSync(records[i].outPath, JSON.stringify(page, null, 2), 'utf8');

      process.stdout.write(` ✓ verified + saved\n`);
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
  if (totalFailed) {
    console.log(`✗ Failed:  ${totalFailed} fields — issues logged to scripts/utils/content-issues/`);
  }
  console.log(`\nNext: node scripts/pipeline-render.js --all --force\n`);
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
