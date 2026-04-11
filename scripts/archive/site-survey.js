const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function auditFiles() {
    const reviewsDir = path.join(process.cwd(), 'reviews');
    const files = (await fs.readdir(reviewsDir)).filter(f => f.endsWith('.html'));
    
    const report = {
        total: files.length,
        hasJsonLd: 0,
        missingJsonLd: 0,
        genreLocations: { cssClass: 0, jsonOnly: 0, missingBoth: 0 },
        authorFormats: { nestedObject: 0, flatString: 0, missing: 0 }
    };

    for (const file of files) {
        const html = await fs.readFile(path.join(reviewsDir, file), 'utf8');
        const $ = cheerio.load(html);
        const jsonLd = $('script[type="application/ld+json"]').html();

        // 1. Check for JSON-LD Presence
        if (jsonLd) {
            report.hasJsonLd++;
            try {
                const data = JSON.parse(jsonLd);
                // Check Author Format
                if (typeof data.author === 'object' && data.author.name) report.authorFormats.nestedObject++;
                else if (typeof data.author === 'string') report.authorFormats.flatString++;
            } catch (e) {}
        } else {
            report.missingJsonLd++;
        }

        // 2. Locate the Genre
        const hasCssGenre = $('.card-genre').length > 0 || $('.row-genre').length > 0;
        if (hasCssGenre) report.genreLocations.cssClass++;
        else report.genreLocations.missingBoth++;
    }

    console.log("--- REVIEW ARCHITECTURE AUDIT ---");
    console.log(JSON.stringify(report, null, 2));
}

auditFiles();