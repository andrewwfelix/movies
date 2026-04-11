const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function refreshAllDates() {
  const today = new Date().toISOString().split('T')[0];
  
  // Folders to scan
  const targets = ['./', './reviews']; 

  for (const dir of targets) {
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const html = await fs.readFile(filePath, 'utf8');
      const $ = cheerio.load(html);

      // Set the date
      if ($('meta[name="last-updated"]').length) {
        $('meta[name="last-updated"]').attr('content', today);
      } else {
        $('head').append(`<meta name="last-updated" content="${today}">`);
      }

      await fs.writeFile(filePath, $.html());
    }
  }
  console.log(`🚀 All pages updated to ${today} for Google crawling.`);
}
refreshAllDates();