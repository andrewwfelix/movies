#!/usr/bin/env node

/**
 * pipeline-guide.js
 * BooksVersusMovies.com — 2026 Adaptations Guide generator
 *
 * Fetches live data from trusted sources via Grok (web-aware model),
 * aggregates into structured JSON, then renders upcoming-adaptations.html.
 * Falls back gracefully if scrape yields fewer than MIN_TITLES results.
 *
 * Usage:
 *   node scripts/pipeline-guide.js                (aggregate + render)
 *   node scripts/pipeline-guide.js --dry          (validate config, no API calls)
 *   node scripts/pipeline-guide.js --force        (overwrite existing output)
 *   node scripts/pipeline-guide.js --aggregate-only  (skip render)
 *   node scripts/pipeline-guide.js --render-only     (skip aggregation, use existing JSON)
 *
 * Outputs:
 *   data/guides/upcoming-adaptations.json   structured guide data
 *   upcoming-adaptations.html               rendered guide page (project root)
 *
 * Model: config/models.json → "guide" key
 *   Primary:  x-ai/grok-3-mini  (web-aware, ideal for live aggregation)
 *   Fallback: anthropic/claude-sonnet-4-5
 *
 * Destination: scripts/pipeline-guide.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const DRY_RUN        = hasFlag('--dry');
const FORCE          = true; // aggregation always runs fresh — this script is designed for scheduled execution
const AGGREGATE_ONLY = hasFlag('--aggregate-only');
const RENDER_ONLY    = hasFlag('--render-only');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');

// ── Render nav from config/nav.json ──────────────────────────────────────────

function renderNav() {
  const navPath = path.join(ROOT, 'config', 'nav.json');
  if (!fs.existsSync(navPath)) {
    // Fallback if nav.json missing
    return `<a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/upcoming-adaptations">Upcoming</a> &nbsp;&middot;&nbsp;
      <a href="/spotlight-lonesome-dove">Featured</a> &nbsp;&middot;&nbsp;
      <a href="/auteurs">The Auteurs</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>`;
  }
  const items = JSON.parse(fs.readFileSync(navPath, 'utf8')).items;
  return items
    .map((item, i) => {
      const mid = i < items.length - 1 ? ` &nbsp;&middot;&nbsp;` : '';
      return `<a href="${item.href}">${item.label}</a>${mid}`;
    })
    .join('\n      ');
}

const MODELS_PATH  = path.join(ROOT, 'config', 'models.json');
const SOURCES_PATH = path.join(ROOT, 'data', 'guides', 'sources.json');
const PROMPT_PATH  = path.join(ROOT, 'scripts', 'prompts', 'guide-aggregator.txt');
const OUTPUT_JSON  = path.join(ROOT, 'data', 'guides', 'upcoming-adaptations.json');
const OUTPUT_HTML  = path.join(ROOT, 'upcoming-adaptations.html');
const GUIDES_DIR   = path.join(ROOT, 'data', 'guides');
const RAW_DIR      = path.join(ROOT, 'data', 'guides', 'raw');
const ITEMS_DIR    = path.join(ROOT, 'data', 'guides', 'items');
const REVIEWS_DIR  = path.join(ROOT, 'data', 'reviews');

const SITE_URL  = 'https://booksversusmovies.com';
const GA_ID     = 'G-P0DY0XDWVV';
const NOW       = new Date();
const TODAY     = NOW.toISOString().split('T')[0];
const MIN_TITLES    = 5;
const UPDATED_LABEL = NOW.toLocaleString('en-US', { month: 'long', year: 'numeric' });

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
  const config      = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8'));
  const aggregators = config.guide?.aggregators;

  if (aggregators && Array.isArray(aggregators) && aggregators.length > 0) {
    return aggregators.map(a => ({
      id:          a.id          || a.model,
      model:       a.model       || 'x-ai/grok-3',
      maxTokens:   a.maxTokens   || 8000,
      temperature: a.temperature || 0.3,
    }));
    // Note: editorial entry is included in the array so run() can find it
    // via models.find(m => m.id === 'editorial'). It is excluded from
    // parallel aggregation because the aggregation loop filters on id.
  }

  // Legacy single-model fallback
  return [{
    id:          'primary',
    model:       config.guide?.model       || 'x-ai/grok-3',
    maxTokens:   config.guide?.maxTokens   || 8000,
    temperature: config.guide?.temperature || 0.3,
  }];
}

// ── Merge and deduplicate results across models ───────────────────────────────
// Slug is the unique key. When the same title appears from multiple models,
// the version with more fields populated wins. Results sorted by release date.

function mergeResults(allResults) {
  const seen   = new Map();
  const counts = {};

  for (const items of allResults) {
    for (const item of items) {
      const slug = item.slug;
      if (!slug) continue;
      counts[slug] = (counts[slug] || 0) + 1;
      if (!seen.has(slug)) {
        seen.set(slug, item);
      } else {
        const existing   = seen.get(slug);
        const existScore = Object.values(existing).filter(v => v !== null && v !== undefined && v !== '').length;
        const newScore   = Object.values(item).filter(v => v !== null && v !== undefined && v !== '').length;
        if (newScore > existScore) seen.set(slug, item);
      }
    }
  }

  const merged = Array.from(seen.values());

  // Sort: confirmed dates first earliest, then TBA
  merged.sort((a, b) => {
    const da = parseReleaseDate(a.expectedRelease);
    const db = parseReleaseDate(b.expectedRelease);
    if (da && db) return da - db;
    if (da)       return -1;
    if (db)       return  1;
    return 0;
  });

  return { merged, counts };
}

// ── Claude editorial pass ─────────────────────────────────────────────────────
// After 3 models aggregate, Claude reviews every notes field for quality,
// voice, and accuracy. Rewrites weak or generic copy in BooksVersusMovies voice.
// Returns the improved array. Runs as a single batched call for efficiency.

// Receives a single item object, rewrites only the notes field.
// Returns the item with an updated notes field.
// Throws on failure — caller handles retry and fallback.
async function runEditorialPass(item, editorialModel) {
  const systemPrompt = `You are the final editor for BooksVersusMovies.com.

SITE VOICE:
- Precise, opinionated, no hedging
- Writes like a knowledgeable critic with genuine taste
- Specific details — cast, director, what makes the source material worth reading
- Never generic ("a gripping story", "beloved novel") — always specific
- Ends with one clear recommendation: should the reader read the book first?
- Atlantic-style criticism, not BuzzFeed

YOUR TASK:
Rewrite the "notes" field of the single adaptation entry you receive.
The notes should be a solid paragraph of 4-6 sentences covering:
  1. What the book is about and who it is for
  2. What makes this adaptation notable (director, cast, studio)
  3. Any production news or context worth knowing
  4. An honest read-first recommendation

Do not change any other fields. Return ONLY a JSON object with a single key: "notes".
No explanation, no markdown fences.`;

  const userContent = `Rewrite the notes field for this entry:\n${JSON.stringify(item, null, 2)}`;

  const raw    = await callModel(editorialModel.model, systemPrompt, userContent, editorialModel.maxTokens, editorialModel.temperature);
  const result = parseJSON(raw);

  if (!result || typeof result.notes !== 'string' || result.notes.trim().length < 50) {
    throw new Error('Invalid notes response');
  }

  return { ...item, notes: result.notes.trim() };
}

// ── API call ──────────────────────────────────────────────────────────────────

function callModel(model, systemPrompt, userContent, maxTokens, temperature) {
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
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   SITE_URL,
        'X-Title':        'BooksVersusMovies Guide',
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
          if (!text) { reject(new Error('Empty response from model')); return; }
          resolve(text);
        } catch (e) { reject(new Error(`Response parse error: ${e.message}`)); }
      });
    });

    req.setTimeout(90000, () => req.destroy(new Error('Request timed out after 90s')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Parse JSON from model response ───────────────────────────────────────────

function parseJSON(text) {
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try { return JSON.parse(clean); } catch {}

  try {
    const { jsonrepair } = require('jsonrepair');
    return JSON.parse(jsonrepair(clean));
  } catch {}

  throw new Error('Could not parse model response as JSON');
}

// ── Validate aggregated output ────────────────────────────────────────────────

function validateGuideData(data) {
  if (!Array.isArray(data)) throw new Error('Guide data must be a JSON array');
  if (data.length < MIN_TITLES) {
    throw new Error(
      `Only ${data.length} titles returned — below minimum of ${MIN_TITLES}. ` +
      `Check sources or use --render-only with existing data/guides/upcoming-adaptations.json.`
    );
  }

  const required = ['bookTitle', 'author', 'slug', 'expectedRelease', 'adaptationType', 'studioOrStreamer'];
  const errors   = [];

  data.forEach((item, i) => {
    const missing = required.filter(f => !item[f]);
    if (missing.length > 0) errors.push(`[${i}] "${item.bookTitle || 'unknown'}": missing ${missing.join(', ')}`);
    if (!['film', 'series'].includes(item.adaptationType)) {
      errors.push(`[${i}] "${item.bookTitle}": adaptationType must be "film" or "series"`);
    }
    if (item.hypeLevel !== undefined && ![1, 2, 3].includes(item.hypeLevel)) {
      errors.push(`[${i}] "${item.bookTitle}": hypeLevel must be 1, 2, or 3`);
    }
  });

  if (errors.length > 0) throw new Error(`Validation errors:\n${errors.map(e => '  - ' + e).join('\n')}`);
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

const esc = s => (s || '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Release date parsing ──────────────────────────────────────────────────────
// Returns a Date if we can pin a specific date or month.
// Returns null for quarter-only ("Q3 2026") or TBA — can't confirm it has passed.

const MONTH_NUMS = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
};

function parseReleaseDate(str) {
  if (!str || /^tba$/i.test(str.trim())) return null;
  const s = str.trim();

  // "March 20, 2026" or "November 20, 2026"
  const full = s.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (full) {
    const mon = MONTH_NUMS[full[1].toLowerCase()];
    if (mon) return new Date(parseInt(full[3]), mon - 1, parseInt(full[2]));
  }

  // "March 2026" — use first of month as floor
  const monthYear = s.match(/^(\w+)\s+(\d{4})$/i);
  if (monthYear) {
    const mon = MONTH_NUMS[monthYear[1].toLowerCase()];
    if (mon) return new Date(parseInt(monthYear[2]), mon - 1, 1);
  }

  // Any string containing a month name and year
  const anyMonth = s.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b.*?(\d{4})/i);
  if (anyMonth) {
    const mon = MONTH_NUMS[anyMonth[1].toLowerCase()];
    const yr  = parseInt(anyMonth[2]);
    if (mon && yr) return new Date(yr, mon - 1, 1);
  }

  // Quarter strings ("Q1 2026") — return null, can't pinpoint to a day
  if (/q[1-4]/i.test(s)) return null;

  return null;
}

// Returns true only if the release is definitively in the past.
// Conservative: if we can't parse a date we keep the item.
function isInPast(str) {
  const d = parseReleaseDate(str);
  if (!d) return false;
  return d < NOW;
}

function groupByQuarter(data) {
  const quarters = { Q1: [], Q2: [], Q3: [], Q4: [], TBA: [] };

  for (const item of data) {
    const r      = (item.expectedRelease || 'TBA').toLowerCase();
    const d      = parseReleaseDate(item.expectedRelease);
    let bucket   = 'TBA';

    if (d) {
      const mon = d.getMonth() + 1;
      if      (mon <= 3) bucket = 'Q1';
      else if (mon <= 6) bucket = 'Q2';
      else if (mon <= 9) bucket = 'Q3';
      else               bucket = 'Q4';
    } else if (r.includes('q1')) bucket = 'Q1';
    else if   (r.includes('q2')) bucket = 'Q2';
    else if   (r.includes('q3')) bucket = 'Q3';
    else if   (r.includes('q4')) bucket = 'Q4';

    quarters[bucket].push(item);
  }
  return quarters;
}

function hypeBadge(level) {
  if (level === 3) return `<span class="hype hype-3">High Hype</span>`;
  if (level === 2) return `<span class="hype hype-2">Anticipated</span>`;
  return `<span class="hype hype-1">Watch List</span>`;
}

function typeBadge(type) {
  return type === 'series'
    ? `<span class="type-badge type-series">Series</span>`
    : `<span class="type-badge type-film">Film</span>`;
}

function getExistingReviewSlugs() {
  if (!fs.existsSync(REVIEWS_DIR)) return new Set();
  return new Set(
    fs.readdirSync(REVIEWS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );
}

function renderCard(item, existingSlugs) {
  const hasReview  = existingSlugs.has(item.slug);
  const Tag        = hasReview ? 'a' : 'div';
  const hrefAttr   = hasReview ? ` href="/${esc(item.slug)}"` : '';
  const reviewClass = hasReview ? ' has-review' : '';
  const reviewBadge = hasReview ? `<span class="review-badge">We&rsquo;ve covered this</span>` : '';

  return `
        <${Tag} class="guide-card${reviewClass}"${hrefAttr}>
          <div class="card-cover">
            <img src="images/${esc(item.slug)}.jpg"
                 alt="${esc(item.bookTitle)} book cover"
                 loading="lazy"
                 onerror="this.parentElement.classList.add('no-cover')">
          </div>
          <div class="card-content">
            <div class="card-meta-top">
              ${typeBadge(item.adaptationType)}
              ${hypeBadge(item.hypeLevel || 1)}
              ${reviewBadge}
            </div>
            <h3 class="card-title">${esc(item.bookTitle)}</h3>
            <p class="card-author">by ${esc(item.author)}</p>
            <div class="card-release">
              <span class="release-label">Release</span>
              <span class="release-date">${esc(item.expectedRelease)}</span>
            </div>
            <div class="card-studio">${esc(item.studioOrStreamer)}</div>
            ${item.keyCast ? `<div class="card-cast">Starring ${esc(item.keyCast)}</div>` : ''}
            ${item.notes   ? `<p class="card-notes">${esc(item.notes)}</p>`               : ''}
          </div>
        </${Tag}>`;
}

function renderQuarterSection(label, items, existingSlugs) {
  if (items.length === 0) return '';
  return `
      <section class="quarter-section" id="${label.toLowerCase().replace(/\s.*/,'')}">
        <h2 class="quarter-heading">${esc(label)}</h2>
        <div class="guide-grid">
          ${items.map(item => renderCard(item, existingSlugs)).join('')}
        </div>
      </section>`;
}

// ── Render full HTML page ─────────────────────────────────────────────────────

function renderHTML(data) {
  // Filter out titles with a confirmed past release date
  const filtered = data.filter(item => !isInPast(item.expectedRelease));
  const dropped  = data.length - filtered.length;
  if (dropped > 0) console.log(`  → Filtered ${dropped} already-released title${dropped > 1 ? 's' : ''} from guide`);

  const quarters      = groupByQuarter(filtered);
  const existingSlugs = getExistingReviewSlugs();
  const totalCount    = filtered.length;
  const coveredCount  = filtered.filter(d => existingSlugs.has(d.slug)).length;
  const filmCount     = filtered.filter(d => d.adaptationType === 'film').length;
  const seriesCount   = filtered.filter(d => d.adaptationType === 'series').length;

  const quarterSections = [
    ['Q1', 'January \u2013 March'],
    ['Q2', 'April \u2013 June'],
    ['Q3', 'July \u2013 September'],
    ['Q4', 'October \u2013 December'],
    ['TBA', 'Date Not Yet Confirmed'],
  ].map(([q, label]) => renderQuarterSection(label, quarters[q], existingSlugs)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Book vs Movie Adaptations 2026 — BooksVersusMovies.com</title>
  <meta name="description" content="Every upcoming book vs movie adaptation in 2026 — confirmed release dates, cast, and our honest read-first verdict where we've already covered it.">
  <link rel="canonical" href="${SITE_URL}/upcoming-adaptations">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* ── Guide page styles ─────────────────────────────────────── */
    .guide-hero {
      background: #1a1a1a;
      color: #fff;
      padding: 3rem 1.5rem 2.5rem;
      text-align: center;
    }
    .guide-hero h1 { font-size: 2.2rem; margin: 0 0 0.4rem; color: #fff; }
    .guide-updated  { font-size: 1rem; color: #bbb; margin: 0 0 0.5rem; letter-spacing: 0.02em; }
    .guide-subtitle { font-size: 1.05rem; color: #777; margin: 0 0 1.75rem; font-style: italic; }

    .guide-stats {
      display: flex;
      justify-content: center;
      gap: 2.5rem;
      flex-wrap: wrap;
    }
    .guide-stat strong { display: block; font-size: 2rem; color: #fff; line-height: 1; }
    .guide-stat span   { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }

    .guide-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem; }

    .quarter-section  { margin-bottom: 3.5rem; }
    .quarter-heading  {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a1a1a;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 0.5rem;
      margin: 0 0 1.5rem;
    }

    .guide-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .guide-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1.25rem;
      display: flex;
      flex-direction: row;
      gap: 1.5rem;
      color: inherit;
      align-items: flex-start;
    }
    a.guide-card { text-decoration: none; transition: box-shadow 0.15s; }
    a.guide-card.has-review { border-left: 3px solid #2a7a2a; }
    a.guide-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }

    .card-meta-top { display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; }

    .type-badge {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.15rem 0.4rem;
      border-radius: 2px;
    }
    .type-film   { background: #e8f0fe; color: #1a56db; }
    .type-series { background: #fef3e8; color: #c05621; }

    .hype        { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 2px; }
    .hype-3      { background: #fff3cd; color: #92400e; }
    .hype-2      { background: #e0f2fe; color: #075985; }
    .hype-1      { background: #f5f5f5; color: #555; }

    .review-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: #2a7a2a;
      background: #f0faf0;
      padding: 0.15rem 0.4rem;
      border-radius: 2px;
    }

    .card-title  { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; margin: 0; line-height: 1.3; }
    .card-author { font-size: 0.78rem; color: #777; margin: 0; }

    .card-release  { display: flex; align-items: baseline; gap: 0.5rem; }
    .release-label { font-size: 0.7rem; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
    .release-date  { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; }

    .card-studio { font-size: 0.78rem; color: #666; }
    .card-cast   { font-size: 0.78rem; color: #666; font-style: italic; }
    .card-notes  { font-size: 0.8rem; color: #444; margin: 0; line-height: 1.55; }

    .guide-footer-note {
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      padding: 1.25rem 1.5rem;
      text-align: center;
      font-size: 0.83rem;
      color: #666;
    }
    .guide-footer-note a { color: #1a1a1a; font-weight: 600; }

    .updated-note {
      text-align: center;
      font-size: 0.75rem;
      color: #aaa;
      padding: 1rem 0 0;
      border-top: 1px solid #eee;
      margin-top: 1rem;
    }
    .updated-note a { color: #666; }


    .card-cover {
      flex: 0 0 110px;
      width: 110px;
    }
    .card-cover img {
      width: 110px;
      height: 165px;
      object-fit: cover;
      border-radius: 3px;
      display: block;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }
    .card-cover.no-cover { display: none; }
    .card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.6rem; }

    .guide-intro {
      background: #f9f9f9;
      border-bottom: 1px solid #e0e0e0;
      padding: 1.5rem;
    }
    .guide-intro-inner {
      max-width: 780px;
      margin: 0 auto;
    }
    .guide-intro p {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      color: #333;
      line-height: 1.65;
    }
    .guide-intro p:last-child { margin-bottom: 0; }

    @media (max-width: 600px) {
      .guide-hero h1  { font-size: 1.6rem; }
      .guide-stats    { gap: 1.25rem; }
      .guide-content  { padding: 1.5rem 1rem; }
      .guide-card     { flex-direction: column; }
      .card-cover     { width: 100%; flex: none; }
      .card-cover img { width: 100%; height: auto; max-height: 200px; object-fit: cover; }
    }

    @media print {
      header, .guide-footer-note, footer { display: none !important; }
      .guide-hero { background: #fff; color: #1a1a1a; padding: 1rem 0; }
      .guide-hero h1, .guide-subtitle { color: #1a1a1a; }
      .guide-stat strong { color: #1a1a1a; }
      .guide-stat span   { color: #555; }
      .guide-grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .quarter-section { page-break-before: always; }
      .quarter-section:first-child { page-break-before: avoid; }
      a.guide-card { border: 1px solid #ccc !important; box-shadow: none !important; }
    }
  </style>

  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  </script>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="site-logo" href="/">Books<span>Versus</span>Movies</a>
    <nav>
      ${renderNav()}
    </nav>
  </div>
</header>

<div class="guide-hero">
  <h1>Upcoming Book vs Movie Adaptations</h1>
  <p class="guide-updated">Updated ${UPDATED_LABEL}</p>
  <p class="guide-subtitle">What&rsquo;s coming to screens &mdash; past releases automatically removed.</p>
  <div class="guide-stats">
    <div class="guide-stat">
      <strong>${totalCount}</strong>
      <span>Adaptations</span>
    </div>
    <div class="guide-stat">
      <strong>${filmCount}</strong>
      <span>Films</span>
    </div>
    <div class="guide-stat">
      <strong>${seriesCount}</strong>
      <span>Series</span>
    </div>
    <div class="guide-stat">
      <strong>${coveredCount}</strong>
      <span>We&rsquo;ve Covered</span>
    </div>
  </div>
</div>


<div class="guide-intro">
  <div class="guide-intro-inner">
    <p>The remaining slate for 2026 is one of the strongest in recent memory. Christopher Nolan brings Homer&rsquo;s <em>The Odyssey</em> to IMAX in July. Andy Weir&rsquo;s <em>Project Hail Mary</em> stars Ryan Gosling. Colleen Hoover&rsquo;s <em>Verity</em> arrives as a psychological thriller with Anne Hathaway and Dakota Johnson. <em>The Hunger Games: Sunrise on the Reaping</em> closes out the year in November.</p>
    <p>This page shows only what hasn&rsquo;t come out yet as of ${UPDATED_LABEL}, and is refreshed each time the script runs. Where we&rsquo;ve published a full comparison the card links to our verdict. Where we haven&rsquo;t, you&rsquo;ll find release date, cast, and streamer to help you decide whether to read the book first.</p>
  </div>
</div>

<div class="guide-content">
  ${quarterSections}
  <p class="updated-note">
    Sources: Deadline, Hollywood Reporter, BookBub, Rotten Tomatoes &nbsp;&middot;&nbsp;
    <a href="/">&#8592; Back to all comparisons</a>
  </p>
</div>

<div class="guide-footer-note">
  Cards marked <strong>We&rsquo;ve covered this</strong> link to our full book vs. movie comparison.
  &nbsp;&middot;&nbsp;
  <a href="/">Browse all ${coveredCount > 0 ? '164' : ''} comparisons &rarr;</a>
</div>

<footer>
  <div class="footer-inner">
    <p>&copy; ${new Date().getFullYear()} BooksVersusMovies.com &nbsp;&mdash;&nbsp;
      <a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>
    </p>
    <p style="margin-top:0.5rem;font-size:0.75rem;color:#888;">
      As an Amazon Associate I earn from qualifying purchases. &nbsp;&middot;&nbsp; RavensEdge AI LLC
    </p>
  </div>
</footer>

</body>
</html>`;
}

// ── Dry run ───────────────────────────────────────────────────────────────────

function dryRun(models) {
  const issues = [];
  if (!fs.existsSync(SOURCES_PATH)) issues.push(`✗ sources.json not found: ${SOURCES_PATH}`);
  if (!fs.existsSync(PROMPT_PATH))  issues.push(`✗ prompt not found: ${PROMPT_PATH}`);
  if (!fs.existsSync(MODELS_PATH))  issues.push(`✗ models.json not found: ${MODELS_PATH}`);
  if (!API_KEY)                     issues.push(`✗ OPENROUTER_API_KEY not set in .env`);

  const existingJSON = fs.existsSync(OUTPUT_JSON);
  const existingHTML = fs.existsSync(OUTPUT_HTML);

  console.log(`\npipeline-guide.js — DRY RUN`);
  console.log(`${'─'.repeat(52)}`);
  models.forEach(m => console.log(`  Aggregator:   ${m.id} — ${m.model} (temp: ${m.temperature})`));
  console.log(`  sources.json: ${fs.existsSync(SOURCES_PATH) ? '✓ found' : '✗ missing'}`);
  console.log(`  prompt:       ${fs.existsSync(PROMPT_PATH)  ? '✓ found' : '✗ missing'}`);
  console.log(`  models.json:  ${fs.existsSync(MODELS_PATH)  ? '✓ found' : '✗ missing'}`);
  console.log(`  API key:      ${API_KEY ? '✓ set' : '✗ missing'}`);
  console.log(`  Output JSON:  ${existingJSON ? 'exists — will be overwritten (aggregation always runs fresh)' : 'will be created'}`);
  console.log(`  Output HTML:  ${existingHTML ? 'exists (will be overwritten)' : 'will be created'}`);
  console.log(`  data/guides/: ${fs.existsSync(GUIDES_DIR)  ? '✓ exists' : '⚠  will be created'}`);

  const activeFlags = [FORCE && '--force', AGGREGATE_ONLY && '--aggregate-only', RENDER_ONLY && '--render-only'].filter(Boolean);
  console.log(`  Flags:        ${activeFlags.length ? activeFlags.join(' ') : 'none'}`);
  console.log(`${'─'.repeat(52)}`);

  if (existingJSON && RENDER_ONLY) {
    const data = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    const q    = groupByQuarter(data);
    console.log(`  Existing JSON: ${data.length} adaptations`);
    ['Q1','Q2','Q3','Q4','TBA'].forEach(k => {
      if (q[k].length > 0) console.log(`    ${k}: ${q[k].length}`);
    });
    console.log('');
  }

  if (issues.length > 0) {
    issues.forEach(i => console.log(`  ${i}`));
    console.log(`\n[DRY] Fix the issues above before running.`);
    process.exit(1);
  }

  console.log(`[DRY] All checks passed. Run without --dry to generate.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const models = loadModels();

  if (DRY_RUN) {
    dryRun(models);
    return;
  }

  if (!API_KEY) {
    console.error('✗ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  for (const dir of [GUIDES_DIR, RAW_DIR, ITEMS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`\npipeline-guide.js`);
  console.log(`Models: ${models.map(m => m.id).join(' + ')}`);
  console.log(`Date:   ${TODAY}`);
  console.log(`${'─'.repeat(52)}`);

  let guideData;

  // ── Step 1: Aggregate ──────────────────────────────────────────────────────

  if (!RENDER_ONLY) {
    {
      if (!fs.existsSync(SOURCES_PATH)) { console.error(`  ✗ sources.json not found: ${SOURCES_PATH}`); process.exit(1); }
      if (!fs.existsSync(PROMPT_PATH))  { console.error(`  ✗ Prompt not found: ${PROMPT_PATH}`);        process.exit(1); }

      const sources     = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
      const prompt      = fs.readFileSync(PROMPT_PATH, 'utf8').trim();
      const userContent = `Today's date: ${TODAY}\n\nSources:\n${JSON.stringify(sources, null, 2)}\n\nAggregate all confirmed upcoming book-to-screen adaptations not yet released as of ${TODAY}. Include confirmed titles releasing in the next 12 months.`;

      console.log(`  Aggregators: ${models.filter(m => m.id !== 'editorial').map(m => m.id).join(', ')}`);
      console.log(`  Editor:      ${(models.find(m => m.id === 'editorial') || {model: 'claude-sonnet-4-5 (default)'}).model}`);
      console.log(``);

      // ── Run all aggregators in parallel ──────────────────────────────────
      const aggregationModels = models.filter(m => m.id !== 'editorial');
      const modelResults = await Promise.all(aggregationModels.map(async m => {
        process.stdout.write(`  ↻  ${m.id} (${m.model})...`);
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const raw   = await callModel(m.model, prompt, userContent, m.maxTokens, m.temperature);
            const items = parseJSON(raw);
            if (!Array.isArray(items) || items.length === 0) throw new Error('Empty or non-array response');
            // Write raw output for this model
            fs.writeFileSync(path.join(RAW_DIR, `${m.id}.json`), JSON.stringify(items, null, 2), 'utf8');
            process.stdout.write(` ✓ (${items.length} titles)\n`);
            return { id: m.id, items };
          } catch (e) {
            if (attempt === maxRetries) {
              process.stdout.write(` ✗ (${e.message})\n`);
              console.log(`     → Excluded from merge`);
              return { id: m.id, items: [] };
            }
            process.stdout.write(` ↺ retry ${attempt}...`);
            await new Promise(r => setTimeout(r, 10000 * attempt));
          }
        }
        return { id: m.id, items: [] };
      }));

      // ── Merge and write per-item files ───────────────────────────────────
      const successful = modelResults.filter(r => r.items.length > 0);
      if (successful.length === 0) {
        console.error(`  ✗ All aggregators failed — no data to merge`);
        process.exit(1);
      }

      const { merged, counts } = mergeResults(successful.map(r => r.items));
      const multiSource = Object.values(counts).filter(n => n > 1).length;
      console.log(``);
      console.log(`  ✓  ${merged.length} unique titles after merge (${multiSource} confirmed by 2+ models)`);

      // Write one file per title into items/
      for (const item of merged) {
        fs.writeFileSync(path.join(ITEMS_DIR, `${item.slug}.json`), JSON.stringify(item, null, 2), 'utf8');
      }
      console.log(`  ✓  ${merged.length} item files → data/guides/items/`);

      // ── Editorial pass — one item at a time ──────────────────────────────
      const editorialModel = models.find(m => m.id === 'editorial') || {
        model:       'anthropic/claude-sonnet-4-5',
        maxTokens:   2000,
        temperature: 0.4,
      };

      console.log(``);
      console.log(`  Editorial pass (${editorialModel.model})...`);

      let editPassed = 0;
      let editFailed = 0;

      for (const item of merged) {
        const itemPath = path.join(ITEMS_DIR, `${item.slug}.json`);
        process.stdout.write(`  ↻  ${item.slug}...`);

        const maxRetries = 3;
        let success = false;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const edited = await runEditorialPass(item, editorialModel);
            // Merge edited notes back, preserve all other fields
            const final = { ...item, notes: edited.notes };
            fs.writeFileSync(itemPath, JSON.stringify(final, null, 2), 'utf8');
            process.stdout.write(` ✓\n`);
            // Update merged array in place
            Object.assign(item, final);
            editPassed++;
            success = true;
            break;
          } catch (e) {
            if (attempt === maxRetries) {
              process.stdout.write(` ✗ (${e.message}) — keeping original\n`);
              editFailed++;
            } else {
              process.stdout.write(` ↺ retry ${attempt}...`);
              await new Promise(r => setTimeout(r, 10000 * attempt));
            }
          }
        }
      }

      console.log(``);
      console.log(`  Editorial: ${editPassed} revised, ${editFailed} kept original`);

      try {
        validateGuideData(merged);
      } catch (e) {
        console.error(`  ✗ Validation failed: ${e.message}`);
        process.exit(1);
      }

      guideData = merged;
      fs.writeFileSync(OUTPUT_JSON, JSON.stringify(guideData, null, 2), 'utf8');
      const q = groupByQuarter(guideData);
      console.log(`  ✓  → data/guides/upcoming-adaptations.json`);
      ['Q1','Q2','Q3','Q4','TBA'].forEach(k => { if (q[k].length > 0) console.log(`       ${k}: ${q[k].length}`); });
    }
  } else {
    if (!fs.existsSync(OUTPUT_JSON)) {
      console.error(`  ✗ No existing JSON at ${OUTPUT_JSON} — run without --render-only first.`);
      process.exit(1);
    }
    guideData = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    console.log(`  → Loaded existing JSON: ${guideData.length} adaptations`);
  }

  // ── Step 2: Render HTML ────────────────────────────────────────────────────

  if (!AGGREGATE_ONLY) {
    process.stdout.write(`  ↻  Rendering HTML...`);
    const html = renderHTML(guideData);
    fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
    process.stdout.write(` ✓\n`);
    console.log(`  ✓  → upcoming-adaptations.html`);
  }

  // ── Checkpoint ─────────────────────────────────────────────────────────────

  const jsonOk = fs.existsSync(OUTPUT_JSON);
  const htmlOk = AGGREGATE_ONLY ? true : fs.existsSync(OUTPUT_HTML);

  console.log(`\n${'─'.repeat(52)}`);
  if (jsonOk && htmlOk) {
    console.log(`CHECKPOINT PASSED`);
    if (!AGGREGATE_ONLY) {
      console.log(`\nNext steps:`);
      console.log(`  1. Open upcoming-adaptations.html in browser to review`);
      console.log(`  2. node scripts\\export-guide-pdf.js`);
      console.log(`  3. git add . && git commit -m "guide: upcoming adaptations ${TODAY}" && git push`);
    }
  } else {
    console.log(`CHECKPOINT FAILED`);
    if (!jsonOk) console.log(`  ✗ data/guides/upcoming-adaptations.json not written`);
    if (!htmlOk) console.log(`  ✗ upcoming-adaptations.html not written`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
