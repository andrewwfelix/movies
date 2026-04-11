const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

async function deepScrape() {
    console.log("--- Initializing Schema-Aware Extraction ---");
    
    const reviewsDir = path.join(process.cwd(), 'reviews');
    const dataDir = path.join(process.cwd(), 'data');

    try {
        const files = (await fs.readdir(reviewsDir)).filter(f => f.endsWith('.html'));
        const records = [];

        for (const file of files) {
            const html = await fs.readFile(path.join(reviewsDir, file), 'utf8');
            const $ = cheerio.load(html);
            
            // 1. Find the JSON-LD script block
            const jsonLdScript = $('script[type="application/ld+json"]').html();
            let schema = {};
            
            if (jsonLdScript) {
                try {
                    schema = JSON.parse(jsonLdScript);
                } catch (e) {
                    console.log(`⚠️  Could not parse JSON in ${file}`);
                }
            }

            // 2. Extract from Schema with fallbacks to DOM
            const record = {
                filename: file,
                // Pulling from itemReviewed.name (standard for Review schema)
                itemReviewedName: schema.itemReviewed?.name || $('title').text().split('—')[0].trim(),
                
                // Pulling from author.name as requested
                itemReviewedAuthor: schema.author?.name || "Unknown Author",
                
                // Pulling genre and verdict
                genre: schema.genre || $('.card-genre').first().text().trim() || "General",
                verdictBadge: schema.reviewRating?.alternateName || $('.verdict-badge').first().text().trim() || "Book Wins",
                
                // Dates and paths
                releaseDate: schema.datePublished ? schema.datePublished.substring(0,4) : "2026",
                dateUpdated: (await fs.stat(path.join(reviewsDir, file))).mtime.toISOString().split('T')[0],
                imagePath: `images/${file.replace('.html', '.jpg')}`,
                url: `https://booksversusmovies.com/reviews/${file}`
            };
            
            records.push(record);
        }

        // Sort by dateUpdated
        records.sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated));

        const headers = "filename,itemReviewedName,itemReviewedAuthor,genre,verdictBadge,releaseDate,dateUpdated,imagePath,url\n";
        const rows = records.map(r => 
            `"${r.filename}","${r.itemReviewedName}","${r.itemReviewedAuthor}","${r.genre}","${r.verdictBadge}","${r.releaseDate}","${r.dateUpdated}","${r.imagePath}","${r.url}"`
        ).join("\n");

        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(path.join(dataDir, 'extracted_metadata.csv'), headers + rows);
        
        console.log(`✅ SUCCESS: Processed ${records.length} reviews using JSON-LD schema.`);

    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

deepScrape();