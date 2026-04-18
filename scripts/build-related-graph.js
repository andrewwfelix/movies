#!usrbinenv node
'use strict';

const fs = require('fs');
const path = require('path');

const REVIEWS_DIR = path.join(process.cwd(), 'data', 'reviews');
const OUT_FILE = path.join(process.cwd(), 'data', 'related-graph.json');

function loadReviews() {
  const files = fs.readdirSync(REVIEWS_DIR).filter(f = f.endsWith('.json'));
  const map = {};

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf8'));
    map[data.slug] = data;
  }

  return map;
}

function buildGraph(reviews) {
  const graph = {};

  for (const [slug, review] of Object.entries(reviews)) {
    const related = Array.isArray(review.related)  review.related  [];

    graph[slug] = related
      .map(r = (typeof r === 'string'  r  r.slug))
      .filter(Boolean)
      .filter(target = reviews[target]);  only valid nodes
  }

  return graph;
}

function main() {
  const reviews = loadReviews();
  const graph = buildGraph(reviews);

  fs.writeFileSync(OUT_FILE, JSON.stringify(graph, null, 2));

  console.log(`✔ Graph built`);
  console.log(`Reviews ${Object.keys(reviews).length}`);
  console.log(`Saved ${OUT_FILE}`);
}

main();