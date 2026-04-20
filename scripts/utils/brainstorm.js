#!/usr/bin/env node

/**
 * scripts/utils/brainstorm.js
 * BooksVersusMovies.com — Two-model iterative brainstorm utility
 *
 * Two LLMs converse iteratively on a given prompt.
 * Full conversation history is passed to each model on every turn.
 * The second model defined in brainstorm.json takes the final turn
 * and acts as the adjudicator/synthesizer.
 *
 * Flow:
 *   User prompt → LLM A → LLM B → LLM A → LLM B → ... → LLM B (final)
 *
 * Usage:
 *   node scripts/utils/brainstorm.js --prompt "How should we expand to new verticals?"
 *   node scripts/utils/brainstorm.js --prompt "..." --config config/brainstorm-business.json
 *   node scripts/utils/brainstorm.js --prompt "..." --iterations 4
 *   node scripts/utils/brainstorm.js --prompt "..." --out data/brainstorms/my-topic.json
 *
 * Output: data/brainstorms/brainstorm-YYYY-MM-DD-HH-MM.json
 *
 * Destination: scripts/utils/brainstorm.js
 */

'use strict';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const get     = (f, fb) => { const i = args.indexOf(f); return i !== -1 && args[i+1] ? args[i+1] : fb; };
const hasFlag = f => args.includes(f);

const PROMPT_ARG    = get('--prompt', null);
const CONFIG_ARG    = get('--config', null);
const ITERATIONS_ARG = parseInt(get('--iterations', '0')) || 0;
const OUT_ARG       = get('--out', null);

if (!PROMPT_ARG) {
  console.error('✗ --prompt is required');
  console.error('  Usage: node scripts/utils/brainstorm.js --prompt "Your topic here"');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, CONFIG_ARG || 'config/brainstorm.json');
const OUT_DIR     = path.join(ROOT, 'data', 'brainstorms');

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

// ── Load config ───────────────────────────────────────────────────────────────

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`✗ Config not found: ${CONFIG_PATH}`);
  process.exit(1);
}

const CONFIG     = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const MODELS     = CONFIG.models;         // array of exactly 2 model configs
const ITERATIONS = ITERATIONS_ARG || CONFIG.iterations || 3;
const API_KEY    = process.env[CONFIG.apiKeyEnv || 'OPENROUTER_API_KEY'];

// ── Load prompt file ──────────────────────────────────────────────────────────

const PROMPT_FILE = path.join(ROOT, CONFIG.promptFile || 'scripts/prompts/brainstorm-prompt.txt');
if (!fs.existsSync(PROMPT_FILE)) {
  console.error(`✗ Prompt file not found: ${PROMPT_FILE}`);
  console.error(`  Set "promptFile" in brainstorm.json or create scripts/prompts/brainstorm-prompt.txt`);
  process.exit(1);
}
const SYSTEM_PROMPT = fs.readFileSync(PROMPT_FILE, 'utf8').trim();

if (!MODELS || MODELS.length !== 2) {
  console.error('✗ brainstorm.json must define exactly 2 models in the "models" array');
  process.exit(1);
}

if (!API_KEY) {
  console.error(`✗ API key not found — set ${CONFIG.apiKeyEnv || 'OPENROUTER_API_KEY'} in .env`);
  process.exit(1);
}

// ── API call ──────────────────────────────────────────────────────────────────

function callModel(modelCfg, messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:       modelCfg.model,
      temperature: modelCfg.temperature ?? 0.7,
      max_tokens:  modelCfg.maxTokens   ?? 1000,
      messages,
    });

    const req = https.request({
      hostname: 'openrouter.ai',
      path:     '/api/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   'https://booksversusmovies.com',
        'X-Title':        'BooksVersusMovies Brainstorm',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(`API error: ${json.error.message}`));
          const text = json.choices?.[0]?.message?.content?.trim();
          if (!text) return reject(new Error('Empty response from model'));
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error(`Request timeout after 90s (model: ${modelCfg.model})`));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Build messages array ──────────────────────────────────────────────────────

// Each model sees the full conversation history from its own perspective.
// LLM A sees itself as "assistant" and LLM B as "user", and vice versa.
// We build the history as alternating user/assistant turns from each model's POV.

function buildMessages(systemPrompt, turns, currentModelIndex) {
  const messages = [{ role: 'system', content: systemPrompt }];

  turns.forEach((turn, i) => {
    // From the current model's perspective:
    // turns by the same model = assistant, turns by the other model = user
    const turnModelIndex = i % 2 === 0 ? 0 : 1; // model A takes even turns (0,2,4...), B takes odd
    const role = turnModelIndex === currentModelIndex ? 'assistant' : 'user';
    messages.push({ role, content: turn.content });
  });

  return messages;
}

// ── Generate output path ──────────────────────────────────────────────────────

function generateOutPath(prompt) {
  if (OUT_ARG) return path.join(ROOT, OUT_ARG);
  const now    = new Date();
  const stamp  = now.toISOString().replace('T', '-').slice(0, 16).replace(':', '-');
  const slug   = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/-$/, '');
  return path.join(OUT_DIR, `brainstorm-${stamp}-${slug}.json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nbrainstorm.js`);
  console.log(`Model A:    ${MODELS[0].label || MODELS[0].model}`);
  console.log(`Model B:    ${MODELS[1].label || MODELS[1].model}`);
  console.log(`Iterations: ${ITERATIONS} (Model B takes final turn)`);
  console.log(`Prompt:     ${PROMPT_ARG.slice(0, 80)}${PROMPT_ARG.length > 80 ? '...' : ''}`);
  console.log(`${'─'.repeat(60)}`);

  const turns = []; // { model, modelIndex, content }

  // Total turns = ITERATIONS * 2, but we ensure Model B always goes last
  // Turn sequence: A, B, A, B, ... ending on B
  // If iterations = 3: A, B, A, B, A, B = 6 turns (3 full exchanges)

  const totalTurns = ITERATIONS * 2;

  for (let i = 0; i < totalTurns; i++) {
    const modelIndex = i % 2 === 0 ? 0 : 1;
    const modelCfg   = MODELS[modelIndex];
    const label      = modelCfg.label || modelCfg.model;
    const isFinal    = i === totalTurns - 1;

    process.stdout.write(
      `\n[Turn ${i + 1}/${totalTurns}] ${label}${isFinal ? ' (final — adjudicating)' : ''}...\n`
    );

    // System prompt — loaded from promptFile, with role context appended
    const otherLabel = MODELS[1 - modelIndex].label || MODELS[1 - modelIndex].model;

    let systemPrompt;
    if (isFinal) {
      systemPrompt = `${SYSTEM_PROMPT}

You are ${label}. This is your final turn in the brainstorm.
Your partner was ${otherLabel}.
Synthesize the strongest ideas from the full conversation. Identify the top 3-5 actionable insights, highlight areas of consensus, and note any unresolved tensions worth exploring.
Be direct and specific. Format your response clearly.`;
    } else if (i === 0) {
      systemPrompt = `${SYSTEM_PROMPT}

You are ${label}. You are brainstorming with ${otherLabel}.
Respond to the prompt with your best ideas. Be specific, bold, and push thinking forward.
Don't hedge. Take positions. Your partner will build on, challenge, or refine your ideas.`;
    } else {
      systemPrompt = `${SYSTEM_PROMPT}

You are ${label}. You are brainstorming with ${otherLabel}.
Read the conversation carefully. Build on strong ideas, challenge weak ones, introduce new angles.
Be specific and direct. Push the thinking forward. Don't just agree — add value.`;
    }

    // First turn: messages = system + user prompt
    // Subsequent turns: system + full history from this model's POV
    let messages;
    if (i === 0) {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: PROMPT_ARG },
      ];
    } else {
      // Build history: the original prompt is always the first user message
      const historyMessages = [{ role: 'system', content: systemPrompt }];

      // Add original prompt as first user message
      historyMessages.push({ role: 'user', content: PROMPT_ARG });

      // Add all turns so far, alternating roles from this model's perspective
      turns.forEach((turn, ti) => {
        const role = turn.modelIndex === modelIndex ? 'assistant' : 'user';
        historyMessages.push({ role, content: turn.content });
      });

      messages = historyMessages;
    }

    try {
      const response = await callModel(modelCfg, messages);
      turns.push({ model: label, modelIndex, turn: i + 1, content: response });
      console.log(`  ✓ ${response.slice(0, 120).replace(/\n/g, ' ')}...`);
    } catch (err) {
      console.error(`  ✗ ${label} failed on turn ${i + 1}: ${err.message}`);
      turns.push({
        model:      label,
        modelIndex,
        turn:       i + 1,
        content:    `[Error: ${err.message}]`,
        error:      true,
      });
    }

    // Small delay between calls
    if (i < totalTurns - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // ── Save output ─────────────────────────────────────────────────────────────

  const outPath = generateOutPath(PROMPT_ARG);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    prompt:      PROMPT_ARG,
    config: {
      modelA:     MODELS[0].label || MODELS[0].model,
      modelB:     MODELS[1].label || MODELS[1].model,
      iterations: ITERATIONS,
    },
    turns,
    final: turns[turns.length - 1]?.content || '',
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ Brainstorm complete — ${turns.length} turns`);
  console.log(`  Output: ${path.relative(ROOT, outPath)}`);
  console.log(`\n── Final synthesis (${MODELS[1].label || MODELS[1].model}) ──`);
  console.log(output.final);
  console.log();
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
