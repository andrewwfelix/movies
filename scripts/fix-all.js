const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function runMasterSync() {
    const reviewsDir = './reviews';
    const csvPath = './data/extracted_metadata.csv';
    const logPath = './logs/site-sync.log';
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString();
    
    let stats = {
        before: { index: 0, browse: 0, sitemap: 0 },
        foundInFolder: 0,
        addedThisRun: { index: 0, browse: 0, sitemap: 0 },
        after: { index: 0, browse: 0, sitemap: 0 }
    };

    try {
        // --- PHASE 0: PRE-RUN AUDIT ---
        const bIndex = await fs.readFile('index.html', 'utf8');
        stats.before.index = cheerio.load(bIndex)('.book-card').length;
        
        const bBrowse = await fs.readFile('browse.html', 'utf8');
        stats.before.browse = cheerio.load(bBrowse)('.row').length;
        
        const bSitemap = await fs.readFile('sitemap.xml', 'utf8');
        stats.before.sitemap = (bSitemap.match(/<url>/g) || []).length;

        // --- PHASE 1: EXTRACTION ---
        const files = (await fs.readdir(reviewsDir)).filter(f => f.endsWith('.html'));
        const inMemoryData = [];

        for (const file of files) {
            const html = await fs.readFile(path.join(reviewsDir, file), 'utf8');
            const $ = cheerio.load(html);
            inMemoryData.push({
                filename: file,
                itemReviewedName: $('.row-title').first().text().trim() || $('title').text().split('—')[0].trim(),
                itemReviewedAuthor: $('.row-byline').first().text().split('—')[0].trim() || '',
                verdictBadge: $('.verdict-badge').first().text().trim(),
                filmReleased: $('.row-dates').text().replace('Film:', '').trim()
            });
            stats.foundInFolder++;
        }

        // --- PHASE 2: THE DEEP CLEAN & OVERWRITE ---
        
        // 1. Update Index (Latest 6)
        const $index = cheerio.load(await fs.readFile('index.html', 'utf8'));
        const latest = [...inMemoryData].reverse().slice(0, 6);
        const indexContainer = $index('#latest-reviews');
        
        if (indexContainer.length) {
            indexContainer.empty(); // <--- THIS WIPES THE 118 OLD ENTRIES
            latest.forEach(r => {
                indexContainer.append(`
                    <a class="book-card" href="reviews/${r.filename}">
                        <div class="book-card-img"><img src="images/${r.filename.replace('.html', '.jpg')}" alt="${r.itemReviewedName}"></div>
                        <div class="book-card-body"><h3>${r.itemReviewedName}</h3><p>${r.itemReviewedAuthor}</p></div>
                        <div class="book-card-footer">${r.verdictBadge}</div>
                    </a>`);
                stats.addedThisRun.index++;
            });
            await fs.writeFile('index.html', $index.html());
        }

        // 2. Update Browse (All 173)
        const $browse = cheerio.load(await fs.readFile('browse.html', 'utf8'));
        const alphabetical = [...inMemoryData].sort((a, b) => a.itemReviewedName.localeCompare(b.itemReviewedName));
        const browseContainer = $browse('#full-list');
        
        if (browseContainer.length) {
            browseContainer.empty(); // <--- THIS WIPES THE 113 OLD ENTRIES
            alphabetical.forEach(r => {
                browseContainer.append(`
                    <a class="row" href="reviews/${r.filename}">
                        <div class="row-content"><div class="row-title">${r.itemReviewedName}</div></div>
                        <span class="row-arrow">&#8594;</span>
                    </a>`);
                stats.addedThisRun.browse++;
            });
            await fs.writeFile('browse.html', $browse.html());
        }

        // 3. Update Sitemap
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        ['index.html', 'browse.html', 'about.html'].forEach(p => { 
            sitemap += `<url><loc>https://booksversusmovies.com/${p}</loc></url>`; 
            stats.addedThisRun.sitemap++;
        });
        inMemoryData.forEach(r => { 
            sitemap += `<url><loc>https://booksversusmovies.com/reviews/${r.filename}</loc></url>`; 
            stats.addedThisRun.sitemap++;
        });
        sitemap += `</urlset>`;
        await fs.writeFile('sitemap.xml', sitemap);

        // --- PHASE 3: POST-RUN AUDIT ---
        stats.after.index = cheerio.load(await fs.readFile('index.html', 'utf8'))('.book-card').length;
        stats.after.browse = cheerio.load(await fs.readFile('browse.html', 'utf8'))('.row').length;
        stats.after.sitemap = ((await fs.readFile('sitemap.xml', 'utf8')).match(/<url>/g) || []).length;

        // --- PHASE 4: LOGGING ---
        const logEntry = `
[${timestamp}] 
============================================================
PRE-SYNC AUDIT (Old Hard-coded Totals)
------------------------------------------------------------
Total in Index:      ${stats.before.index}
Total in Browse:     ${stats.before.browse}
Total in Sitemap:    ${stats.before.sitemap}

RUN SUMMARY (Action Taken)
------------------------------------------------------------
Files found in /reviews: ${stats.foundInFolder}
Processed for Index:     ${stats.addedThisRun.index}
Processed for Browse:    ${stats.addedThisRun.browse}
Processed for Sitemap:   ${stats.addedThisRun.sitemap}

POST-SYNC VERIFICATION (New Automated Totals)
------------------------------------------------------------
Total in Index:      ${stats.after.index}
Total in Browse:     ${stats.after.browse}
Total in Sitemap:    ${stats.after.sitemap}
============================================================\n`;

        await fs.appendFile(logPath, logEntry);
        console.log(logEntry);

    } catch (err) {
        console.error(`❌ MASTER SYNC FAILED: ${err.message}`);
    }
}

runMasterSync();