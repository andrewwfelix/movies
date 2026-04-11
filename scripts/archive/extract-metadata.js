/**
 * HTML Metadata Extractor & CSV Exporter
 *
 * * DESCRIPTION:
 *  	This script iterates through a directory of HTML files, extracts SEO metadata,
 * 	JSON-LD schema (Review and FAQPage), and custom "Books vs Movies" site elements,
 * 	then exports the results into a UTF-8 BOM encoded CSV for Excel compatibility.
 *
 * * EXPECTED HTML STRUCTURES:
 * 	- JSON-LD: <script type="application/ld+json"> for 'Review' and 'FAQPage' types.
 * 	- Meta Strip: Elements with class '.meta-strip .meta-item' containing <strong> labels.
 * 	- Verdicts: Elements with class '.verdict-badge' and '.verdict-box'.
 *
 * * USAGE:
 * 	node extract-metadata.js <path-to-html-directory>
 *
 * * DEPENDENCIES:
 * 	npm install cheerio
 */


#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function extractMetadata(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const lastUpdated = $('meta[name="last-updated"]').attr('content') || '';

  let jsonLdReview = null;
  let jsonLdFaq = null;
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type'] === 'Review') jsonLdReview = data;
      else if (data['@type'] === 'FAQPage') jsonLdFaq = data;
    } catch (e) {}
  });

  let reviewRating = '', bestRating = '', worstRating = '';
  let itemReviewedName = '', itemReviewedAuthor = '', itemReviewedDatePublished = '';
  if (jsonLdReview) {
    reviewRating = jsonLdReview.reviewRating?.ratingValue || '';
    bestRating = jsonLdReview.reviewRating?.bestRating || '';
    worstRating = jsonLdReview.reviewRating?.worstRating || '';
    itemReviewedName = jsonLdReview.itemReviewed?.name || '';
    itemReviewedAuthor = jsonLdReview.itemReviewed?.author?.name || '';
    itemReviewedDatePublished = jsonLdReview.itemReviewed?.datePublished || '';
  }

  const metaItems = {};
  $('.meta-strip .meta-item').each((i, el) => {
    const strong = $(el).find('strong');
    if (strong.length) {
      const label = strong.text().replace(/\s*:\s*$/, '').trim();
      const value = strong.parent().contents().last().text().trim();
      metaItems[label] = value;
    }
  });
  const verdictBadge = $('.verdict-badge').text().trim() || '';

  let verdictText = '';
  const verdictBox = $('.verdict-box');
  if (verdictBox.length) {
    const clone = verdictBox.clone();
    clone.find('.verdict-title').remove();
    verdictText = clone.text().trim().replace(/\s+/g, ' ');
  }

  let firstFaqQuestion = '', firstFaqAnswer = '';
  if (jsonLdFaq && jsonLdFaq.mainEntity && jsonLdFaq.mainEntity.length) {
    firstFaqQuestion = jsonLdFaq.mainEntity[0].name || '';
    firstFaqAnswer = jsonLdFaq.mainEntity[0].acceptedAnswer?.text || '';
  }

  return {
    filename: path.basename(filePath),
    title,
    description,
    lastUpdated,
    reviewRating,
    bestRating,
    worstRating,
    itemReviewedName,
    itemReviewedAuthor,
    itemReviewedDatePublished,
    authorMeta: metaItems['Author'] || '',
    bookPublished: metaItems['Book Published'] || '',
    filmReleased: metaItems['Film Released'] || '',
    director: metaItems['Director'] || '',
    verdictBadge,
    verdictText,
    firstFaqQuestion,
    firstFaqAnswer,
  };
}

async function main(dirPath) {
  const files = await fs.readdir(dirPath);
  const htmlFiles = files.filter(f => f.endsWith('.html') || f.endsWith('.htm'));

  if (htmlFiles.length === 0) {
    console.error('No HTML files found in', dirPath);
    process.exit(1);
  }

  const allMetadata = [];
  for (const file of htmlFiles) {
    const fullPath = path.join(dirPath, file);
    try {
      const meta = await extractMetadata(fullPath);
      allMetadata.push(meta);
      console.log(`✓ Processed ${file}`);
    } catch (err) {
      console.error(`✗ Failed to process ${file}:`, err.message);
    }
  }

  if (allMetadata.length === 0) {
    console.error('No metadata extracted.');
    process.exit(1);
  }

  // Write CSV to current working directory
  const outputFile = path.join(process.cwd(), 'extracted_metadata.csv');
  
  const columns = Object.keys(allMetadata[0]);
  const csvRows = [columns.join(',')];
  for (const row of allMetadata) {
    const escapedRow = columns.map(col => {
      let val = row[col] || '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = val.replace(/"/g, '""');
        val = `"${val}"`;
      }
      return val;
    }).join(',');
    csvRows.push(escapedRow);
  }

  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF';
  await fs.writeFile(outputFile, bom + csvRows.join('\n'), 'utf8');
  console.log(`\n✅ CSV written to ${outputFile}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node extract-metadata <directory-with-html-files>');
    process.exit(1);
  }
  const inputDir = path.resolve(args[0]);
  main(inputDir).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { extractMetadata };