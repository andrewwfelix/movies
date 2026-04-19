const { google } = require('googleapis');
const https = require('https');
require('dotenv').config();

async function runGscTest() {
  console.log("🔍 GSC Raw Test - Starting...");

  const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  const privateKey = creds.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const tokens = await auth.authorize();
  console.log("✅ Token OK");

  const options = {
    hostname: 'www.googleapis.com',
    path: '/webmasters/v3/sites',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  };

  https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      const json = JSON.parse(data);
      
      if (json.error) {
        console.error("API Error:", json.error);
      } else if (json.siteEntry && json.siteEntry.length > 0) {
        console.log(`🎉 Found ${json.siteEntry.length} sites:`);
        json.siteEntry.forEach(s => console.log(`   - ${s.siteUrl} (${s.permissionLevel})`));
      } else {
        console.log("⚠️ No sites found. Make sure the service account was added as Owner in GSC.");
        console.log(`   Service account: ${creds.client_email}`);
      }
    });
  }).on('error', e => console.error("Request error:", e.message)).end();
}

runGscTest();