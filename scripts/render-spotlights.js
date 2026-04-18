#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REVIEWS_DIR = path.join(ROOT, 'data', 'reviews');
const SPOTLIGHT_DIR = ROOT; // your HTML root

const graph = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'related-graph.json'), 'utf8')
);

const reviews = {};
for (const file of fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf8'));
  reviews[data.slug] = data;
}

function titleFromSlug(slug) {
  return reviews[slug]?.bookTitle || slug;
}

function buildCard(slug) {
  const title = titleFromSlug(slug);

  return `
      <a class="related-card" href="/${slug}">
        <div class="related-cover">
          <img src="images/${slug}.jpg" alt="${title} book cover" loading="lazy"
               onerror="this.parentElement.style.display='none'">
        </div>
        <span class="related-title">${title}</span>
      </a>`;
}

function renderSpotlight(html, slug) {
  const related = graph[slug] || [];

  const block = `
      <div class="related-grid">
        ${related.map(buildCard).join('\n')}
      </div>`;

  return html.replace(
    /<div class="related-grid">[\s\S]*?<\/div>/,
    block
  );
}

function main() {
  const files = fs.readdirSync(SPOTLIGHT_DIR)
    .filter(f => f.startsWith('spotlight-') && f.endsWith('.html'));

  console.log(`Spotlights: ${files.length}`);

  for (const file of files) {
    const slug = file
      .replace('spotlight-', '')
      .replace('.html', '');

    const filePath = path.join(SPOTLIGHT_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');

    const updated = renderSpotlight(html, slug);

    fs.writeFileSync(filePath, updated);

    console.log(`✔ ${slug}`);
  }

  console.log(`Done.`);
}

main();