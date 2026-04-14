#!/usr/bin/env node

/**
 * sitemap-generate.js
 * BooksVersusMovies.com — sitemap.xml generator
 *
 * Reads all JSON files in pipeline/2-revised/ and generates a sitemap.xml
 * in the project root. Run after pipeline-render.js and before deployment.
 *
 * Usage:
 *   node sitemap-generate.js
 *   node sitemap-generate.js --out ../sitemap.xml
 *   node sitemap-generate.js --priority 0.9
 *
 * Options:
 *   --out       Output path (default: project root sitemap.xml)
 *   --priority  Default page priority 0.0-1.0 (default: 0.8)
 *   --dry       Print sitemap without writing
 * Destination: scripts/ops/sitemap-generate.js
 */

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2);
const get     = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag = flag => args.includes(flag);

const SRC_DIR    = path.resolve(__dirname, '../pipeline/2-revised');
const OUT_PATH   = path.resolve(__dirname, get('--out', '../sitemap.xml'));
const PRIORITY   = parseFloat(get('--priority', '0.8'));
const DRY_RUN    = hasFlag('--dry');
const SITE_URL   = 'https://booksversusmovies.com';
const TODAY      = new Date().toISOString().split('T')[0];

// Pages that are not reviews — add manually
const STATIC_PAGES = [
  { loc: '/',       priority: '1.0', changefreq: 'weekly'  },
  { loc: '/about',  priority: '0.5', changefreq: 'monthly' },
];

function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`✗ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('✗ No JSON files found in pipeline/2-revised/');
    process.exit(1);
  }

  // Build URL entries
  const reviewUrls = files.map(file => {
    const slug = file.replace('.json', '');
    let lastmod = TODAY;

    // Use lastUpdated from JSON if available
    try {
      const r = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
      if (r.lastUpdated) lastmod = r.lastUpdated;
    } catch { /* use today */ }

    return {
      loc:        `${SITE_URL}/${slug}`,
      lastmod,
      changefreq: 'monthly',
      priority:   PRIORITY.toFixed(1),
    };
  });

  // Combine static + review pages
  const allUrls = [
    ...STATIC_PAGES.map(p => ({
      loc:        `${SITE_URL}${p.loc}`,
      lastmod:    TODAY,
      changefreq: p.changefreq,
      priority:   p.priority,
    })),
    ...reviewUrls,
  ];

  // Generate XML
  const urlEntries = allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  if (DRY_RUN) {
    console.log(xml);
    console.log(`\n[DRY] Would write to: ${OUT_PATH}`);
    console.log(`[DRY] Total URLs: ${allUrls.length}`);
    return;
  }

  fs.writeFileSync(OUT_PATH, xml, 'utf8');

  console.log(`✓ sitemap.xml written to: ${OUT_PATH}`);
  console.log(`  Total URLs:   ${allUrls.length}`);
  console.log(`  Review pages: ${reviewUrls.length}`);
  console.log(`  Static pages: ${STATIC_PAGES.length}`);
  console.log(`  Last updated: ${TODAY}`);
  console.log(`\nNext: submit sitemap to Google Search Console`);
  console.log(`  https://search.google.com/search-console/sitemaps`);
}

run();
