/**
 * scripts/analyze-gsc-morning.js
 * BooksVersusMovies.com — GSC Morning Analysis
 *
 * OBJECTIVES:
 * 1. Deliver a fast, actionable daily SEO morning brief.
 * 2. Detect trends/spikes using 90-day baseline vs 7-day recent performance.
 * 3. Pre-aggregate data and calculate meaningful deltas before LLM call.
 * 4. Dynamically determine protected pages based on live performance data.
 * 5. Output both JSON (dashboard/history) and Markdown brief (human reading).
 *
 * Priority: #3 — after content review pipeline and page UI/UX render fixes.
 *
 * Usage: node scripts/analyze-gsc-morning.js
 *
 * Destination: scripts/analyze-gsc-morning.js
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

const CONFIG_PATH = path.join(process.cwd(), 'config/gsc-analysis.json');
const PROMPT_PATH = path.join(process.cwd(), 'scripts/prompts/gsc-prompt.txt');

// ── Config + Prompt ───────────────────────────────────────────────────────────

async function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Config not found: ${CONFIG_PATH}`);
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function loadPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) throw new Error(`Prompt not found: ${PROMPT_PATH}`);
  return fs.readFileSync(PROMPT_PATH, 'utf8');
}

// ── Auth (single token, reused) ───────────────────────────────────────────────

let _accessToken = null;

async function getAuthToken() {
  if (_accessToken) return _accessToken;
  const creds      = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  const privateKey = creds.private_key.replace(/\\n/g, '\n');
  const auth       = new (require('googleapis').google.auth.JWT)({
    email:  creds.client_email,
    key:    privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const tokens  = await auth.authorize();
  _accessToken  = tokens.access_token;
  return _accessToken;
}

// ── GSC Fetch ─────────────────────────────────────────────────────────────────

async function fetchGscData(siteUrl, daysBack) {
  console.log(`📡 Fetching ${daysBack}-day GSC data...`);
  const token     = await getAuthToken();
  const endDate   = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];

  const requestBody = JSON.stringify({
    startDate,
    endDate,
    dimensions: ['query', 'page'],
    rowLimit:   2500,
    startRow:   0,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`GSC timeout after 15s (${daysBack} days)`)),
      15000
    );

    const req = https.request({
      hostname: 'www.googleapis.com',
      path:     `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      method:   'POST',
      headers:  {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    }, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`GSC HTTP ${res.statusCode}`));
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(`GSC Error: ${JSON.stringify(json.error)}`));
          resolve(json.rows || []);
        } catch (e) {
          reject(new Error('Failed to parse GSC JSON response'));
        }
      });
    });

    req.on('error', (e) => { clearTimeout(timeout); reject(e); });
    req.write(requestBody);
    req.end();
  });
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function aggregateByPage(rows) {
  const map = {};
  rows.forEach(row => {
    const page = row.keys?.[1] || '(unknown)';
    if (!map[page]) map[page] = { page, impressions: 0, clicks: 0, positionSum: 0 };
    const p = map[page];
    p.impressions += row.impressions || 0;
    p.clicks      += row.clicks      || 0;
    p.positionSum += (row.position   || 0) * (row.impressions || 1); // weighted
  });

  return Object.values(map).map(p => ({
    page:        p.page,
    impressions: p.impressions,
    clicks:      p.clicks,
    avgPosition: p.impressions > 0 ? Number((p.positionSum / p.impressions).toFixed(2)) : 0,
    ctr:         p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(2)) : 0,
  }));
}

// ── Delta Calculation ─────────────────────────────────────────────────────────

function buildDeltas(longTermPages, recentPages) {
  const longMap = new Map(longTermPages.map(p => [p.page, p]));
  return recentPages
    .map(recent => {
      const baseline = longMap.get(recent.page);
      if (!baseline || baseline.impressions < 20) return null; // ignore low-volume
      return {
        page:               recent.page,
        recentImpressions:  recent.impressions,
        recentPosition:     recent.avgPosition,
        recentCtr:          recent.ctr,
        baselineImpressions: baseline.impressions,
        baselinePosition:   baseline.avgPosition,
        baselineCtr:        baseline.ctr,
        deltaPosition:      Number((recent.avgPosition - baseline.avgPosition).toFixed(2)),
        deltaImpressionsPct: Number((
          ((recent.impressions - baseline.impressions) / baseline.impressions) * 100
        ).toFixed(1)),
        deltaCtrPct:        Number((recent.ctr - baseline.ctr).toFixed(2)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.deltaImpressionsPct) - Math.abs(a.deltaImpressionsPct));
}

// ── Protected Pages ───────────────────────────────────────────────────────────

function getProtectedPages(pages) {
  return pages
    .filter(p => p.ctr > 5 || p.avgPosition < 10)
    .map(p => p.page);
}

// ── LLM Call ─────────────────────────────────────────────────────────────────

async function getLlmInsights(context, config) {
  const apiKey = process.env[config.llm.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing ${config.llm.apiKeyEnv} in .env`);

  console.log(`🧠 Generating insights with ${config.llm.model}...`);

  let prompt = await loadPrompt();

  prompt = prompt
    .replace('{{longTermSummary}}',       JSON.stringify(context.longTermSummary,       null, 2))
    .replace('{{recentSummary}}',         JSON.stringify(context.recentSummary,         null, 2))
    .replace('{{topPagesByImpressions}}', JSON.stringify(context.topPagesByImpressions, null, 2))
    .replace('{{lowCtrHighImpressions}}', JSON.stringify(context.lowCtrHighImpressions, null, 2))
    .replace('{{recentHighPerformers}}',  JSON.stringify(context.recentHighPerformers,  null, 2))
    .replace('{{deltas}}',                JSON.stringify(context.deltas,                null, 2))
    .replace('{{protectedPages}}',        JSON.stringify(context.protectedPages,        null, 2))
    .replace('{{greenfieldSlugs}}',       JSON.stringify(context.greenfieldSlugs,       null, 2));

  const body = JSON.stringify({
    model:       config.llm.model,
    temperature: 0.3,
    messages:    [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path:     '/api/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer':  'https://booksversusmovies.com',
        'X-Title':       'GSC Morning Analysis',
        'Content-Type':  'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`OpenRouter HTTP ${res.statusCode}`));

        let json;
        try { json = JSON.parse(data); } catch (e) {
          return reject(new Error('Failed to parse OpenRouter response'));
        }
        if (json.error) return reject(new Error(`OpenRouter Error: ${json.error.message}`));

        // Fix: declare content BEFORE try/catch so it's in scope for debug save
        const content = json.choices?.[0]?.message?.content || '';
        try {
          resolve(JSON.parse(content));
        } catch (parseErr) {
          console.error('❌ LLM returned malformed JSON. Saving debug file...');
          const dir       = path.join(process.cwd(), 'data/reports');
          fs.mkdirSync(dir, { recursive: true });
          const debugPath = path.join(dir, `llm-debug-${Date.now()}.txt`);
          fs.writeFileSync(debugPath, content, 'utf8');
          reject(new Error(`Malformed JSON from LLM. Debug saved: ${debugPath}`));
        }
      });
    });

    // Timeout on LLM call
    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error('OpenRouter request timeout after 90s'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Markdown Brief ────────────────────────────────────────────────────────────

function generateMarkdownBrief(insights, dateStr, protectedPages) {
  const fmt = arr => (arr || []).length > 0
    ? arr.map(item => `- ${item}`).join('\n')
    : '- None';

  const fmtExternal = arr => (arr || []).length > 0
    ? arr.map(s => `- **${s.page}**: ${s.observation} → ${s.possibleCause} *(${s.confidence})*`).join('\n')
    : '- None detected';

  const fmtRecs = arr => (arr || []).length > 0
    ? arr.map((r, i) => `${i+1}. **[${r.priority}]** ${r.action} — ${r.reason}`).join('\n')
    : '- No recommendations';

  return `# GSC Morning Brief — ${dateStr}

## 📊 Summary
${insights.summary || 'No summary provided.'}

## 🚨 Needs Attention
${fmt(insights.needsAttention)}

## 📈 Trending Up
${fmt(insights.trendingUp)}

## 💡 Quick Wins
${fmt(insights.quickWins)}

## ✅ Performing Well
${fmt(insights.performingWell)}

## 🔍 External Signals
${fmtExternal(insights.externalSignals)}

## 📋 Recommended Actions
${fmtRecs(insights.recommendations)}

## 🔒 Protected Pages (auto-detected)
${protectedPages.length > 0 ? protectedPages.map(p => `- ${p}`).join('\n') : '- None currently protected'}

---
*Generated: ${new Date().toISOString()}*
`;
}

// ── Load Greenfield Slugs ─────────────────────────────────────────────────────

function loadGreenfieldSlugs() {
  const dir = path.join(process.cwd(), 'data/greenfield');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runMorningAnalysis() {
  console.log('🌅 Starting GSC Morning Analysis (90-day + 7-day)...\n');

  const config  = await loadConfig();
  const siteUrl = config.sites[0];

  const [longTermRows, recentRows] = await Promise.all([
    fetchGscData(siteUrl, 90),
    fetchGscData(siteUrl, 7),
  ]);

  console.log(`   → 90-day: ${longTermRows.length} rows`);
  console.log(`   → 7-day:  ${recentRows.length} rows`);

  if (longTermRows.length === 0 && recentRows.length === 0) {
    console.log('⚠️  No GSC data found. Exiting.');
    return;
  }

  const longTermPages  = aggregateByPage(longTermRows);
  const recentPages    = aggregateByPage(recentRows);
  const deltas         = buildDeltas(longTermPages, recentPages);
  const protectedPages = getProtectedPages(longTermPages);
  const greenfieldSlugs = loadGreenfieldSlugs();

  const context = {
    longTermSummary: {
      totalImpressions: longTermPages.reduce((s, p) => s + p.impressions, 0),
      totalClicks:      longTermPages.reduce((s, p) => s + p.clicks, 0),
      pageCount:        longTermPages.length,
    },
    recentSummary: {
      totalImpressions: recentPages.reduce((s, p) => s + p.impressions, 0),
      totalClicks:      recentPages.reduce((s, p) => s + p.clicks, 0),
      pageCount:        recentPages.length,
    },
    topPagesByImpressions: longTermPages
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15),
    lowCtrHighImpressions: longTermPages
      .filter(p => p.impressions > 50 && p.ctr < 3)
      .sort((a, b) => a.ctr - b.ctr)
      .slice(0, 10),
    recentHighPerformers: recentPages
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10),
    deltas:         deltas.slice(0, 15),
    protectedPages,
    greenfieldSlugs,
  };

  const insights = await getLlmInsights(context, config);

  // ── Save outputs ────────────────────────────────────────────────────────────

  const dateStr = new Date().toISOString().split('T')[0];
  const dir     = path.join(process.cwd(), config.output.dir);
  fs.mkdirSync(dir, { recursive: true });

  const report = {
    generatedAt:    new Date().toISOString(),
    site:           siteUrl,
    config:         { periods: { longTerm: 90, recent: 7 }, model: config.llm.model },
    dataSummary:    { longTerm: context.longTermSummary, recent: context.recentSummary },
    protectedPages,
    greenfieldSlugs,
    insights,
  };

  const jsonPath = path.join(dir, `${config.output.prefix}-${dateStr}.json`);
  const mdPath   = path.join(dir, `gsc-morning-${dateStr}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(mdPath,   generateMarkdownBrief(insights, dateStr, protectedPages), 'utf8');

  console.log(`\n✅ Morning analysis complete!`);
  console.log(`   JSON    → ${jsonPath}`);
  console.log(`   Brief   → ${mdPath}`);

  // Terminal quick view
  console.log(`\n📊 ${(insights.summary || '').substring(0, 200)}`);
  console.log(`\n💡 Top Actions:`);
  (insights.recommendations || []).slice(0, 5).forEach((r, i) => {
    console.log(`   ${i+1}. [${r.priority}] ${r.action}`);
  });
  if (protectedPages.length) {
    console.log(`\n🔒 Protected: ${protectedPages.length} pages`);
  }
  if (greenfieldSlugs.length) {
    console.log(`📝 Greenfield ready: ${greenfieldSlugs.join(', ')}`);
  }
}

runMorningAnalysis().catch(err => {
  console.error('\n💥 Error during morning analysis:');
  console.error(err.message);
  process.exit(1);
});
