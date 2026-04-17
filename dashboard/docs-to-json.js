#!/usr/bin/env node

/**
 * dashboard/docs-to-json.js
 * BooksVersusMovies.com — converts docs markdown files to structured JSON
 *
 * Reads:
 *   docs/kanban.md        → dashboard/project-status.json
 *   docs/reference/decisions.md → dashboard/decisions.json
 *
 * Usage (run from project root):
 *   node dashboard/docs-to-json.js
 *   node dashboard/docs-to-json.js --dry    (print JSON without writing)
 *   node dashboard/docs-to-json.js --kanban-only
 *   node dashboard/docs-to-json.js --decisions-only
 *
 * Output:
 *   dashboard/project-status.json
 *   dashboard/decisions.json
 *
 * Destination: dashboard/docs-to-json.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args           = process.argv.slice(2);
const DRY            = args.includes('--dry');
const KANBAN_ONLY    = args.includes('--kanban-only');
const DECISIONS_ONLY = args.includes('--decisions-only');

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT           = process.cwd();
const KANBAN_PATH    = path.join(ROOT, 'docs', 'kanban.md');
const DECISIONS_PATH = path.join(ROOT, 'docs', 'reference', 'decisions.md');
const OUT_DIR = path.join(ROOT, 'dashboard', 'data');

// ── Priority map — section heading → priority ─────────────────────────────────

const SECTION_PRIORITY = {
  'today':                  'today',
  'in progress':            'in-progress',
  'high priority':          'high',
  'medium priority':        'medium',
  'low priority / later':   'low',
  'low priority':           'low',
  'pipeline robustness':    'medium',
  'vercel migration':       'medium',
  'dashboard':              'high',
  'business / operations':  'high',
  'theapiaryguide.com':     'future',
};

const SECTION_CATEGORY = {
  'today':                  'today',
  'in progress':            'in-progress',
  'high priority':          'tech',
  'medium priority':        'tech',
  'low priority / later':   'tech',
  'low priority':           'tech',
  'pipeline robustness':    'tech',
  'vercel migration':       'infra',
  'dashboard':              'tech',
  'business / operations':  'biz',
  'theapiaryguide.com':     'future',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip markdown formatting from a line
function cleanText(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .trim();
}

// Extract date from a Done section heading e.g. "Done — 2026-04-17"
function extractDate(heading) {
  const m = heading.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// Parse a checkbox line — returns { text, done, date } or null
function parseCheckbox(line) {
  // Matches: - [ ] text or - [x] text
  const m = line.match(/^-\s+\[([ x])\]\s+(.+)$/i);
  if (!m) return null;
  return {
    text: cleanText(m[2]),
    done: m[1].toLowerCase() === 'x',
  };
}

// Parse a plain list item (in-progress bullets with no checkbox)
function parseBullet(line) {
  const m = line.match(/^-\s+(?!\[)(.+)$/);
  if (!m) return null;
  return { text: cleanText(m[1]) };
}

// ── Kanban parser ─────────────────────────────────────────────────────────────

function parseKanban(content) {
  const lines    = content.split('\n');
  const sections = [];
  let current    = null;
  let lastUpdated = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Extract last updated date from header
    if (!lastUpdated) {
      const m = line.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/i);
      if (m) { lastUpdated = m[1]; continue; }
    }

    // H2 section heading
    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      const key     = heading.toLowerCase().replace(/\s*—.*$/, '').trim();
      const isDone  = key.startsWith('done');
      const date    = isDone ? extractDate(heading) : null;

      current = {
        heading,
        key,
        priority: SECTION_PRIORITY[key] || (isDone ? 'done' : 'other'),
        category: SECTION_CATEGORY[key] || (isDone ? 'done' : 'other'),
        isDone,
        date,
        items: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;

    // Checkbox item
    const checkbox = parseCheckbox(line);
    if (checkbox) {
      current.items.push({
        text:     checkbox.text,
        status:   checkbox.done ? 'done' : 'not-started',
        priority: current.priority,
        category: current.category,
        date:     current.date || null,
      });
      continue;
    }

    // Plain bullet (in-progress items)
    if (current.key === 'in progress') {
      const bullet = parseBullet(line);
      if (bullet) {
        current.items.push({
          text:     bullet.text,
          status:   'in-progress',
          priority: 'in-progress',
          category: 'in-progress',
          date:     null,
        });
      }
    }
  }

  // Build flat task list for easy querying
  const allTasks = [];
  for (const section of sections) {
    for (const item of section.items) {
      allTasks.push({ ...item, section: section.heading });
    }
  }

  // Summary counts
  const todo       = allTasks.filter(t => t.status === 'not-started');
  const inProgress = allTasks.filter(t => t.status === 'in-progress');
  const done       = allTasks.filter(t => t.status === 'done');
  const today      = allTasks.filter(t => t.priority === 'today');
  const high       = allTasks.filter(t => t.priority === 'high' && t.status === 'not-started');

  return {
    meta: {
      source:      'docs/kanban.md',
      lastUpdated: lastUpdated || new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString().split('T')[0],
    },
    summary: {
      total:      allTasks.length,
      todo:       todo.length,
      inProgress: inProgress.length,
      done:       done.length,
      today:      today.length,
      highPriority: high.length,
    },
    sections,
    tasks: allTasks,
  };
}

// ── Decisions parser ──────────────────────────────────────────────────────────

function parseDecisions(content) {
  const lines    = [];
  const decisions = [];
  let current    = null;
  let category   = null;

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd();

    // H2 = category
    if (line.startsWith('## ')) {
      category = line.slice(3).trim();
      continue;
    }

    // H3 = decision title
    if (line.startsWith('### ')) {
      if (current) decisions.push(current);
      current = {
        title:        line.slice(4).trim(),
        category:     category || 'General',
        date:         null,
        decision:     null,
        alternatives: null,
        rationale:    null,
        status:       null,
      };
      continue;
    }

    if (!current) continue;

    // Key: value fields
    const fieldMatch = line.match(/^(Date|Decision|Alternatives|Rationale|Status):\s*(.+)$/i);
    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const val = fieldMatch[2].trim();
      if (key === 'date')         current.date         = val;
      if (key === 'decision')     current.decision     = val;
      if (key === 'alternatives') current.alternatives = val;
      if (key === 'rationale')    current.rationale    = val;
      if (key === 'status')       current.status       = val;
    }
  }

  if (current) decisions.push(current);

  return {
    meta: {
      source:      'docs/reference/decisions.md',
      generatedAt: new Date().toISOString().split('T')[0],
    },
    summary: {
      total:      decisions.length,
      categories: [...new Set(decisions.map(d => d.category))],
    },
    decisions,
  };
}

// ── Write output ──────────────────────────────────────────────────────────────

function writeJSON(outPath, data, label) {
  const json = JSON.stringify(data, null, 2);
  if (DRY) {
    console.log(`\n[DRY] ${label}:`);
    console.log(json.slice(0, 500) + (json.length > 500 ? '\n  ...' : ''));
    return;
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, json, 'utf8');
  console.log(`  ✓  ${path.relative(ROOT, outPath)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log(`\ndocs-to-json.js`);
  console.log(`Dry run: ${DRY ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(52)}`);

  // Parse kanban
  if (!DECISIONS_ONLY) {
    if (!fs.existsSync(KANBAN_PATH)) {
      console.error(`  ✗  Not found: ${KANBAN_PATH}`);
    } else {
      const content = fs.readFileSync(KANBAN_PATH, 'utf8');
      const data    = parseKanban(content);
      writeJSON(path.join(OUT_DIR, 'project-status.json'), data, 'project-status.json');
      if (!DRY) {
        console.log(`     Tasks: ${data.summary.total} total, ${data.summary.todo} todo, ${data.summary.inProgress} in-progress, ${data.summary.done} done`);
        console.log(`     Today: ${data.summary.today} · High priority: ${data.summary.highPriority}`);
      }
    }
  }

  // Parse decisions
  if (!KANBAN_ONLY) {
    if (!fs.existsSync(DECISIONS_PATH)) {
      console.error(`  ✗  Not found: ${DECISIONS_PATH}`);
    } else {
      const content = fs.readFileSync(DECISIONS_PATH, 'utf8');
      const data    = parseDecisions(content);
      writeJSON(path.join(OUT_DIR, 'decisions.json'), data, 'decisions.json');
      if (!DRY) {
        console.log(`     Decisions: ${data.summary.total} across ${data.summary.categories.length} categories`);
      }
    }
  }

  console.log(`\nNext: refresh dashboard at localhost:3000/dashboard`);
}

run();
