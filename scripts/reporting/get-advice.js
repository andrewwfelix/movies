#!/usr/bin/env node

/**
 * get-advice.js
 * BooksVersusMovies.com — multi-LLM advice tool
 *
 * Reads all .txt files from advice/inputs/, consolidates them into a
 * single question, queries each configured LLM in parallel, and writes
 * one response file per model to advice/outputs/.
 *
 * Usage:
 *   node scripts/get-advice.js
 *   node scripts/get-advice.js --dry    (show consolidated input without calling APIs)
 *
 * Config:   advice/config.json          (which models to query)
 * Inputs:   advice/inputs/*.txt         (your questions — all consolidated)
 * Outputs:  advice/outputs/TIMESTAMP-MODEL.txt
 * Destination: scripts/reporting/get-advice.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const args    = process.argv.slice(2);
const hasFlag = flag => args.includes(flag);
const DRY_RUN = hasFlag('--dry');

const ROOT        = path.resolve(__dirname, '..');
const INPUTS_DIR  = path.join(ROOT, 'advice', 'inputs');
const OUTPUTS_DIR = path.join(ROOT, 'advice', 'outputs');
const CONFIG_PATH = path.join(ROOT, 'config', 'advice.json');

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const API_KEY = process.env.OPENROUTER_API_KEY;

// ── Load config ───────────────────────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`✗ Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// ── Consolidate inputs ────────────────────────────────────────────────────────

function consolidateInputs() {
  if (!fs.existsSync(INPUTS_DIR)) {
    console.error(`✗ Inputs directory not found: ${INPUTS_DIR}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(INPUTS_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  // Always put query.txt first if it exists
  const files = [
    ...allFiles.filter(f => f === 'query.txt'),
    ...allFiles.filter(f => f !== 'query.txt'),
  ];

  if (files.length === 0) {
    console.error(`✗ No .txt files found in ${INPUTS_DIR}`);
    console.error(`  Add one or more question files and run again.`);
    process.exit(1);
  }

  const queryFile    = files.find(f => f === 'query.txt');
  const contextFiles = files.filter(f => f !== 'query.txt');

  if (!queryFile) {
    console.error('\u2717 query.txt not found in advice/inputs/ \u2014 this file is required as the primary question.');
    process.exit(1);
  }

  const queryContent = fs.readFileSync(path.join(INPUTS_DIR, queryFile), 'utf8').trim();

  const parts = [`PRIMARY QUESTION\n================\n${queryContent}`];

  if (contextFiles.length > 0) {
    parts.push(`SUPPORTING INFORMATION\n======================\nThe following files provide additional context. They are not questions \u2014 treat them as background information only.\n`);
    for (const file of contextFiles) {
      const fileContent = fs.readFileSync(path.join(INPUTS_DIR, file), 'utf8').trim();
      parts.push(`--- ${file} ---\n${fileContent}`);
    }
  }

  return {
    files,
    consolidated: parts.join('\n\n'),
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
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   'https://booksversusmovies.com',
        'X-Title':        'BooksVersusMovies Advice',
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
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) { reject(new Error('Empty response')); return; }
          resolve(text);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nRaw: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(90000, () => req.destroy(new Error('Request timed out after 90s')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Write output file ─────────────────────────────────────────────────────────

function writeOutput(timestamp, modelConfig, question, response, durationMs, error) {
  const filename  = `${timestamp}-${modelConfig.id}.txt`;
  const outPath   = path.join(OUTPUTS_DIR, filename);

  const lines = [
    `BooksVersusMovies.com — Advice`,
    `==============================`,
    `Model:     ${modelConfig.label} (${modelConfig.model})`,
    `Generated: ${new Date().toISOString()}`,
    `Duration:  ${durationMs}ms`,
    ``,
    `── Question ──────────────────────────────────────────────────────────`,
    ``,
    question,
    ``,
    `── Response ──────────────────────────────────────────────────────────`,
    ``,
    error ? `ERROR: ${error}` : response,
    ``,
  ];

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!DRY_RUN && !API_KEY) {
    console.error('✗ OPENROUTER_API_KEY not set — add it to .env');
    process.exit(1);
  }

  const config = loadConfig();
  const { files, consolidated } = consolidateInputs();

  // Ensure outputs directory exists
  if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  }

  console.log(`\nget-advice.js`);
  console.log(`Input files: ${files.join(', ')}`);
  console.log(`Models:      ${config.models.map(m => m.label).join(', ')}`);
  console.log(`Dry run:     ${DRY_RUN ? 'yes' : 'no'}`);
  console.log(`\n── Consolidated question ─────────────────────────────────────────────`);
  console.log(consolidated);
  console.log(`─────────────────────────────────────────────────────────────────────\n`);

  if (DRY_RUN) {
    console.log(`[DRY] Would query ${config.models.length} models in parallel.`);
    return;
  }

  const timestamp = new Date().toISOString()
    .replace('T', '_')
    .replace(/[:.]/g, '-')
    .slice(0, 19);

  // Query all models in parallel
  console.log(`Querying ${config.models.length} models in parallel...\n`);

  const promises = config.models.map(async modelConfig => {
    const start = Date.now();
    process.stdout.write(`  ↻  ${modelConfig.label}...`);
    try {
      const response   = await callModel(
        modelConfig.model,
        config.systemPrompt,
        consolidated,
        config.maxTokens,
        config.temperature,
      );
      const durationMs = Date.now() - start;
      process.stdout.write(` ✓ (${durationMs}ms)\n`);
      return { modelConfig, response, durationMs, error: null };
    } catch (err) {
      const durationMs = Date.now() - start;
      process.stdout.write(` ✗ ${err.message}\n`);
      return { modelConfig, response: null, durationMs, error: err.message };
    }
  });

  const results = await Promise.all(promises);

  // Write one output file per model
  console.log(`\n── Output files ──────────────────────────────────────────────────────`);
  for (const { modelConfig, response, durationMs, error } of results) {
    const outPath = writeOutput(timestamp, modelConfig, consolidated, response, durationMs, error);
    console.log(`  ✓  ${modelConfig.label} → ${path.relative(ROOT, outPath)}`);
  }

  console.log(`\nDone. Open advice/outputs/ to review responses.`);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
