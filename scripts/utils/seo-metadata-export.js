#!/usr/bin/env node

/**
 * scripts/utils/export-seo-metadata.js
 * Exports current page titles, meta descriptions, and oneLineReason for LLM review.
 *
 * Usage: node scripts/utils/export-seo-metadata.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');           // Goes up to project root
const REPORTS_DIR = path.join(ROOT, 'data', 'reports');
const OUTPUT_CSV = path.join(REPORTS_DIR, 'seo-metadata-for-review.csv');

const SKIP_FILES = new Set([
  'index.html', 'featured.html', 'upcoming-adaptations.html', 'auteurs.html',
  'welcome.html', 'about.html', 'robots.txt', 'sitemap.xml'
]);

function extractField(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

async function run() {
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`Created directory: ${REPORTS_DIR}`);
  }

  console.log('Exporting SEO metadata for LLM review...\n');

  const files = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !SKIP_FILES.has(f))
    .sort();

  let rows = [];
  rows.push('filename,slug,pageTitle,metaDesc,oneLineReason,verdict,lastUpdated');

  for (const file of files) {
    const filePath = path.join(ROOT, file);
    const html = fs.readFileSync(filePath, 'utf8');

    const slug = file.replace('.html', '');
    const pageTitle = extractField(html, /<title>(.*?)<\/title>/i);
    const metaDesc = extractField(html, /<meta name="description" content="(.*?)"/i);
    const lastUpdated = extractField(html, /<meta name="last-updated" content="(.*?)"/i) || '';

    const verdictMatch = html.match(/verdict-badge[^>]*>(Book Wins|Film Wins|Too Close to Call)/i);
    const verdict = verdictMatch ? verdictMatch[1] : '';

    const oneLineMatch = html.match(/quick-answer-reason-top[^>]*>.*?<p>(.*?)<\/p>/is);
    let oneLineReason = oneLineMatch ? oneLineMatch[1].replace(/<strong>.*?<\/strong>/gi, '').trim() : '';

    // Escape quotes for CSV
    rows.push(`"${file}","${slug}","${pageTitle.replace(/"/g, '""')}","${metaDesc.replace(/"/g, '""')}","${oneLineReason.replace(/"/g, '""')}","${verdict}","${lastUpdated}"`);

    console.log(`✓ Exported: ${file}`);
  }

  fs.writeFileSync(OUTPUT_CSV, rows.join('\n'), 'utf8');

  console.log(`\n✅ Export complete!`);
  console.log(`   Total pages exported: ${files.length}`);
  console.log(`   File saved to: data/reports/seo-metadata-for-review.csv`);
  console.log(`\nNext: Upload this CSV + scripts/prompts/review-titles.txt to Claude Sonnet`);
}

run().catch(err => {
  console.error('Error:', err.message);
});