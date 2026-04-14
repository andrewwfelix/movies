#!/usr/bin/env node

/**
 * dashboard.js
 * Revision: 2.1.0 (2026-04-14)
 * * Function: Fetches SEO and Traffic data from Google APIs and performs a 
 * "Data Dump" to the local project structure for dashboard consumption.
 * * Structure:
 * - Config:  .config/dashboard.json
 * - Output:  movies/data/dashboard/latest.json
 * - Archive: movies/data/dashboard/history-YYYY-MM-DD.json
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// ── PATH CONFIGURATION ────────────────────────────────────────────────────────

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, '.config', 'dashboard.json');
const DATA_DIR = path.join(ROOT, 'movies', 'data', 'dashboard');

// ── UTILITIES ────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`✗ Configuration missing: ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function getAuthClient(config) {
  const { client_id, client_secret, refresh_token } = config.credentials;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
  oauth2Client.setCredentials({ refresh_token });
  return oauth2Client;
}

/**
 * Ensures the data directory exists and writes the snapshot.
 * Saves both a 'latest.json' for the UI and a dated file for history.
 */
function persistData(payload) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const timeString = new Date().toLocaleTimeString();

  const latestPath = path.join(DATA_DIR, 'latest.json');
  const historyPath = path.join(DATA_DIR, `history-${timestamp}.json`);

  const output = {
    metadata: {
      lastUpdated: timestamp,
      lastUpdateTime: timeString,
      source: "Google API Snapshot"
    },
    data: payload
  };

  const jsonString = JSON.stringify(output, null, 2);

  fs.writeFileSync(latestPath, jsonString, 'utf8');
  fs.writeFileSync(historyPath, jsonString, 'utf8');

  console.log(`\n✓ Data Persisted:`);
  console.log(`  - Latest:  ${path.relative(ROOT, latestPath)}`);
  console.log(`  - History: ${path.relative(ROOT, historyPath)}`);
}

// ── API DATA FETCHERS ────────────────────────────────────────────────────────

async function fetchGSC(auth, siteUrl, days) {
  const sc = google.searchconsole({ version: 'v1', auth });
  const today = new Date();
  const startDate = new Date(today.setDate(today.getDate() - days)).toISOString().split('T')[0];
  
  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate: new Date().toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 10
    }
  });
  return res.data.rows || [];
}

async function fetchGA4(auth, propertyId, days) {
  const analytics = google.analyticsdata({ version: 'v1beta', auth });
  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10
    }
  });
  return res.data.rows || [];
}

// ── MAIN EXECUTION ───────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀 Starting Dashboard Refresh [${new Date().toLocaleString()}]`);
  
  const config = loadConfig();
  const auth = getAuthClient(config);
  const days = config.settings?.date_range_days || 30;
  
  const dashboardPayload = [];

  for (const site of config.sites) {
    process.stdout.write(`  ↻ Fetching data for ${site.name}... `);
    
    try {
      const [gsc, ga4] = await Promise.all([
        fetchGSC(auth, site.gsc_url, days),
        fetchGA4(auth, site.ga4_property_id, days)
      ]);

      dashboardPayload.push({
        siteName: site.name,
        searchPerformance: gsc,
        userTraffic: ga4
      });

      process.stdout.write(`✓\n`);
    } catch (err) {
      process.stdout.write(`✗\n`);
      console.error(`    Error: ${err.message}`);
    }
  }

  persistData(dashboardPayload);
  console.log(`\n🏁 Refresh Complete.\n`);
}

run().catch(err => {
  console.error('Fatal Script Error:', err);
  process.exit(1);
});