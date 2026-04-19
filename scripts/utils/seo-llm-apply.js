#!/usr/bin/env node

/**
 * scripts/utils/seo-llm-apply.js
 * BooksVersusMovies.com — Claude final adjudication of SEO suggestions
 *
 * Step 2 of 3. Reads seo-review-latest.json, passes the three model
 * suggestions for each high/medium priority page to Claude Sonnet,
 * which picks the best elements and writes the definitive title and meta.
 * Saves accepted values back into the JSON.
 *
 * Usage:
 *   node scripts/utils/seo-llm-apply.js             -- all high+medium pages
 *   node scripts/utils/seo-llm-apply.js --slug X     -- one page
 *   node scripts/utils/seo-llm-apply.js --priority high -- high only
 *   node scripts/utils/seo-llm-apply.js --dry        -- preview only
 *
 * Destination: scripts/utils/seo-llm-apply.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const args      = process.argv.slice(2);
const get       = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag   = f => args.includes(f);

const SLUG_FILTER = get('--slug', null);
const DRY_RUN     = hasFlag('--dry');
const PRIORITY    = get('--priority', 'all');

const ROOT        = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-review.json');
const REPORTS_DIR = path.join(ROOT, 'data', 'reports');
const LATEST_PATH = path.join(REPORTS_DIR, 'seo-review-latest.json');

if (!fs.existsSync(CONFIG_PATH)) { console.error('✗ config/seo-review.json not found'); process.exit(1); }
if (!fs.existsSync(LATEST_PATH)) { console.error('✗ seo-review-latest.json not found — run seo-llm-review.js first'); process.exit(1); }

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY  = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://booksversusmovies.com';
const MODEL    = CONFIG.models.sonnet.model;

const SYSTEM_PROMPT = `You are the final editor for BooksVersusMovies.com, adjudicating SEO title and meta description improvements.

You will receive the current title and meta for a page, plus suggestions from three AI models.

Your job: write the single best title and meta description by combining the strongest elements from all three suggestions.

TITLE RULES (strict):
- Maximum 60 characters — hard limit, no exceptions
- Must include the book/film name
- Must include "Book vs Movie" or "Book vs Film"  
- Must have a specific hook, verdict signal, or surprising claim
- No ellipsis, no truncation

META RULES (strict):
- Maximum 150 characters — hard limit, no exceptions
- Must answer the searcher's core question directly
- Must include one specific, concrete claim
- No passive academic tone
- Should end with a verdict signal or call to action

Voice: confident, editorial, opinionated. This is a site that picks sides.

Return JSON only, no markdown, no preamble:
{
  "finalTitle": "the definitive title under 60 chars",
  "finalMeta": "the definitive meta under 150 chars",
  "reasoning": "one sentence explaining your choices"
}`;

function callClaude(userContent) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: MODEL, max_tokens: 400, temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userContent   },
      ],
    });
    const options = {
      hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': 'BooksVersusMovies SEO Apply',
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
          try   { resolve(JSON.parse(clean)); }
          catch { resolve({ error: `parse fail: ${clean.slice(0,120)}` }); }
        } catch (e) { resolve({ error: e.message }); }
      });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body); req.end();
  });
}

function buildUserContent(page) {
  const modelKeys = Object.keys(page.title.models);
  const titleSuggestions = modelKeys
    .filter(k => page.title.models[k] != null)
    .map(k => {
      const m = page.title.models[k];
      return `  ${k} (score ${m.score ?? '?'}): "${m.suggestion || '—'}" — issue: ${m.issue || '—'}`;
    }).join('\n');
  const metaSuggestions = modelKeys
    .filter(k => page.meta.models[k] != null)
    .map(k => {
      const m = page.meta.models[k];
      return `  ${k} (score ${m.score ?? '?'}): "${m.suggestion || '—'}" — issue: ${m.issue || '—'}`;
    }).join('\n');

  return `Page: ${page.slug}
Verdict: ${page.current.verdict || ''}

CURRENT TITLE (${page.current.titleLength} chars, score avg ${page.title.avgScore}):
"${page.current.title}"

TITLE SUGGESTIONS:
${titleSuggestions}

CURRENT META (${page.current.metaLength} chars, score avg ${page.meta.avgScore}):
"${page.current.meta}"

META SUGGESTIONS:
${metaSuggestions}

Write the definitive final title and meta.`;
}

async function run() {
  const review = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
  const today  = new Date().toISOString().split('T')[0];

  let pages = review.pages;

  if (SLUG_FILTER) {
    pages = pages.filter(p => p.slug === SLUG_FILTER);
    if (!pages.length) { console.error(`✗ Slug not found: ${SLUG_FILTER}`); process.exit(1); }
  } else if (PRIORITY !== 'all') {
    pages = pages.filter(p => p.overallPriority === PRIORITY);
  } else {
    pages = pages.filter(p => p.overallPriority === 'high' || p.overallPriority === 'medium');
  }

  console.log(`\nseo-llm-apply.js`);
  console.log(`Review:   ${review.runId}`);
  console.log(`Pages:    ${pages.length} (priority: ${PRIORITY === 'all' ? 'high+medium' : PRIORITY})`);
  console.log(`Model:    ${MODEL}`);
  console.log(`Dry run:  ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(56)}`);

  if (DRY_RUN) {
    pages.forEach(p => console.log(`  ${p.slug} — ${p.overallPriority} (avg ${p.overallAvg})`));
    console.log(`\n[DRY] Run without --dry to apply.\n`);
    return;
  }

  if (!API_KEY) { console.error('✗ OPENROUTER_API_KEY not set'); process.exit(1); }

  let applied = 0;
  let failed  = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    process.stdout.write(`  [${i+1}/${pages.length}] ${page.slug.padEnd(40)} ...`);

    const userContent = buildUserContent(page);
    const result      = await callClaude(userContent);

    if (result.error || !result.finalTitle || !result.finalMeta) {
      process.stdout.write(` ✗ ${result.error || 'missing fields'}\n`);
      failed++;
      continue;
    }

    // Validate lengths
    if (result.finalTitle.length > 60) {
      result.finalTitle = result.finalTitle.slice(0, 57) + '...';
    }
    if (result.finalMeta.length > 150) {
      result.finalMeta = result.finalMeta.slice(0, 147) + '...';
    }

    // Update the page in the review object
    const pageInReview = review.pages.find(p => p.slug === page.slug);
    if (pageInReview) {
      pageInReview.accepted = {
        title:       result.finalTitle,
        meta:        result.finalMeta,
        reasoning:   result.reasoning || '',
        chosenBy:    MODEL,
        appliedDate: null,
        applied:     false,
      };
    }

    process.stdout.write(` ✓ title:${result.finalTitle.length}c meta:${result.finalMeta.length}c\n`);
    applied++;
  }

  // Save updated JSON
  fs.writeFileSync(LATEST_PATH, JSON.stringify(review, null, 2), 'utf8');
  const datedPath = path.join(REPORTS_DIR, `seo-review-${review.runDate}.json`);
  if (fs.existsSync(datedPath)) {
    fs.writeFileSync(datedPath, JSON.stringify(review, null, 2), 'utf8');
  }

  console.log(`\n${'─'.repeat(56)}`);
  console.log(`✓ Applied: ${applied} pages`);
  if (failed) console.log(`✗ Failed:  ${failed} pages`);
  console.log(`\nNext: node scripts/utils/seo-llm-import.js\n`);
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
