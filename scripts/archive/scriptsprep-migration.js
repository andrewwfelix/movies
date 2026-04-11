const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function migrate() {
    const reviewsDir = './reviews';
    const csvPath = './data/extracted_metadata.csv';
    
    // 1. Ensure directories exist
    await fs.mkdir(reviewsDir, { recursive: true });
    await fs.mkdir('./data', { recursive: true });

    // 2. Identify review files in root (based on your CSV)
    // We use the CSV as a guide to know what is a "review" vs a "system" file
    const csvData = await fs.readFile(csvPath, 'utf8');
    const filenames = csvData.split('\n').slice(1)
        .map(line => line.split(',')[0].replace(/"/g, ''))
        .filter(name => name.endsWith('.html'));

    console.log(`🚀 Starting migration of ${filenames.length} files...`);

    for (const filename of filenames) {
        const oldPath = path.join('./', filename);
        const newPath = path.join(reviewsDir, filename);

        try {
            // Check if file exists in root before moving
            await fs.access(oldPath);
            
            let html = await fs.readFile(oldPath, 'utf8');
            const $ = cheerio.load(html);

            // FIX PATHS: Update CSS, JS, and Images to go up one level (../)
            $('link[rel="stylesheet"], script[src], img').each((i, el) => {
                const attr = $(el).attr('href') ? 'href' : 'src';
                const val = $(el).attr(attr);
                if (val && !val.startsWith('http') && !val.startsWith('..')) {
                    $(el).attr(attr, '../' + val);
                }
            });

            // FIX NAV: Update links to Home/Browse to go up one level
            $('nav a, .site-logo').each((i, el) => {
                const href = $(el).attr('href');
                if (href && (href === 'index.html' || href === 'browse.html' || href === '/')) {
                    $(el).attr('href', '../' + (href === '/' ? 'index.html' : href));
                }
            });

            // Write to new location and delete old file
            await fs.writeFile(newPath, $.html());
            await fs.unlink(oldPath); 
            console.log(`✅ Migrated & Updated: ${filename}`);

        } catch (err) {
            console.log(`⏩ Skipped ${filename} (Already moved or missing)`);
        }
    }
    console.log('\n✨ Migration complete. Root directory is clean!');
}

migrate().catch(console.error);