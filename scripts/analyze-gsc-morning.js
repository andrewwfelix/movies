const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONFIG_PATH = path.join(process.cwd(), 'config/gsc-analysis.json');
const PROMPT_PATH = path.join(process.cwd(), 'scripts/prompts/gsc-prompt.txt');

async function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Config not found: ${CONFIG_PATH}`);
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

async function loadPrompt() {
  if (!fs.existsSync(PROMPT_PATH)) throw new Error(`Prompt not found: ${PROMPT_PATH}`);
  return fs.readFileSync(PROMPT_PATH, 'utf8');
}

async function fetchGscData(siteUrl, daysBack) {
  console.log(`📡 Fetching GSC data for ${daysBack} days...`);

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
  const startDate = new Date(Date.now() - daysBack * 86400000)
    .toISOString().split('T')[0];

  const requestBody = JSON.stringify({
    startDate,
    endDate,
    dimensions: ["query", "page"],
    rowLimit: 150,
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
        if (res.statusCode !== 200) return reject(new Error(`GSC HTTP ${res.statusCode}`));
        const json = JSON.parse(data);
        if (json.error) return reject(new Error(`GSC Error: ${JSON.stringify(json.error)}`));
        resolve(json.rows || []);
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

async function getLlmInsights(allData, config) {
  const apiKey = process.env[config.llm.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing ${config.llm.apiKeyEnv} in .env`);

  console.log(`🧠 Sending data to ${config.llm.model} for analysis...`);

  let promptTemplate = await loadPrompt();

  // Insert both datasets into the prompt
  const dataString = allData.map(d => 
    `${d.name} (${d.daysBack} days):\n${JSON.stringify(d.rows.slice(0, 100), null, 2)}`
  ).join('\n\n---\n\n');

  promptTemplate = promptTemplate
    .replace('{{periodsData}}', dataString);

  const body = JSON.stringify({
    model: config.llm.model,
    temperature: config.llm.temperature,
    messages: [{ role: "user", content: promptTemplate }],
    response_format: { type: "json_object" }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://booksversusmovies.com',
        'X-Title': 'GSC Morning Analysis',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`OpenRouter HTTP ${res.statusCode}`));
        const json = JSON.parse(data);
        if (json.error) return reject(new Error(`OpenRouter Error: ${json.error.message}`));
        resolve(JSON.parse(json.choices[0].message.content));
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runMorningAnalysis() {
  console.log('🌅 Starting Morning GSC Analysis (3 months + 24 hours)...\n');

  const config = await loadConfig();
  const allData = [];

  for (const period of config.periods) {
    const rows = await fetchGscData(config.sites[0], period.daysBack);
    allData.push({
      name: period.name,
      daysBack: period.daysBack,
      rows
    });
    console.log(`   → ${period.name} (${period.daysBack} days): ${rows.length} rows`);
  }

  if (allData.every(d => d.rows.length === 0)) {
    console.log("⚠️ No data found in GSC.");
    return;
  }

  const insights = await getLlmInsights(allData, config);

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    site: config.sites[0],
    config: {
      periods: config.periods,
      model: config.llm.model,
      provider: "openrouter"
    },
    rawDataCount: allData.reduce((sum, d) => sum + d.rows.length, 0),
    insights
  };

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${config.output.prefix}-${dateStr}.json`;
  const dir = path.join(process.cwd(), config.output.dir);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Analysis complete! Report saved: ${filePath}`);

  // Quick terminal summary
  console.log(`\n📊 QUICK SUMMARY:`);
  console.log(`   ${insights.summary || 'No summary provided.'}`);

  console.log(`\n💡 Top Recommendations:`);
  if (insights.recommendations && insights.recommendations.length > 0) {
    insights.recommendations.forEach((rec, i) => {
      const action = typeof rec === 'string' ? rec : (rec.action || JSON.stringify(rec));
      const priority = rec.priority || 'Medium';
      console.log(`   ${i + 1}. ${action} (${priority})`);
    });
  }
}

runMorningAnalysis().catch(err => {
  console.error('\n💥 Error:');
  console.error(err.message);
});