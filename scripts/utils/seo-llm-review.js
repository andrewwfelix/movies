#!/usr/bin/env node

/**
 * scripts/utils/seo-llm-review.js
 * BooksVersusMovies.com — Multi-LLM SEO metadata reviewer
 *
 * Step 1 of 3 in the SEO review pipeline.
 * Sends full CSV to each model in one call, scores title and meta
 * independently, saves structured JSON for downstream scripts.
 *
 * Usage:
 *   node scripts/utils/seo-llm-review.js          -- all pages
 *   node scripts/utils/seo-llm-review.js --slug X  -- one page
 *   node scripts/utils/seo-llm-review.js --dry     -- export only
 *   node scripts/utils/seo-llm-review.js --limit 20
 *   node scripts/utils/seo-llm-review.js --model sonnet
 *
 * Output:
 *   data/reports/seo-review-YYYY-MM-DD.json  -- dated run
 *   data/reports/seo-review-latest.json      -- always current
 *   data/reports/seo-review-latest.csv       -- for easy scanning
 *
 * Destination: scripts/utils/seo-llm-review.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const args      = process.argv.slice(2);
const get       = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag   = f => args.includes(f);

const SLUG_FILTER  = get('--slug', null);
const DRY_RUN      = hasFlag('--dry');
const LIMIT        = parseInt(get('--limit', '0')) || 0;
const MODEL_FILTER = get('--model', null);
const BATCH_SIZE   = parseInt(get('--batch-size', '30')) || 30;

const ROOT        = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-review.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error('✗ config/seo-review.json not found');
  process.exit(1);
}

const CONFIG      = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const SRC_DIR     = path.join(ROOT, CONFIG.paths.sourceDir);
const REPORTS_DIR = path.join(ROOT, CONFIG.paths.outputDir);
const LATEST_PATH = path.join(REPORTS_DIR, 'seo-review-latest.json');
const TITLE_MAX   = CONFIG.scoring.titleMaxChars;
const META_MAX    = CONFIG.scoring.metaMaxChars;
const HIGH_THRESH = CONFIG.scoring.highPriorityThreshold;
const MED_THRESH  = CONFIG.scoring.mediumPriorityThreshold;

let MODELS = Object.entries(CONFIG.models)
  .filter(([, m]) => m.enabled)
  .map(([key, m]) => ({ key, ...m }));

if (MODEL_FILTER) {
  MODELS = MODELS.filter(m => m.key === MODEL_FILTER);
  if (!MODELS.length) { console.error(`✗ Model "${MODEL_FILTER}" not found.`); process.exit(1); }
}

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY  = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://booksversusmovies.com';

const SYSTEM_PROMPT = `You are an expert SEO consultant reviewing book vs movie comparison pages for BooksVersusMovies.com.

You will receive a CSV of pages. For EACH page, score the title and meta description INDEPENDENTLY and suggest improvements for each.

TITLE SCORING (1-10):
- 10: Under 60 chars, includes book name + "Book vs Movie", specific hook, strong CTR potential
- 8-9: Good, minor tweaks only
- 6-7: Acceptable but missing opportunity
- 4-5: Too generic or weak hook
- 1-3: Over 60 chars, ends in ellipsis, or completely misses intent
Max score 5 if over 60 chars. Max score 3 if ends in "..." or ellipsis.

META SCORING (1-10):
- 10: Under 150 chars, answers "what changed / which wins", specific claim, strong call to action
- 8-9: Good, minor tweaks
- 6-7: Acceptable, missing sharpness
- 4-5: Too generic, no specific claim, academic tone
- 1-3: Over 150 chars, passive, or doesn't match search intent

Return a JSON array, one object per page, same order as input. No markdown, no preamble, raw JSON only.

Each object must have exactly:
{
  "slug": "the-slug",
  "titleScore": 4,
  "titleIssue": "one sentence on the main title problem",
  "suggestedTitle": "improved title under 60 chars",
  "metaScore": 7,
  "metaIssue": "one sentence on the main meta problem",
  "suggestedMeta": "improved meta under 150 chars"
}`;

function callModel(model, maxTokens, temperature, userContent) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model, max_tokens: maxTokens, temperature,
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
        'X-Title': 'BooksVersusMovies SEO Review',
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
          // Strip markdown fences
          let clean = text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
          // If still not an array, extract JSON array from anywhere in response
          if (!clean.startsWith('[')) {
            const match = clean.match(/\[[\s\S]*\]/);
            if (match) clean = match[0];
          }
          // Try to parse — if truncated, attempt recovery by closing the array
          try {
            resolve(JSON.parse(clean));
          } catch {
            try {
              // Find last complete object and close the array
              const lastBrace = clean.lastIndexOf('}');
              if (lastBrace > 0) {
                const recovered = clean.slice(0, lastBrace + 1) + ']';
                const parsed = JSON.parse(recovered);
                resolve(parsed);
              } else {
                resolve({ error: `parse fail: ${clean.slice(0,120)}` });
              }
            } catch {
              resolve({ error: `parse fail: ${clean.slice(0,120)}` });
            }
          }
        } catch (e) { resolve({ error: e.message }); }
      });
    });
    req.setTimeout(180000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body); req.end();
  });
}

const esc  = s => `"${(s||'').toString().replace(/"/g,'""')}"`;
const safe = (o, k, fb='') => (o && !o.error && o[k] != null) ? o[k] : fb;

function findBySlug(arr, slug) {
  if (!Array.isArray(arr)) return null;
  return arr.find(r => r.slug === slug) || null;
}

function loadRecords() {
  let files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.json')).sort();
  if (SLUG_FILTER) {
    files = files.filter(f => f.replace('.json','') === SLUG_FILTER);
    if (!files.length) { console.error(`✗ No JSON for: ${SLUG_FILTER}`); process.exit(1); }
  }
  if (LIMIT > 0) files = files.slice(0, LIMIT);
  return files.map(file => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
      return {
        slug:          d.slug || file.replace('.json',''),
        verdict:       d.verdictText || '',
        genre:         d.genre || '',
        filmYear:      d.filmYear || '',
        pageTitle:     d.pageTitle || '',
        metaDesc:      d.metaDesc || '',
        oneLineReason: d.quickAnswer?.oneLineReason || '',
      };
    } catch { return null; }
  }).filter(Boolean);
}

function buildUserContent(records) {
  const header = 'slug,verdict,genre,filmYear,titleLength,currentTitle,metaLength,currentMeta';
  const rows = records.map(r =>
    `${r.slug},${r.verdict},${r.genre},${r.filmYear},` +
    `${r.pageTitle.length},"${r.pageTitle.replace(/"/g,'""')}",` +
    `${r.metaDesc.length},"${r.metaDesc.replace(/"/g,'""')}"`
  );
  return `Review these ${records.length} pages. Return a JSON array with exactly ${records.length} objects in the same order as input. Do not skip any page:\n\n${header}\n${rows.join('\n')}`;
}

function _saveIntermediate(records, modelResults, existingPages, models, today, latestPath, reportsDir) {
  const enabledKeys = models.map(m => m.key);
  const pages = records.map(r => {
    const existing = existingPages[r.slug] || {};
    const titleOk = r.pageTitle.length <= TITLE_MAX;
    const metaOk  = r.metaDesc.length  <= META_MAX;
    const titleModels = {};
    const metaModels  = {};
    for (const k of enabledKeys) {
      const found = modelResults[k] ? findBySlug(modelResults[k], r.slug) : null;
      titleModels[k] = found ? {
        score:      Number(safe(found, 'titleScore', 0)) || null,
        issue:      safe(found, 'titleIssue', ''),
        suggestion: safe(found, 'suggestedTitle', ''),
        scoredAt:   found._scoredAt || null,
      } : (existing.title?.models?.[k] || null);
      metaModels[k] = found ? {
        score:      Number(safe(found, 'metaScore', 0)) || null,
        issue:      safe(found, 'metaIssue', ''),
        suggestion: safe(found, 'suggestedMeta', ''),
        scoredAt:   found._scoredAt || null,
      } : (existing.meta?.models?.[k] || null);
    }
    const titleScores = enabledKeys.map(k => titleModels[k]?.score).filter(s => s != null && s > 0);
    const metaScores  = enabledKeys.map(k => metaModels[k]?.score).filter(s => s != null && s > 0);
    const titleAvg    = titleScores.length ? titleScores.reduce((a,b)=>a+b,0)/titleScores.length : 0;
    const metaAvg     = metaScores.length  ? metaScores.reduce((a,b)=>a+b,0)/metaScores.length   : 0;
    const overallAvg  = (titleAvg + metaAvg) / 2;
    const priority    = overallAvg <= HIGH_THRESH ? 'high' : overallAvg <= MED_THRESH ? 'medium' : 'low';
    return {
      slug: r.slug, verdict: r.verdict, genre: r.genre, filmYear: r.filmYear,
      current: {
        title: r.pageTitle, titleLength: r.pageTitle.length, titleOk,
        meta:  r.metaDesc,  metaLength:  r.metaDesc.length,  metaOk,
        oneLineReason: r.oneLineReason,
      },
      title: { avgScore: parseFloat(titleAvg.toFixed(1)), priority: titleAvg<=HIGH_THRESH?'high':titleAvg<=MED_THRESH?'medium':'low', models: titleModels },
      meta:  { avgScore: parseFloat(metaAvg.toFixed(1)),  priority: metaAvg<=HIGH_THRESH?'high':metaAvg<=MED_THRESH?'medium':'low',  models: metaModels  },
      overallAvg: parseFloat(overallAvg.toFixed(1)),
      overallPriority: priority,
      accepted: existing.accepted || null,
    };
  });
  pages.sort((a,b) => a.overallAvg - b.overallAvg);
  const output = {
    runDate:    today,
    runId:      `seo-review-${today}`,
    totalPages: pages.length,
    lastSaved:  new Date().toISOString(),
    models:     models.map(m => ({ key: m.key, label: m.label, model: m.model })),
    pages,
  };
  fs.writeFileSync(latestPath, JSON.stringify(output, null, 2), 'utf8');
  const datedPath = path.join(reportsDir, `seo-review-${today}.json`);
  fs.writeFileSync(datedPath, JSON.stringify(output, null, 2), 'utf8');
}

async function run() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const records = loadRecords();
  const today   = new Date().toISOString().split('T')[0];

  console.log(`\nseo-llm-review.js`);
  console.log(`Records:  ${records.length}`);
  console.log(`Dry run:  ${DRY_RUN ? 'yes' : 'no'}`);
  if (!DRY_RUN) console.log(`Models:   ${MODELS.map(m => m.label).join(', ')}`);
  console.log(`${'─'.repeat(56)}`);

  if (DRY_RUN) {
    console.log(`[DRY] Skipping LLM calls.\n`);
    return;
  }

  if (!API_KEY) { console.error('✗ OPENROUTER_API_KEY not set'); process.exit(1); }

  // Load existing review JSON — source of truth for what's already scored
  let existingPages = {};
  let existingMeta  = {};
  if (fs.existsSync(LATEST_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
      if (existing.pages) {
        existing.pages.forEach(p => { existingPages[p.slug] = p; });
      }
      existingMeta = { runDate: existing.runDate, runId: existing.runId };
      console.log(`Resuming: ${existing.runId || 'existing run'}\n`);
    } catch {
      console.log('No existing run found — starting fresh\n');
    }
  }

  const BATCH_SIZE = parseInt(get('--batch-size', '30')) || 30;

  // For each model, only process slugs that don't already have scores
  const modelResults = {};
  for (const m of MODELS) {
    // Find slugs missing scores for this model
    const needsScoring = records.filter(r => {
      const existing = existingPages[r.slug];
      return !existing || existing.title?.models?.[m.key]?.score == null;
    });

    // Load already-scored slugs from existing JSON
    const alreadyScored = records
      .filter(r => {
        const existing = existingPages[r.slug];
        return existing && existing.title?.models?.[m.key]?.score != null;
      })
      .map(r => {
        const p = existingPages[r.slug];
        return {
          slug:           r.slug,
          titleScore:     p.title.models[m.key].score,
          titleIssue:     p.title.models[m.key].issue,
          suggestedTitle: p.title.models[m.key].suggestion,
          metaScore:      p.meta.models[m.key].score,
          metaIssue:      p.meta.models[m.key].issue,
          suggestedMeta:  p.meta.models[m.key].suggestion,
          _scoredAt:      p.title.models[m.key].scoredAt || null,
        };
      });

    if (needsScoring.length === 0) {
      console.log(`  ${m.label} — all ${records.length} pages already scored, skipping`);
      modelResults[m.key] = alreadyScored;
      continue;
    }

    console.log(`  ${m.label} — ${needsScoring.length} pages need scoring, ${alreadyScored.length} already done`);

    // Batch only the pages that need scoring
    const batches = [];
    for (let i = 0; i < needsScoring.length; i += BATCH_SIZE) {
      batches.push(needsScoring.slice(i, i + BATCH_SIZE));
    }

    const newResults = [];
    let batchFailed = 0;
    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      process.stdout.write(`    batch ${b+1}/${batches.length} (${batch.length} pages) ...`);
      const userContent = buildUserContent(batch);
      const result = await callModel(m.model, m.maxTokens, m.temperature, userContent);
      if (result.error || !Array.isArray(result)) {
        process.stdout.write(` ✗ ${result.error || 'not an array'}\n`);
        batchFailed++;
      } else {
        // Stamp each result with timestamp
        const ts = new Date().toISOString();
        result.forEach(r => { r._scoredAt = ts; });
        process.stdout.write(` ✓ ${result.length} scored`);
        newResults.push(...result);
        // Save after every batch so progress is never lost
        modelResults[m.key] = [...alreadyScored, ...newResults];
        _saveIntermediate(records, modelResults, existingPages, MODELS, today, LATEST_PATH, REPORTS_DIR);
        process.stdout.write(` [saved]\n`);
      }
    }

    const total = modelResults[m.key]?.length || 0;
    console.log(`  → ${total} pages total (${newResults.length} new, ${alreadyScored.length} existing)${batchFailed ? `, ${batchFailed} batches failed` : ''}\n`);
  }

  // Final save using shared helper
  _saveIntermediate(records, modelResults, existingPages, MODELS, today, LATEST_PATH, REPORTS_DIR);

  // Read back for CSV generation and summary
  const output  = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
  const pages   = output.pages;
  const enabledKeys = MODELS.map(m => m.key);

  // Write CSV for easy scanning
  const csvHeader = ['slug','verdict','genre','overallAvg','overallPriority',
    'titleAvg','titlePriority','currentTitle','titleLength','titleOk',
    'metaAvg','metaPriority','currentMeta','metaLength','metaOk',
    ...enabledKeys.flatMap(k => [`${k}_titleScore`,`${k}_suggestedTitle`,`${k}_metaScore`,`${k}_suggestedMeta`])
  ].map(esc).join(',');

  const csvRows = pages.map(p => [
    p.slug, p.verdict, p.genre, p.overallAvg, p.overallPriority,
    p.title.avgScore, p.title.priority, p.current.title, p.current.titleLength, p.current.titleOk ? 'ok' : 'TOO LONG',
    p.meta.avgScore,  p.meta.priority,  p.current.meta,  p.current.metaLength,  p.current.metaOk  ? 'ok' : 'TOO LONG',
    ...enabledKeys.flatMap(k => [
      p.title.models[k]?.score || '', p.title.models[k]?.suggestion || '',
      p.meta.models[k]?.score  || '', p.meta.models[k]?.suggestion  || '',
    ]),
  ].map(esc).join(','));

  const csvPath = path.join(REPORTS_DIR, 'seo-review-latest.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf8');

  const high   = pages.filter(p => p.overallPriority === 'high').length;
  const medium = pages.filter(p => p.overallPriority === 'medium').length;
  const low    = pages.filter(p => p.overallPriority === 'low').length;

  console.log(`\n${'─'.repeat(56)}`);
  console.log(`✓ seo-review-${today}.json`);
  console.log(`✓ seo-review-latest.json`);
  console.log(`✓ seo-review-latest.csv`);
  console.log(`  High priority:   ${high}`);
  console.log(`  Medium priority: ${medium}`);
  console.log(`  Low priority:    ${low}`);
  console.log(`\nNext: node scripts/utils/seo-llm-apply.js\n`);
}

run().catch(err => { console.error(`\nFatal: ${err.message}`); process.exit(1); });
