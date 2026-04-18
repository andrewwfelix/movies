#!/usr/bin/env node

/**
 * pipeline-spotlight.js
 * BooksVersusMovies.com — Spotlight page generator
 *
 * Takes a slug as input, calls Sonnet to generate a rich feature JSON,
 * validates it against schema-feature.json, and renders a standalone
 * feature-<slug>.html page to the project root.
 *
 * Feature pages are deeper than standard reviews — they cover the full
 * context of a work: literary history, adaptations, FAQ targeting real
 * search queries, and a clear read-first verdict.
 *
 * Usage:
 *   node scripts/pipeline-spotlight.js --slug lonesome-dove
 *   node scripts/pipeline-spotlight.js --slug lonesome-dove --dry
 *   node scripts/pipeline-spotlight.js --slug lonesome-dove --force
 *
 * Outputs:
 *   data/spotlights/<slug>.json      canonical spotlight JSON
 *   spotlight-<slug>.html           rendered page (project root)
 *
 * Model: config/models.json → "spotlight" key
 *
 * Destination: scripts/pipeline-spotlight.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SLUG    = get('--slug', null);
const DRY_RUN = hasFlag('--dry');
const FORCE   = hasFlag('--force');
const SCRIPT_VERSION = '1.2';

if (!SLUG) {
  console.error('✗ --slug required. Usage: node scripts/pipeline-spotlight.js --slug lonesome-dove');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT          = path.resolve(__dirname, '..');
const MODELS_PATH   = path.join(ROOT, 'config', 'models.json');
const PROMPT_PATH   = path.join(ROOT, 'scripts', 'prompts', 'spotlight-page.txt');
const SCHEMA_PATH   = path.join(ROOT, 'data', 'schemas', 'schema-spotlight.json');
const SPOTLIGHTS_DIR = path.join(ROOT, 'data', 'spotlights');
const OUTPUT_JSON   = path.join(SPOTLIGHTS_DIR, `${SLUG}.json`);
const OUTPUT_HTML   = path.join(ROOT, `spotlight-${SLUG}.html`);
const REVIEWS_DIR   = path.join(ROOT, 'data', 'reviews');
const REVISED_DIR   = path.join(ROOT, 'pipeline', '2-revised');

const SITE_URL = 'https://booksversusmovies.com';
const GA_ID    = 'G-P0DY0XDWVV';
const NOW      = new Date();
const TODAY    = NOW.toISOString().split('T')[0];

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

function loadModel() {
  const config = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8'));
  return {
    model:       config.spotlight?.model       || 'anthropic/claude-sonnet-4-5',
    maxTokens:   config.spotlight?.maxTokens   || 10000,
    temperature: config.spotlight?.temperature || 0.5,
  };
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
        'X-Title':        'BooksVersusMovies Spotlight',
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

// ── Parse JSON ────────────────────────────────────────────────────────────────

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

// ── Validate against schema ───────────────────────────────────────────────────

function validateFeature(data) {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.log('  ⚠  schema-feature.json not found — skipping schema validation');
    return;
  }

  try {
    const Ajv = require('ajv');
    const ajv  = new Ajv({ allErrors: true, strict: false });
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      const errors = validate.errors.map(e => {
        const field = e.instancePath ? e.instancePath.replace(/^\//, '') : e.params?.missingProperty || 'unknown';
        return `  - ${field}: ${e.message}`;
      });
      throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
    }
  } catch (e) {
    if (e.message.includes('Cannot find module')) {
      console.log('  ⚠  ajv not installed — skipping schema validation');
      return;
    }
    throw e;
  }
}


// ── Look up affiliate link from existing review JSON ─────────────────────────

function getAffiliateLink(slug) {
  // Try pipeline/2-revised first, then data/reviews
  const paths = [
    path.join(REVISED_DIR, `${slug}.json`),
    path.join(REVIEWS_DIR, `${slug}.json`),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const r = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (r.affiliateLink) return r.affiliateLink;
      } catch {}
    }
  }
  return null;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

const esc = s => (s || '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderParagraphs(text) {
  return (text || '').split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      // Convert markdown bold/italic to HTML (safety net)
      let html = esc(p.trim());
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}

function renderQuickFacts(qf) {
  const rows = [
    ['Author',           qf.author],
    ['Published',        qf.published],
    ['Genre',            qf.genre],
    ['Setting',          qf.setting],
    ['Adaptations',      qf.adaptations],
    ['Based on true story?', qf.isBasedOnTrueStory],
  ];
  return rows.map(([label, value]) => `
      <div class="fact-row">
        <span class="fact-label">${esc(label)}</span>
        <span class="fact-value">${esc(value)}</span>
      </div>`).join('');
}

function renderSections(sections) {
  return sections.map(s => `
    <section class="spotlight-section" id="${esc(s.id)}">
      <h2>${esc(s.heading)}</h2>
      ${renderParagraphs(s.body)}
    </section>`).join('\n');
}

function renderFAQ(faq) {
  return faq.map(item => `
      <div class="faq-item">
        <h3 class="faq-question">${esc(item.question)}</h3>
        <p class="faq-answer">${esc(item.answer)}</p>
      </div>`).join('\n');
}

function renderRelated(slugs) {
  // Check both data/reviews and pipeline/2-revised for title lookup
  // Check if a spotlight page exists for this slug — link there if so
  return slugs.map(slug => {
    let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Try to get real book title from either source
    const reviewPaths = [
      path.join(REVISED_DIR, `${slug}.json`),
      path.join(REVIEWS_DIR, `${slug}.json`),
    ];
    for (const p of reviewPaths) {
      if (fs.existsSync(p)) {
        try {
          const r = JSON.parse(fs.readFileSync(p, 'utf8'));
          title = r.bookTitle || title;
          break;
        } catch {}
      }
    }

    // Link to spotlight if one exists, otherwise standard review
    const spotlightPath = path.join(ROOT, `spotlight-${slug}.html`);
    const href = fs.existsSync(spotlightPath) ? `/spotlight-${slug}` : `/${slug}`;

    return `
      <a class="related-card" href="${esc(href)}">
        <div class="related-cover">
          <img src="images/${esc(slug)}.jpg" alt="${esc(title)} book cover" loading="lazy"
               onerror="this.parentElement.style.display='none'">
        </div>
        <span class="related-title">${esc(title)}</span>
      </a>`;
  }).join('\n');
}

// ── Render HTML ───────────────────────────────────────────────────────────────

function renderHTML(data, affiliateLink) {
  const verdictClass = data.verdict.readFirst === 'Yes' ? 'verdict-read-first'
    : data.verdict.readFirst === 'No' ? 'verdict-watch-first' : 'verdict-either';

  const sectionNav = data.sections.map(s =>
    `<a href="#${esc(s.id)}" class="section-nav-link">${esc(s.heading)}</a>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<!-- Generated by pipeline-spotlight.js v${SCRIPT_VERSION} on ${TODAY} -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(data.pageTitle)}</title>
  <meta name="description" content="${esc(data.metaDesc)}">
  <link rel="canonical" href="${SITE_URL}/spotlight-${esc(data.slug)}">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* ── Feature page styles ───────────────────────────── */
    .spotlight-hero {
      background: #1a1a1a;
      color: #fff;
      padding: 3rem 1.5rem 2.5rem;
    }
    .spotlight-hero h1 { font-size: 2.2rem; margin: 0 0 0.5rem; color: #fff; max-width: 800px; }
    .spotlight-type-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.6rem;
      border-radius: 2px;
      background: #333;
      color: #aaa;
      margin-bottom: 1rem;
    }

    .spotlight-layout {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 3rem;
      align-items: start;
    }

    .spotlight-main { min-width: 0; }

    .spotlight-sidebar { position: sticky; top: 1.5rem; }

    .spotlight-intro { margin-bottom: 2.5rem; }
    .spotlight-intro p { font-size: 1.05rem; line-height: 1.7; color: #333; margin: 0 0 1rem; }

    .section-nav {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    .section-nav-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin-bottom: 0.6rem; display: block; }
    .section-nav-link {
      display: block;
      font-size: 0.85rem;
      color: #333;
      text-decoration: none;
      padding: 0.25rem 0;
      border-bottom: 1px solid #eee;
      transition: color 0.12s;
    }
    .section-nav-link:last-child { border-bottom: none; }
    .section-nav-link:hover { color: #1a1a1a; }

    .quick-facts {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .quick-facts-heading { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin: 0 0 0.75rem; }
    .fact-row { display: flex; flex-direction: column; padding: 0.4rem 0; border-bottom: 1px solid #f0f0f0; font-size: 0.82rem; }
    .fact-row:last-child { border-bottom: none; }
    .fact-label { color: #999; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.1rem; }
    .fact-value { color: #1a1a1a; font-weight: 500; }

    .spotlight-section { margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #eee; }
    .spotlight-section:last-child { border-bottom: none; }
    .spotlight-section h2 { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 0 0 1rem; }
    .spotlight-section p { font-size: 0.95rem; line-height: 1.7; color: #333; margin: 0 0 1rem; }
    .spotlight-section p:last-child { margin-bottom: 0; }

    .verdict-box {
      background: #1a1a1a;
      color: #fff;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .verdict-box-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.5rem; }
    .verdict-read-first .verdict-decision { color: #6fcf97; }
    .verdict-watch-first .verdict-decision { color: #f2994a; }
    .verdict-either .verdict-decision { color: #aaa; }
    .verdict-decision { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.4rem; }
    .verdict-reason { font-size: 0.9rem; color: #ccc; font-style: italic; margin-bottom: 1rem; }
    .verdict-body { font-size: 0.88rem; color: #bbb; line-height: 1.65; }

    .faq-section { margin-bottom: 2.5rem; }
    .faq-section h2 { font-size: 1.4rem; font-weight: 700; margin: 0 0 1.25rem; }
    .faq-item { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #eee; }
    .faq-item:last-child { border-bottom: none; }
    .faq-question { font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0 0 0.4rem; }
    .faq-answer { font-size: 0.88rem; color: #444; line-height: 1.65; margin: 0; }

    .related-section { margin-bottom: 2rem; }
    .related-section h2 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin: 0 0 0.75rem; }
    .related-grid { display: flex; flex-direction: column; gap: 0.6rem; }
    .related-card { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; padding: 0.4rem 0; border-bottom: 1px solid #f0f0f0; transition: color 0.12s; }
    .related-card:last-child { border-bottom: none; }
    .related-card:hover { color: #1a1a1a; }
    .related-cover img { width: 32px; height: 48px; object-fit: cover; border-radius: 2px; border: 1px solid #e0e0e0; display: block; }
    .related-title { font-size: 0.82rem; font-weight: 600; color: #333; }


    .buy-btn {
      display: block;
      background: #e8f0e8;
      color: #2a5a2a;
      border: 1px solid #b0cdb0;
      text-align: center;
      padding: 0.6rem 1rem;
      border-radius: 2px;
      text-decoration: none;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      transition: background 0.15s;
    }
    .buy-btn:hover { background: #d0e4d0; }
    @media (max-width: 768px) {
      .spotlight-layout { grid-template-columns: 1fr; }
      .spotlight-sidebar { position: static; }
      .spotlight-hero h1 { font-size: 1.6rem; }
    }

    @media print {
      header, footer { display: none !important; }
      .spotlight-sidebar { display: none; }
      .spotlight-layout { grid-template-columns: 1fr; }
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
      <a href="/">Home</a> &nbsp;&middot;&nbsp;
      <a href="/upcoming-adaptations">Upcoming</a> &nbsp;&middot;&nbsp;
      <a href="/auteurs">The Auteurs</a> &nbsp;&middot;&nbsp;
      <a href="/about">About</a>
    </nav>
  </div>
</header>

<div class="spotlight-hero">
  <div style="max-width:1100px;margin:0 auto;padding:0 1.5rem;">
    <span class="spotlight-type-badge">${esc(data.featureType)} spotlight</span>
    <h1>${esc(data.h1)}</h1>
  </div>
</div>

<div class="spotlight-layout">

  <main class="spotlight-main">

    <div class="spotlight-intro">
      ${renderParagraphs(data.intro)}
    </div>

    <div class="verdict-box ${verdictClass}">
      <div class="verdict-box-label">Our Verdict</div>
      <div class="verdict-decision">Read First: ${esc(data.verdict.readFirst)}</div>
      <div class="verdict-reason">${esc(data.verdict.oneLineReason)}</div>
      <div class="verdict-body">${esc(data.verdict.verdictBody)}</div>
    </div>

    ${renderSections(data.sections)}

    <div class="faq-section" id="faq">
      <h2>Frequently Asked Questions</h2>
      ${renderFAQ(data.faq)}
    </div>

  </main>

  <aside class="spotlight-sidebar">

    ${affiliateLink ? `<a class="buy-btn" href="${esc(affiliateLink)}" target="_blank" rel="noopener sponsored">Buy the Book &rarr;</a>` : ''}

    <nav class="section-nav">
      <span class="section-nav-label">On this page</span>
      ${sectionNav}
      <a href="#faq" class="section-nav-link">FAQ</a>
    </nav>

    <div class="quick-facts">
      <p class="quick-facts-heading">Quick Facts</p>
      ${renderQuickFacts(data.quickFacts)}
    </div>

    <div class="related-section">
      <h2>Related Reviews</h2>
      <div class="related-grid">
        ${renderRelated(data.relatedSlugs)}
      </div>
    </div>

    ${affiliateLink ? `<a class="buy-btn" href="${esc(affiliateLink)}" target="_blank" rel="noopener sponsored">Buy the Book &rarr;</a>` : ''}

  </aside>

</div>

<footer>
  <div class="footer-inner">
    <p>&copy; ${NOW.getFullYear()} BooksVersusMovies.com &nbsp;&mdash;&nbsp;
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

function dryRun(m) {
  const issues = [];
  if (!API_KEY)                    issues.push('✗ OPENROUTER_API_KEY not set in .env');
  if (!fs.existsSync(PROMPT_PATH)) issues.push(`✗ Prompt not found: ${PROMPT_PATH}`);
  if (!fs.existsSync(MODELS_PATH)) issues.push(`✗ models.json not found: ${MODELS_PATH}`);

  console.log(`\npipeline-spotlight.js — DRY RUN`);
  console.log(`${'─'.repeat(52)}`);
  console.log(`  Slug:         ${SLUG}`);
  console.log(`  Model:        ${m.model}`);
  console.log(`  MaxTokens:    ${m.maxTokens}`);
  console.log(`  Temperature:  ${m.temperature}`);
  console.log(`  Prompt:       ${fs.existsSync(PROMPT_PATH) ? '✓ found' : '✗ missing'}`);
  console.log(`  Schema:       ${fs.existsSync(SCHEMA_PATH) ? '✓ found' : '⚠  missing (validation skipped)'}`);
  console.log(`  API key:      ${API_KEY ? '✓ set' : '✗ missing'}`);
  console.log(`  Output JSON:  data/spotlights/${SLUG}.json ${fs.existsSync(OUTPUT_JSON) ? '(exists — use --force)' : '(will be created)'}`);
  console.log(`  Output HTML:  spotlight-${SLUG}.html ${fs.existsSync(OUTPUT_HTML) ? '(exists — use --force)' : '(will be created)'}`);
  console.log(`${'─'.repeat(52)}`);

  if (issues.length > 0) {
    issues.forEach(i => console.log(`  ${i}`));
    console.log(`\n[DRY] Fix issues above before running.`);
    process.exit(1);
  }

  console.log(`[DRY] All checks passed. Run without --dry to generate.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const m = loadModel();

  if (DRY_RUN) { dryRun(m); return; }

  if (!API_KEY) {
    console.error('✗ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  if (!fs.existsSync(SPOTLIGHTS_DIR)) {
    fs.mkdirSync(SPOTLIGHTS_DIR, { recursive: true });
  }

  console.log(`\npipeline-spotlight.js`);
  console.log(`Slug:   ${SLUG}`);
  console.log(`Model:  ${m.model}`);
  console.log(`Date:   ${TODAY}`);
  console.log(`${'─'.repeat(52)}`);

  // ── Check for existing output ──────────────────────────────────────────────
  if (!FORCE && fs.existsSync(OUTPUT_JSON)) {
    console.log(`  → JSON exists — loading for re-render (use --force to regenerate)`);
    const data = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    const affiliateLink = getAffiliateLink(SLUG);
    const html = renderHTML(data, affiliateLink);
    fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
    console.log(`  ✓  → spotlight-${SLUG}.html (re-rendered)`);
    if (affiliateLink) console.log(`  ✓  affiliate link included`);
    else console.log(`  ⚠  no affiliate link found for ${SLUG}`);
    console.log(`\nCHECKPOINT PASSED`);
    return;
  }

  // ── Generate JSON ──────────────────────────────────────────────────────────
  if (!fs.existsSync(PROMPT_PATH)) {
    console.error(`  ✗ Prompt not found: ${PROMPT_PATH}`);
    process.exit(1);
  }

  const prompt      = fs.readFileSync(PROMPT_PATH, 'utf8').trim();

  // Build valid slug list so model doesn't hallucinate relatedSlugs
  const validSlugs = fs.readdirSync(REVISED_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()
    .join('\n');

  const userContent = `Generate a complete feature page for slug: "${SLUG}"
Today's date: ${TODAY}

VALID relatedSlugs — you MUST only use slugs from this exact list:
${validSlugs}`;

  process.stdout.write(`  ↻  Generating via ${m.model}...`);

  let data;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const raw = await callModel(m.model, prompt, userContent, m.maxTokens, m.temperature);
      data = parseJSON(raw);
      break;
    } catch (e) {
      if (attempt === maxRetries) {
        process.stdout.write(` ✗\n`);
        console.error(`  ✗ Failed after ${maxRetries} attempts: ${e.message}`);
        process.exit(1);
      }
      process.stdout.write(` ↺ retry ${attempt}...`);
      await new Promise(r => setTimeout(r, 10000 * attempt));
    }
  }

  process.stdout.write(` ✓\n`);

  // Ensure slug matches input
  data.slug        = SLUG;
  data.lastUpdated = TODAY;

  // ── Auto-sanitize before validation ───────────────────────────────────────
  // Truncate fields that commonly exceed limits
  if (data.metaDesc && data.metaDesc.length > 160) {
    const cut = data.metaDesc.lastIndexOf(' ', 157);
    data.metaDesc = (cut > 100 ? data.metaDesc.slice(0, cut) : data.metaDesc.slice(0, 157)) + '…';
    console.log(`  ⚠  metaDesc truncated to ${data.metaDesc.length} chars`);
  }
  if (data.pageTitle && data.pageTitle.length > 70) {
    const cut = data.pageTitle.lastIndexOf(' ', 67);
    data.pageTitle = (cut > 20 ? data.pageTitle.slice(0, cut) : data.pageTitle.slice(0, 67)) + '…';
    console.log(`  ⚠  pageTitle truncated to ${data.pageTitle.length} chars`);
  }
  if (data.relatedSlugs && data.relatedSlugs.length > 6) {
    data.relatedSlugs = data.relatedSlugs.slice(0, 6);
    console.log(`  ⚠  relatedSlugs truncated to 6`);
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  process.stdout.write(`  ↻  Validating...`);
  try {
    validateFeature(data);
    process.stdout.write(` ✓\n`);
  } catch (e) {
    process.stdout.write(` ✗\n`);
    console.error(`  ✗ ${e.message}`);
    process.exit(1);
  }

  console.log(`  ✓  featureType: ${data.featureType}`);
  console.log(`  ✓  sections: ${data.sections.length}`);
  console.log(`  ✓  faq: ${data.faq.length} items`);

  // ── Write JSON ─────────────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓  → data/spotlights/${SLUG}.json`);

  // ── Render HTML ────────────────────────────────────────────────────────────
  process.stdout.write(`  ↻  Rendering HTML...`);
  const affiliateLink = getAffiliateLink(SLUG);
  const html = renderHTML(data, affiliateLink);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  process.stdout.write(` ✓\n`);
  console.log(`  ✓  → spotlight-${SLUG}.html`);

  // ── Checkpoint ─────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(52)}`);
  console.log(`CHECKPOINT PASSED`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open spotlight-${SLUG}.html in browser to review`);
  console.log(`  2. git add . && git commit -m "feat: spotlight page ${SLUG}"`);
  console.log(`  3. git checkout main && git merge dev && git push`);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
