#!/usr/bin/env node

/**
 * admin/import-gsc.js
 * BooksVersusMovies.com — imports GSC CSV exports into dashboard-data/gsc-24-hour.json
 *
 * Reads the most recent dated GSC export folder from data/reports/gsc/
 * Prefers 24Hour data for latest.json (freshest signal)
 * 3Month data is parsed and saved separately for future Supabase seeding
 *
 * Usage (run from project root):
 *   node admin/import-gsc.js                    — auto-detect latest folder
 *   node admin/import-gsc.js --date 2026-04-18  — use specific date
 *   node admin/import-gsc.js --dry              — preview without writing
 *
 * Output:
 *   dashboard-data/gsc-24-hour.json       — updated with 24Hour data
 *   dashboard-data/gsc-03-month.json   — 3Month data for future Supabase seeding
 *
 * Destination: admin/import-gsc.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DRY     = args.includes('--dry');
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const DATE    = get('--date', null);

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT       = process.cwd();
const GSC_DIR    = path.join(ROOT, 'dashboard-data');
const OUT_DIR    = path.join(ROOT, 'dashboard-data');
const LATEST_OUT = path.join(OUT_DIR, 'gsc-24-hour.json');
const MONTH_OUT  = path.join(OUT_DIR, 'gsc-03-month.json');

// ── Find latest export folders ────────────────────────────────────────────────

function findFolders(date) {
  const entries = fs.readdirSync(GSC_DIR);

  // Filter to dated folders matching YYYY-MM-DD pattern
  const dated = entries
    .filter(e => /^\d{4}-\d{2}-\d{2}/.test(e))
    .filter(e => fs.statSync(path.join(GSC_DIR, e)).isDirectory())
    .sort()
    .reverse(); // most recent first

  if (date) {
    const matching = dated.filter(e => e.startsWith(date));
    if (!matching.length) throw new Error(`No folders found for date: ${date}`);
    return matching;
  }

  // Auto-detect: get most recent date
  if (!dated.length) throw new Error(`No dated folders found in ${GSC_DIR}`);
  const latestDate = dated[0].slice(0, 10);
  return dated.filter(e => e.startsWith(latestDate));
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const values = [];
    let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    return headers.reduce((obj, h, i) => { obj[h] = values[i] || ''; return obj; }, {});
  });
}

// ── Field normalizers ─────────────────────────────────────────────────────────

function normalizeChart(rows) {
  if (!rows.length) return [];
  // Handle both daily (Date) and hourly (Time UTC-xx:xx) column names
  // Hourly data is aggregated by date
  const dateKey = Object.keys(rows[0]).find(k => k.startsWith('Date') || k.startsWith('Time')) || 'Date';
  const byDate = {};
  for (const r of rows) {
    const date = (r[dateKey] || '').slice(0, 10);
    if (!date) continue;
    if (!byDate[date]) byDate[date] = { date, clicks: 0, impressions: 0, position: 0, posCount: 0 };
    byDate[date].clicks      += parseInt(r['Clicks'] || '0', 10);
    byDate[date].impressions += parseInt(r['Impressions'] || '0', 10);
    const pos = parseFloat(r['Position'] || '0');
    if (pos > 0) { byDate[date].position += pos; byDate[date].posCount++; }
  }
  return Object.values(byDate).map(d => ({
    date:        d.date,
    clicks:      d.clicks,
    impressions: d.impressions,
    ctr:         d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) + '%' : '0%',
    position:    d.posCount > 0 ? parseFloat((d.position / d.posCount).toFixed(1)) : null,
  })).filter(r => r.date);
}

function normalizePages(rows) {
  return rows.map(r => ({
    url:         r['Top pages'] || r['Page'] || '',
    clicks:      parseInt(r['Clicks'] || '0', 10),
    impressions: parseInt(r['Impressions'] || '0', 10),
    ctr:         r['CTR'] || '0%',
    position:    parseFloat(r['Position'] || '0'),
  })).filter(r => r.url);
}

function normalizeQueries(rows) {
  return rows.map(r => ({
    query:       r['Top queries'] || r['Query'] || '',
    clicks:      parseInt(r['Clicks'] || '0', 10),
    impressions: parseInt(r['Impressions'] || '0', 10),
    ctr:         r['CTR'] || '0%',
    position:    parseFloat(r['Position'] || '0'),
  })).filter(r => r.query);
}

function normalizeDevices(rows) {
  return rows.map(r => ({
    device:      r['Device'] || '',
    clicks:      parseInt(r['Clicks'] || '0', 10),
    impressions: parseInt(r['Impressions'] || '0', 10),
    ctr:         r['CTR'] || '0%',
    position:    parseFloat(r['Position'] || '0'),
  })).filter(r => r.device);
}

function normalizeCountries(rows) {
  return rows.map(r => ({
    country:     r['Country'] || '',
    clicks:      parseInt(r['Clicks'] || '0', 10),
    impressions: parseInt(r['Impressions'] || '0', 10),
    ctr:         r['CTR'] || '0%',
    position:    parseFloat(r['Position'] || '0'),
  })).filter(r => r.country);
}

// ── Build structured data from folder ────────────────────────────────────────

function buildData(folderPath) {
  const chart     = normalizeChart(parseCSV(path.join(folderPath, 'Chart.csv')) || []);
  const pages     = normalizePages(parseCSV(path.join(folderPath, 'Pages.csv')) || []);
  const queries   = normalizeQueries(parseCSV(path.join(folderPath, 'Queries.csv')) || []);
  const devices   = normalizeDevices(parseCSV(path.join(folderPath, 'Devices.csv')) || []);
  const countries = normalizeCountries(parseCSV(path.join(folderPath, 'Countries.csv')) || []);

  // Compute summary from chart data
  const totalClicks      = chart.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = chart.reduce((s, r) => s + r.impressions, 0);
  const avgCTR           = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%'
    : '0%';
  const posRows    = chart.filter(r => r.position);
  const avgPosition = posRows.length
    ? parseFloat((posRows.reduce((s,r) => s + r.position, 0) / posRows.length).toFixed(1))
    : 0;

  return { chart, pages, queries, devices, countries,
    summary: { totalClicks, totalImpressions, avgCTR, avgPosition,
      pagesIndexed: 191, countriesReached: countries.length } };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log(`\nadmin/import-gsc.js`);
  console.log(`Dry run: ${DRY ? 'yes' : 'no'}`);
  console.log(`${'─'.repeat(52)}`);

  // Find folders
  let folders;
  try { folders = findFolders(DATE); }
  catch(e) { console.error(`  ✗  ${e.message}`); process.exit(1); }

  const datePrefix  = folders[0].slice(0, 10);
  const hourFolder  = folders.find(f => f.includes('24Hour') || f.includes('24hour'));
  const monthFolder = folders.find(f => f.includes('03Month') || f.includes('3Month') || f.includes('3month'));

  console.log(`  Date:     ${datePrefix}`);
  console.log(`  24Hour:   ${hourFolder || 'not found'}`);
  console.log(`  3Month:   ${monthFolder || 'not found'}`);
  console.log('');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  
  

  // ── 24Hour → latest.json ──────────────────────────────────────────────────
  if (hourFolder) {
    const folderPath = path.join(GSC_DIR, hourFolder);
    const data       = buildData(folderPath);
    const startDate  = data.chart[0]?.date || datePrefix;
    const endDate    = data.chart[data.chart.length-1]?.date || datePrefix;

    const output = {
      metadata: {
        lastUpdated:     datePrefix,
        lastUpdateTime:  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        source:          'Google Search Console Export — 24 Hour',
        dateRangeDays:   data.chart.length,
        startDate, endDate,
      },
      data,
    };

    if (DRY) {
      console.log('[DRY] latest.json summary:');
      console.log(`  Clicks: ${data.summary.totalClicks}, Impressions: ${data.summary.totalImpressions}`);
      console.log(`  CTR: ${data.summary.avgCTR}, Position: ${data.summary.avgPosition}`);
      console.log(`  Chart rows: ${data.chart.length}, Pages: ${data.pages.length}, Queries: ${data.queries.length}`);
    } else {
      fs.writeFileSync(LATEST_OUT, JSON.stringify(output, null, 2), 'utf8');
      console.log(`  ✓  dashboard-data/gsc-24-hour.json`);
      console.log(`     Clicks: ${data.summary.totalClicks} · Impressions: ${data.summary.totalImpressions} · CTR: ${data.summary.avgCTR} · Position: ${data.summary.avgPosition}`);
      console.log(`     Chart: ${data.chart.length} rows · Pages: ${data.pages.length} · Queries: ${data.queries.length}`);
    }
  } else {
    console.log('  ⚠  No 24Hour folder found — latest.json not updated');
  }

  // ── 3Month → gsc-3month.json ──────────────────────────────────────────────
  if (monthFolder) {
    const folderPath = path.join(GSC_DIR, monthFolder);
    const data       = buildData(folderPath);
    const startDate  = data.chart[0]?.date || datePrefix;
    const endDate    = data.chart[data.chart.length-1]?.date || datePrefix;

    const output = {
      metadata: {
        lastUpdated:    datePrefix,
        source:         'Google Search Console Export — 3 Month',
        dateRangeDays:  data.chart.length,
        startDate, endDate,
      },
      data,
    };

    if (DRY) {
      console.log('\n[DRY] gsc-3month.json summary:');
      console.log(`  Chart rows: ${data.chart.length}, Pages: ${data.pages.length}`);
      console.log(`  Date range: ${startDate} – ${endDate}`);
    } else {
      fs.writeFileSync(MONTH_OUT, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n  ✓  dashboard-data/gsc-03-month.json`);
      console.log(`     Date range: ${startDate} – ${endDate} · ${data.chart.length} days`);
      console.log(`     Pages: ${data.pages.length} · Queries: ${data.queries.length}`);
    }
  } else {
    console.log('\n  ⚠  No 3Month folder found — gsc-3month.json not updated');
  }

  console.log(`\nNext: refresh dashboard at localhost:3000/dashboard\n`);
}

run();
