const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONFIG_PATH = path.join(process.cwd(), 'config/gsc-analysis.json');

async function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

async function fetchGscData(siteUrl, config) {
  console.log(`📡 Fetching GSC data for ${siteUrl}...`);

  const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  const privateKey = creds.private_key.replace(/\\n/g, '\n');

  const auth = new (require('googleapis').google.auth.JWT)({
    email: creds.client_email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const tokens = await auth.authorize();
  const accessToken = tokens.access_token;

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - config.daysBack * 86400000)
    .toISOString().split('T')[0];

  const requestBody = JSON.stringify({
    startDate,
    endDate,
    dimensions: config.dimensions,
    rowLimit: config.rowLimit,
    startRow: 0
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      path: `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`GSC HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
        }
        const json = JSON.parse(data);
        if (json.error) {
          return reject(new Error(`GSC API Error: ${JSON.stringify(json.error)}`));
        }
        resolve(json.rows || []);
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

async function getLlmInsights(rawData, config) {
  const apiKey = process.env[config.llm.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing ${config.llm.apiKeyEnv} in .env file`);
  }

  console.log(`🧠 Generating insights with ${config.llm.model} via OpenRouter...`);

  const prompt = `You are an expert SEO analyst for booksversusmovies.com.

Analyze the following Google Search Console data from the last ${config.daysBack} days.

Raw data (top rows):
${JSON.stringify(rawData.slice(0, 100), null, 2)}

Return ONLY valid JSON with this exact structure (no extra text):
{
  "summary": "One paragraph overview of the performance",
  "keyMetrics": {
    "totalImpressions": number,
    "totalClicks": number,
    "avgCTR": number,
    "avgPosition": number
  },
  "topQueries": [
    { "query": string, "impressions": number, "clicks": number, "ctr": number, "position": number }
  ],
  "topPages": [
    { "page": string, "impressions": number, "clicks": number, "ctr": number, "position": number }
  ],
  "opportunities": [string],
  "risks": [string],
  "recommendations": [string]
}`;

  const body = JSON.stringify({
    model: config.llm.model,
    temperature: config.llm.temperature,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://booksversusmovies.com',   // Optional but recommended
        'X-Title': 'GSC Morning Analysis',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`OpenRouter HTTP ${res.statusCode}: ${data}`));
        }
        const json = JSON.parse(data);
        if (json.error) {
          return reject(new Error(`OpenRouter Error: ${json.error.message}`));
        }
        try {
          resolve(JSON.parse(json.choices[0].message.content));
        } catch (e) {
          reject(new Error("Failed to parse LLM JSON response"));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runMorningAnalysis() {
  console.log('🌅 Starting Morning GSC Analysis...\n');

  const config = await loadConfig();

  // Fetch GSC data
  let allRows = [];
  for (const site of config.sites) {
    const rows = await fetchGscData(site, config);
    allRows = allRows.concat(rows);
    console.log(`   → Got ${rows.length} rows from ${site}`);
  }

  if (allRows.length === 0) {
    console.log("⚠️ No data found in GSC for the selected period.");
    return;
  }

  // Get insights from LLM (OpenRouter)
  const insights = await getLlmInsights(allRows, config);

  // Build final report
  const report = {
    generatedAt: new Date().toISOString(),
    site: config.sites[0],
    config: {
      daysBack: config.daysBack,
      model: config.llm.model,
      dimensions: config.dimensions,
      provider: "openrouter"
    },
    rawDataCount: allRows.length,
    rawData: allRows,
    insights
  };

  // Save JSON report
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${config.output.prefix}-${dateStr}.json`;
  const dir = path.join(process.cwd(), config.output.dir);

  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Morning analysis complete!`);
  console.log(`   Report saved: ${filePath}`);
  console.log(`   Generated with: ${config.llm.model} (via OpenRouter)`);
}

runMorningAnalysis().catch(err => {
  console.error('\n💥 Error during analysis:');
  console.error(err.message);
});