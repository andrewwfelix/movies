#!/usr/bin/env node

/**
 * dashboard/docs-to-json.js
 * BooksVersusMovies.com — converts docs markdown files to structured JSON
 *
 * Reads:
 *   docs/kanban.md                      → dashboard/data/project-status.json
 *   docs/reference/decisions.md         → dashboard/data/decisions.json
 *   docs/reference/notes.md             → dashboard/data/notes.json
 *   docs/brainstorming/brainstorming.md → dashboard/data/brainstorming.json
 *
 * Usage (run from project root):
 *   node dashboard/docs-to-json.js
 *   node dashboard/docs-to-json.js --dry
 *   node dashboard/docs-to-json.js --kanban-only
 *   node dashboard/docs-to-json.js --decisions-only
 *   node dashboard/docs-to-json.js --notes-only
 *   node dashboard/docs-to-json.js --brainstorming-only
 *
 * Destination: dashboard/docs-to-json.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args               = process.argv.slice(2);
const DRY                = args.includes('--dry');
const KANBAN_ONLY        = args.includes('--kanban-only');
const DECISIONS_ONLY     = args.includes('--decisions-only');
const NOTES_ONLY         = args.includes('--notes-only');
const BRAINSTORMING_ONLY = args.includes('--brainstorming-only');
const RUN_ALL            = !KANBAN_ONLY && !DECISIONS_ONLY && !NOTES_ONLY && !BRAINSTORMING_ONLY;

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT            = process.cwd();
const KANBAN_PATH     = path.join(ROOT, 'docs', 'kanban.md');
const DECISIONS_PATH  = path.join(ROOT, 'docs', 'reference', 'decisions.md');
const NOTES_PATH      = path.join(ROOT, 'docs', 'reference', 'notes.md');
const BRAINSTORM_PATH = path.join(ROOT, 'docs', 'brainstorming', 'brainstorming.md');
const OUT_DIR         = path.join(ROOT, 'dashboard', 'data');

// ── Priority / category maps ──────────────────────────────────────────────────

const SECTION_PRIORITY = {
  'today': 'today', 'in progress': 'in-progress',
  'high priority': 'high', 'medium priority': 'medium',
  'low priority / later': 'low', 'low priority': 'low',
  'pipeline robustness': 'medium', 'vercel migration': 'medium',
  'vercel epic': 'future', 'dashboard': 'high',
  'business / operations': 'high', 'internationalization epic': 'future',
  'theapiaryguide.com': 'future',
};

const SECTION_CATEGORY = {
  'today': 'today', 'in progress': 'in-progress',
  'high priority': 'tech', 'medium priority': 'tech',
  'low priority / later': 'tech', 'low priority': 'tech',
  'pipeline robustness': 'tech', 'vercel migration': 'infra',
  'vercel epic': 'infra', 'dashboard': 'tech',
  'business / operations': 'biz', 'internationalization epic': 'i18n',
  'theapiaryguide.com': 'future',
};

// ── Shared helpers ────────────────────────────────────────────────────────────

const cleanText  = t => t.replace(/\*\*/g,'').replace(/\*/g,'').replace(/`/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();
const extractDate = h => { const m = h.match(/(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; };
const parseBool  = v => v && v.trim().toLowerCase() === 'true';
const parseList  = v => v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
const today      = () => new Date().toISOString().split('T')[0];

function writeJSON(outPath, data, label) {
  const json = JSON.stringify(data, null, 2);
  if (DRY) {
    console.log(`\n[DRY] ${label}:`);
    console.log(json.slice(0, 600) + (json.length > 600 ? '\n  ...' : ''));
    return;
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, json, 'utf8');
  console.log(`  ✓  ${path.relative(ROOT, outPath)}`);
}

// ── Kanban parser ─────────────────────────────────────────────────────────────

function parseKanban(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = null, lastUpdated = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!lastUpdated) {
      const m = line.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/i);
      if (m) { lastUpdated = m[1]; continue; }
    }

    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      const key     = heading.toLowerCase().replace(/\s*—.*$/, '').trim();
      const isDone  = key.startsWith('done');
      current = {
        heading, key,
        priority: SECTION_PRIORITY[key] || (isDone ? 'done' : 'other'),
        category: SECTION_CATEGORY[key] || (isDone ? 'done' : 'other'),
        isDone, date: isDone ? extractDate(heading) : null, items: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;

    const cb = line.match(/^-\s+\[([ x])\]\s+(.+)$/i);
    if (cb) {
      current.items.push({
        text: cleanText(cb[2]),
        status: cb[1].toLowerCase() === 'x' ? 'done' : 'not-started',
        priority: current.priority, category: current.category,
        date: current.date || null,
      });
      continue;
    }

    if (current.key === 'in progress') {
      const b = line.match(/^-\s+(?!\[)(.+)$/);
      if (b) current.items.push({ text: cleanText(b[1]), status: 'in-progress', priority: 'in-progress', category: 'in-progress', date: null });
    }
  }

  const allTasks   = sections.flatMap(s => s.items.map(i => ({ ...i, section: s.heading })));
  const todo       = allTasks.filter(t => t.status === 'not-started');
  const inProgress = allTasks.filter(t => t.status === 'in-progress');
  const done       = allTasks.filter(t => t.status === 'done');

  return {
    meta: { source: 'docs/kanban.md', lastUpdated: lastUpdated || today(), generatedAt: today() },
    summary: {
      total: allTasks.length, todo: todo.length, inProgress: inProgress.length, done: done.length,
      today: allTasks.filter(t => t.priority === 'today').length,
      highPriority: allTasks.filter(t => t.priority === 'high' && t.status === 'not-started').length,
    },
    sections, tasks: allTasks,
  };
}

// ── Decisions parser ──────────────────────────────────────────────────────────

function parseDecisions(content) {
  const decisions = [];
  let current = null, category = null;

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) { category = line.slice(3).trim(); continue; }
    if (line.startsWith('### ')) {
      if (current) decisions.push(current);
      current = { title: line.slice(4).trim(), category: category || 'General', date: null, decision: null, alternatives: null, rationale: null, status: null };
      continue;
    }
    if (!current) continue;
    const m = line.match(/^(Date|Decision|Alternatives|Rationale|Status):\s*(.+)$/i);
    if (m) current[m[1].toLowerCase()] = m[2].trim();
  }

  if (current) decisions.push(current);
  return {
    meta: { source: 'docs/reference/decisions.md', generatedAt: today() },
    summary: { total: decisions.length, categories: [...new Set(decisions.map(d => d.category))] },
    decisions,
  };
}

// ── Generic H3 block parser ───────────────────────────────────────────────────

function parseH3Blocks(content) {
  const entries = [];
  let current   = null;

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd();

    if (line.startsWith('### ')) {
      if (current) entries.push(current);
      const hm = line.slice(4).trim().match(/^\[([^\]]+)\]\s*(.+)$/);
      current = { id: hm ? hm[1] : null, title: hm ? hm[2].trim() : line.slice(4).trim(), _f: {} };
      continue;
    }
    if (!current) continue;
    if (line === '---') { if (current) entries.push(current); current = null; continue; }
    const fm = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (fm) current._f[fm[1].toLowerCase()] = fm[2].trim();
  }

  if (current) entries.push(current);
  return entries.filter(e => e.id || e.title);
}

// ── Notes parser ──────────────────────────────────────────────────────────────

function parseNotes(content) {
  const notes = parseH3Blocks(content).map(e => {
    const f = e._f;
    return {
      id: e.id || e.title.toLowerCase().replace(/\s+/g, '-'),
      title: e.title, date: f.date || null, category: f.category || 'general',
      priority: f.priority || 'medium', status: f.status || 'not-started',
      tags: parseList(f.tags), dependencies: parseList(f.dependencies),
      body: f.body || '',
    };
  });

  const byCategory = {}, byPriority = {};
  for (const n of notes) {
    byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
  }

  return {
    meta: { source: 'docs/reference/notes.md', generatedAt: today() },
    summary: { total: notes.length, byCategory, byPriority },
    notes,
  };
}

// ── Brainstorming parser ──────────────────────────────────────────────────────

function parseBrainstorming(content) {
  const entries = parseH3Blocks(content).map(e => {
    const f = e._f;
    return {
      id: e.id || e.title.toLowerCase().replace(/\s+/g, '-'),
      title: e.title, date: f.date || null, topic: e.title,
      category: f.category || 'general', llm: f.llm || 'unknown',
      sentiment: f.sentiment || 'neutral', signal: f.signal || 'medium',
      actionable: parseBool(f.actionable), promoted: parseBool(f.promoted),
      tags: parseList(f.tags), summary: f.summary || '', comment: f.comment || '',
    };
  });

  const byLlm = {}, byCategory = {}, bySentiment = {};
  for (const e of entries) {
    byLlm[e.llm]             = (byLlm[e.llm] || 0) + 1;
    byCategory[e.category]   = (byCategory[e.category] || 0) + 1;
    bySentiment[e.sentiment] = (bySentiment[e.sentiment] || 0) + 1;
  }

  return {
    meta: { source: 'docs/brainstorming/brainstorming.md', generatedAt: today() },
    summary: {
      total: entries.length,
      actionable: entries.filter(e => e.actionable).length,
      promoted: entries.filter(e => e.promoted).length,
      byLlm, byCategory, bySentiment,
    },
    entries,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log(`\ndocs-to-json.js`);
  console.log(`Dry run: ${DRY ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(52)}`);

  const tasks = [
    { flag: RUN_ALL || KANBAN_ONLY,        file: KANBAN_PATH,     parser: parseKanban,        out: 'project-status.json', label: d => `Tasks: ${d.summary.total} total · ${d.summary.todo} todo · ${d.summary.inProgress} in-progress · ${d.summary.done} done` },
    { flag: RUN_ALL || DECISIONS_ONLY,     file: DECISIONS_PATH,  parser: parseDecisions,     out: 'decisions.json',      label: d => `Decisions: ${d.summary.total} across ${d.summary.categories.length} categories` },
    { flag: RUN_ALL || NOTES_ONLY,         file: NOTES_PATH,      parser: parseNotes,         out: 'notes.json',          label: d => `Notes: ${d.summary.total} across ${Object.keys(d.summary.byCategory).length} categories` },
    { flag: RUN_ALL || BRAINSTORMING_ONLY, file: BRAINSTORM_PATH, parser: parseBrainstorming, out: 'brainstorming.json',  label: d => `Brainstorming: ${d.summary.total} entries · ${d.summary.actionable} actionable · ${d.summary.promoted} promoted` },
  ];

  for (const task of tasks) {
    if (!task.flag) continue;
    if (!fs.existsSync(task.file)) { console.error(`  ✗  Not found: ${task.file}`); continue; }
    const data = task.parser(fs.readFileSync(task.file, 'utf8'));
    writeJSON(path.join(OUT_DIR, task.out), data, task.out);
    if (!DRY) console.log(`     ${task.label(data)}`);
  }

  console.log(`\nNext: refresh dashboard at localhost:3000/dashboard\n`);
}

run();
