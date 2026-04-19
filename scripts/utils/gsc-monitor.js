const { google } = require('googleapis');
const https = require('https');
require('dotenv').config();

const SITE_URL = 'sc-domain:booksversusmovies.com';   // ← Your domain property
const DAYS_BACK = 28;                                 // Change this if you want more/less days

async function getGscData() {
  console.log("🔍 Google Search Console Monitor");
  console.log(`   Site: ${SITE_URL}`);
  console.log(`   Period: Last ${DAYS_BACK} days\n`);

  try {
    // 1. Setup Auth
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    const privateKey = creds.private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    const tokens = await auth.authorize();
    const accessToken = tokens.access_token;

    // 2. Prepare dates
    const endDate = new Date().toISOString().split('T')[0]; // today
    const startDate = new Date(Date.now() - DAYS_BACK * 86400000)
      .toISOString().split('T')[0];

    console.log(`📅 Date range: ${startDate} → ${endDate}`);

    // 3. Build request body for searchAnalytics.query
    const requestBody = {
      startDate,
      endDate,
      dimensions: ['query', 'page'],     // you can change this
      rowLimit: 50,                      // max 50 rows per request (API limit is 50k total)
      startRow: 0
    };

    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: 'www.googleapis.com',
      path: `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        console.log(`\n📥 Status: ${res.statusCode}`);

        if (res.statusCode !== 200) {
          console.error("❌ Error response:");
          try { console.error(JSON.parse(data)); } catch(e) { console.error(data); }
          return;
        }

        try {
          const json = JSON.parse(data);

          if (json.error) {
            console.error("❌ API Error:", json.error);
            return;
          }

          if (!json.rows || json.rows.length === 0) {
            console.log("⚠️ No data returned for this period.");
            return;
          }

          console.log(`🎉 Success! Retrieved ${json.rows.length} rows\n`);

          // Simple summary table
          console.log("Top Queries & Pages by Impressions:");
          console.log("─".repeat(90));
          console.log("Impressions | Clicks | CTR     | Avg Position | Query / Page");
          console.log("─".repeat(90));

          json.rows.forEach(row => {
            const impressions = row.impressions || 0;
            const clicks = row.clicks || 0;
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
            const position = row.position ? row.position.toFixed(1) : '—';

            const query = row.keys[0] || '(no query)';
            const page = row.keys[1] || '(no page)';

            console.log(
              `${impressions.toString().padStart(11)} | ` +
              `${clicks.toString().padStart(6)} | ` +
              `${ctr.toString().padStart(7)}% | ` +
              `${position.toString().padStart(12)} | ` +
              `${query}`
            );
          });

        } catch (e) {
          console.error("❌ Failed to parse JSON:", e.message);
        }
      });
    });

    req.on('error', e => console.error("Request error:", e.message));
    req.write(postData);
    req.end();

  } catch (err) {
    console.error("💥 Critical error:", err.message);
  }
}

getGscData();