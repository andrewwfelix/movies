#!/usr/bin/env node
/**
 * BooksVersusMovies.com — Sitemap Generator
 * Scans root directory for all HTML files and regenerates sitemap.xml.
 * Excludes non-comparison pages.
 *
 * Usage:
 *   node script_update_sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://booksversusmovies.com';
const TODAY = new Date().toISOString().split('T')[0];

// Files to exclude from sitemap
const EXCLUDE = new Set(['404.html']);

function main() {
  const root = process.cwd();

  const htmlFiles = fs.readdirSync(root)
    .filter(f => f.endsWith('.html') && !EXCLUDE.has(f))
    .sort();

  const urls = htmlFiles.map(file => {
    const loc = file === 'index.html'
      ? `${BASE_URL}/`
      : `${BASE_URL}/${file}`;
    const priority = file === 'index.html' ? '1.0' : '0.8';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${priority}</priority>
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`✅ sitemap.xml updated with ${htmlFiles.length} pages.`);
  console.log(`   Last modified: ${TODAY}`);
  htmlFiles.forEach(f => console.log(`   • ${f}`));
}

main();
