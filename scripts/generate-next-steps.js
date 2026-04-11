#!/usr/bin/env node

/**
 * generate-next-steps.js
 * BooksVersusMovies.com — consolidated next steps briefing
 *
 * Reads project files and produces a briefing document summarising:
 *   - Current action plan          (docs/action-plan.txt)
 *   - Completed tasks              (docs/completed-tasks.md)
 *   - Pipeline data state          (data/extracted_metadata.csv, data/metadata-issues.csv)
 *   - Review JSON state            (data/reviews/)
 *   - Pipeline folder state        (pipeline/1-extracted, 2-revised, 3-rendered)
 *   - Prompt inventory             (scripts/prompts/)
 *   - Quarantine                   (reviews-to-review/)
 *   - GSC / Analytics reports      (data/reports/)
 *
 * Usage:
 *   node generate-next-steps.js
 *   node generate-next-steps.js --out ../docs/next-steps.md
 *   node generate-next-steps.js --clipboard
 *
 * Options:
 *   --out        Write output to a file in addition to stdout
 *   --clipboard  Also copy output to clipboard (pbcopy / clip / xclip)
 */

const fs             = require('fs');
const path           = require('path');
const { execSync }   = require('child_process');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const ROOT      = path.resolve(__dirname, '../');
const OUT_FILE  = get('--out', null);
const CLIPBOARD = hasFlag('--clipboard');

// ── Output buffer ─────────────────────────────────────────────────────────────

const lines = [];
const out   = s => lines.push(s === undefined ? '' : s);

// ── File helpers ──────────────────────────────────────────────────────────────

const abs      = rel => path.join(ROOT, rel);
const exists   = rel => fs.existsSync(abs(rel));

function readFile(rel) {
  try   { return fs.readFileSync(abs(rel), 'utf8'); }
  catch { return null; }
}

function countFiles(rel, ext) {
  try {
    if (!exists(rel)) return 0;
    return fs.readdirSync(abs(rel))
      .filter(f => {
        try { return fs.statSync(path.join(abs(rel), f)).isFile(); } catch { return false; }
      })
      .filter(f => !ext || path.extname(f).toLowerCase() === ext)
      .length;
  } catch { return 0; }
}

function listFiles(rel, ext) {
  try {
    if (!exists(rel)) return [];
    return fs.readdirSync(abs(rel))
      .filter(f => {
        try { return fs.statSync(path.join(abs(rel), f)).isFile(); } catch { return false; }
      })
      .filter(f => !ext || path.extname(f).toLowerCase() === ext)
      .sort();
  } catch { return []; }
}

function fileSizeKb(rel) {
  try   { return (fs.statSync(abs(rel)).size / 1024).toFixed(0) + 'kb'; }
  catch { return null; }
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseActionPlan(content) {
  if (!content) return { steps: [], total: 0, raw: null };
  const steps = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s+(\d+\.\d+)\s+(.+)/);
    if (m) steps.push({ id: m[1], text: m[2].trim() });
  }
  return { steps, total: steps.length, raw: content.trim() };
}

function parseCompletedTasks(content) {
  if (!content) return [];
  return content.split('\n')
    .filter(l => /^\[20\d\d-\d\d-\d\d\]/.test(l))
    .map(l => {
      const m = l.match(/^\[(\d{4}-\d{2}-\d{2})\]\s+(.+)/);
      return m ? { date: m[1], task: m[2].trim() } : null;
    })
    .filter(Boolean);
}

function parseMetadataCsv(content) {
  const empty = { total: 0, v1: 0, v2: 0, missingAffiliate: 0, hasQuickAnswer: 0, hasFaq: 0 };
  if (!content) return empty;

  // Parse header to find column indices dynamically — robust to column order changes
  const rows = content.split('\n').filter(Boolean);
  if (rows.length < 2) return empty;

  const headers = rows[0].split(',');
  const idx = name => headers.indexOf(name);

  const iGen       = idx('generation');
  const iAffiliate = idx('affiliateLinkCount');
  const iQuick     = idx('hasQuickAnswer');
  const iFaq       = idx('hasFaqSection');

  let total = 0, v1 = 0, v2 = 0, missingAffiliate = 0, hasQuickAnswer = 0, hasFaq = 0;

  for (const row of rows.slice(1)) {
    if (!row.trim()) continue;
    // Handle quoted fields with basic split (sufficient for this file's structure)
    const cols = row.split(',');
    total++;
    if (iGen       >= 0 && cols[iGen]       === 'v1')   v1++;
    if (iGen       >= 0 && cols[iGen]       === 'v2')   v2++;
    if (iAffiliate >= 0 && cols[iAffiliate] === '0')    missingAffiliate++;
    if (iQuick     >= 0 && cols[iQuick]     === 'true') hasQuickAnswer++;
    if (iFaq       >= 0 && cols[iFaq]       === 'true') hasFaq++;
  }

  return { total, v1, v2, missingAffiliate, hasQuickAnswer, hasFaq };
}

// ── Infer next action ─────────────────────────────────────────────────────────

function inferNextAction({ metaExists, dataState, extracted, revised, rendered, prompts, reviewJsonCount }) {
  if (!metaExists) {
    return [
      `Step 1.3: Run extractor to generate clean baseline metadata`,
      `  node scripts/extract-metadata.js --dir reviews --out data/extracted_metadata.csv --issues`,
    ];
  }
  if (dataState.v1 > 0) {
    return [
      `Step 1.2: Update extract-metadata.js — handle series pages (optional director) and`,
      `  non-standard book years (e.g. "800 BC"), then re-run for clean baseline`,
    ];
  }
  if (reviewJsonCount === 0 && extracted === 0) {
    return [
      `Step 2.1: Design the review JSON schema (data/reviews/*.json)`,
      `Step 2.2: Write scripts/html-to-json.js to extract existing pages into JSON`,
    ];
  }
  if (extracted > 0 && prompts.length === 0) {
    return [
      `Step 3.1: Write Pass 1 structural prompt`,
      `  → scripts/prompts/pass1-structural.txt`,
    ];
  }
  if (prompts.includes('pass1-structural.txt') && revised === 0) {
    return [
      `Step 3.3: Single-page prompt evaluation loop`,
      `  Run Pass 1 on one page → read JSON output → judge → adjust → repeat`,
    ];
  }
  if (prompts.includes('pass1-structural.txt') && !prompts.includes('pass2-conversion.txt')) {
    return [
      `Step 3.4: Write Pass 2 conversion prompt`,
      `  → scripts/prompts/pass2-conversion.txt`,
    ];
  }
  if (revised > 0 && rendered === 0) {
    return [
      `Step 4.1: Build minimal renderer (scripts/render.js)`,
      `  Handles existing page structure — enables visual validation of revised JSON`,
    ];
  }
  if (rendered > 0 && rendered < extracted) {
    return [`Continue rendering: ${rendered} of ${extracted} pages complete`];
  }
  if (rendered > 0 && rendered === extracted && extracted > 0) {
    return [
      `Step 6.1: Spot-check 10 rendered pages against originals`,
      `Step 6.2: Confirm affiliate links, YouTube IDs, related cards intact`,
      `Step 6.3: Re-run extractor as final QA pass`,
    ];
  }
  return [`Review docs/action-plan.txt and docs/completed-tasks.md to determine next step`];
}

// ── Report builder ────────────────────────────────────────────────────────────

function buildReport() {
  const now = new Date().toISOString().split('T')[0];

  out(`BooksVersusMovies.com — Next Steps Briefing`);
  out(`===========================================`);
  out(`Generated: ${now}`);
  out();

  // ── 1. Inferred next action (top of report for quick scanning) ───────────────
  const metaContent   = readFile('data/extracted_metadata.csv');
  const issuesContent = readFile('data/metadata-issues.csv');
  const dataState     = parseMetadataCsv(metaContent || '');
  const metaExists    = !!metaContent;

  const extracted     = countFiles('pipeline/1-extracted', '.json');
  const revised       = countFiles('pipeline/2-revised',   '.json');
  const rendered      = countFiles('pipeline/3-rendered',  '.html');
  const prompts       = listFiles('scripts/prompts', '.txt');
  const reviewJsonCount = countFiles('data/reviews', '.json');

  const nextActions = inferNextAction({
    metaExists, dataState, extracted, revised, rendered,
    prompts, reviewJsonCount,
  });

  out(`NEXT ACTION`);
  out(`-----------`);
  nextActions.forEach(a => out(`  → ${a}`));
  out();

  // ── 2. Action plan ───────────────────────────────────────────────────────────
  const planContent = readFile('docs/action-plan.txt');
  const plan        = parseActionPlan(planContent);

  out(`ACTION PLAN`);
  out(`-----------`);
  if (!planContent) {
    out(`  ⚠  docs/action-plan.txt not found`);
  } else {
    out(`  ${plan.total} substeps across 6 sections`);
    out();
    out(plan.raw);
  }
  out();

  // ── 3. Completed tasks ───────────────────────────────────────────────────────
  const completedContent = readFile('docs/completed-tasks.md');
  const completed        = parseCompletedTasks(completedContent || '');

  out(`COMPLETED TASKS (${completed.length} logged)`);
  out(`--------------------------------`);
  if (completed.length === 0) {
    out(`  No completed tasks logged yet — update docs/completed-tasks.md`);
  } else {
    const byDate = {};
    for (const t of completed) {
      if (!byDate[t.date]) byDate[t.date] = [];
      byDate[t.date].push(t.task);
    }
    for (const date of Object.keys(byDate).sort().reverse()) {
      out(`  ${date}`);
      byDate[date].forEach(task => out(`    ✓ ${task}`));
    }
  }
  out();

  // ── 4. Data state ────────────────────────────────────────────────────────────
  const reportGscCount = countFiles('data/reports/gsc', '.csv');
  const reportGaCount  = countFiles('data/reports/analytics', '.csv');

  out(`DATA STATE`);
  out(`----------`);
  if (!metaExists) {
    out(`  ⚠  data/extracted_metadata.csv not found`);
    out(`     Run: node scripts/extract-metadata.js --dir reviews --out data/extracted_metadata.csv --issues`);
  } else {
    const size = fileSizeKb('data/extracted_metadata.csv');
    out(`  extracted_metadata.csv   ${dataState.total} pages  (${size})`);
    out(`  generation v2:           ${dataState.v2}`);
    out(`  generation v1:           ${dataState.v1}${dataState.v1 > 0 ? '  ⚠ needs extractor update' : ''}`);
    out(`  missing affiliate links: ${dataState.missingAffiliate}`);
    out(`  has FAQ section:         ${dataState.hasFaq} / ${dataState.total}`);
    out(`  has quick-answer block:  ${dataState.hasQuickAnswer} / ${dataState.total}  ← target: all`);
    out(`  metadata-issues.csv:     ${issuesContent ? 'exists  (' + fileSizeKb('data/metadata-issues.csv') + ')' : '⚠ not found'}`);
  }
  out(`  data/reviews/ JSONs:     ${reviewJsonCount > 0 ? reviewJsonCount : '0  ← html-to-json.js not yet run'}`);
  out(`  GSC reports:             ${reportGscCount}`);
  out(`  Analytics reports:       ${reportGaCount}`);
  out();

  // ── 5. Pipeline state ────────────────────────────────────────────────────────
  out(`PIPELINE STATE`);
  out(`--------------`);
  out(`  1-extracted/   ${extracted} JSON files`);
  out(`  2-revised/     ${revised} JSON files`);
  out(`  3-rendered/    ${rendered} HTML files`);

  if (extracted === 0 && revised === 0 && rendered === 0) {
    out(`  Status: not yet started`);
  } else if (extracted > 0 && revised === 0) {
    out(`  Status: extraction complete — revision pass not yet run`);
  } else if (revised > 0 && rendered === 0) {
    out(`  Status: revision complete — renderer not yet built`);
  } else if (rendered > 0 && rendered < extracted) {
    out(`  Status: render in progress — ${rendered} / ${extracted} complete`);
  } else if (rendered > 0 && rendered === extracted) {
    out(`  Status: pipeline complete for all extracted files`);
  }
  out();

  // ── 6. Prompt inventory ──────────────────────────────────────────────────────
  const expectedPrompts = ['pass1-structural.txt', 'pass2-conversion.txt', 'greenfield.txt'];

  out(`PROMPT INVENTORY`);
  out(`----------------`);
  if (prompts.length === 0) {
    out(`  ⚠  scripts/prompts/ is empty`);
    expectedPrompts.forEach(p => out(`     missing: ${p}`));
  } else {
    prompts.forEach(p => out(`  ✓  ${p}`));
    const missing = expectedPrompts.filter(p => !prompts.includes(p));
    if (missing.length > 0) {
      out();
      missing.forEach(p => out(`  ⚠  missing: ${p}`));
    }
  }
  out();

  // ── 7. Reviews to review ─────────────────────────────────────────────────────
  const quarantined = listFiles('reviews-to-review', '.html');

  out(`REVIEWS TO REVIEW (${quarantined.length} files)`);
  out(`---------------------------`);
  if (quarantined.length === 0) {
    out(`  reviews-to-review/ is empty`);
  } else {
    quarantined.forEach(f => out(`  • ${f}`));
  }
  out();

  // ── 8. GSC reports ───────────────────────────────────────────────────────────
  if (reportGscCount > 0) {
    const gscFiles = listFiles('data/reports/gsc', '.csv');
    out(`GSC REPORTS`);
    out(`-----------`);
    gscFiles.forEach(f => out(`  ${f}`));
    out(`  → Available for CTR and ranking analysis`);
    out();
  }

  out(`===========================================`);
  out(`End of briefing — ${now}`);
}

// ── Run and output ────────────────────────────────────────────────────────────

buildReport();

const output = lines.join('\n');

console.log(output);

if (OUT_FILE) {
  const outPath = path.resolve(__dirname, OUT_FILE);
  fs.writeFileSync(outPath, output, 'utf8');
  console.error(`\n✓ Written to ${outPath}`);
}

if (CLIPBOARD) {
  try {
    const cmd = process.platform === 'darwin' ? 'pbcopy'
              : process.platform === 'win32'  ? 'clip'
              : 'xclip -selection clipboard';
    execSync(cmd, { input: output });
    console.error(`✓ Copied to clipboard`);
  } catch {
    console.error(`⚠  Clipboard copy failed`);
  }
}
