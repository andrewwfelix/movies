# BooksVersusMovies.com — Tomorrow's Todo & Strategy Notes
*Generated April 2, 2026*

---

## 🔴 Priority 1 — Do First (High Impact, Low Effort)

### Schema.org Structured Data
- [ ] Add JSON-LD `Review` schema to every comparison page
- [ ] Include `Book` entity markup with author, publish date, ISBN
- [ ] Add to page generator so all future pages get it automatically
- [ ] Target: rich snippets (star ratings, verdict) in Google search results

### Streaming & Ticket CTAs
- [ ] Add "Watch Now" button to every film panel alongside the trailer
- [ ] Link to streaming platforms (Max, Netflix, Apple TV+, Prime)
- [ ] Link to Fandango/theater tickets for 2026 in-theaters releases
- [ ] Use affiliate links where available (Apple TV+ and Fandango have programs)

### Image Alt-Text Audit
- [ ] Update all book cover alt-text to include author name (e.g. "Dune book cover Frank Herbert")
- [ ] Update all movie image alt-text to include director (e.g. "Dune Denis Villeneuve film")
- [ ] Helps surface pages in Google Image search

### Pending From Today
- [ ] Add all 10 new book cover images to `images/` folder
- [ ] Add Google Analytics tag to all new HTML pages
- [ ] Add Mailgun email records to Netlify DNS panel
- [ ] Resubmit sitemap in Google Search Console

---

## 🟡 Priority 2 — This Week (High Impact, Medium Effort)

### Automation: Page Generator
- [ ] Build a script that takes 5 inputs (title, affiliate link, YouTube URL, image name, metadata) and outputs a complete HTML file
- [ ] Script should auto-inject Schema.org markup
- [ ] Script should auto-inject Google Analytics tag
- [ ] Consider a simple CSV or Google Sheet as the data source

### Automation: Sitemap Generator
- [ ] Build a script that scans the root directory for `.html` files and regenerates `sitemap.xml`
- [ ] Hook into Netlify build process so it runs automatically on every deploy
- [ ] No more manual sitemap updates

### Automation: Index Page Generator
- [ ] Build a script that reads a data file (JSON or CSV) and rebuilds `index.html`
- [ ] Data file contains: title, genre, author, director, verdict, release info, image name, slug
- [ ] Adding a new page = adding one row to the data file

### Email List
- [ ] Set up Mailchimp or ConvertKit (free tiers available)
- [ ] Add "New Adaptation Alert" signup to homepage and footer
- [ ] Simple lead magnet: "Get notified when we publish new comparisons"
- [ ] This is the most important long-term business move — own your audience

---

## 🟢 Priority 3 — This Month (Medium Impact, Worth Doing)

### Affiliate Diversification
- [ ] Sign up for Bookshop.org affiliate program (higher commissions than Amazon, longer cookie window)
- [ ] Add Bookshop.org as a second "Buy the Book" option on each page
- [ ] Keep Amazon as primary, Bookshop.org as secondary
- [ ] Research Apple TV+ and Fandango affiliate programs for streaming/ticket CTAs

### Internal Linking by Genre
- [ ] Expand "More Comparisons" sections to group by genre
- [ ] Thrillers link to other thrillers, sci-fi links to other sci-fi
- [ ] Helps pass link authority between related pages and keeps users on site longer

### Title Tag Audit
- [ ] Ensure all `<title>` tags follow format: "[Title]: Book vs Movie | BooksVersusMovies.com"
- [ ] Consistent "Book vs Movie" phrasing captures comparison-intent searches

### Speculative 2026 Pages
- [ ] Keep building comparison pages for upcoming 2026 adaptations early
- [ ] Pages gain authority before release; update with film data post-release
- [ ] Current 2026 targets already live: Project Hail Mary, Narnia, Wuthering Heights, Verity, Hunger Games

---

## 🔵 Priority 4 — Long Term (Revisit at 40-50 Pages)

### Genre Pillar Pages
- [ ] Build `/science-fiction/`, `/thriller/`, `/literary-fiction/` index pages
- [ ] Each pillar page links to all comparisons in that genre
- [ ] Builds "topical authority" with Google
- [ ] Not worth doing yet — need more pages behind each genre first

### Clean URL Architecture
- [ ] Migrate from `dune.html` to `/dune/index.html` for cleaner URLs
- [ ] Set up Netlify redirects from old URLs to preserve SEO
- [ ] Right move eventually, not now — too much migration work for current scale

### High-Ticket Affiliate Items
- [ ] Add "Collector's Edition" section featuring Folio Society books, 4K Steelbooks
- [ ] Higher price point = meaningful commission even at 4-5%
- [ ] Identify top-traffic pages (likely Dune, Gone Girl) as candidates

### Automation: Image Fetching
- [ ] Script to pull book cover images from Open Library API by ISBN
- [ ] Reduces manual image sourcing work per new page

### Automation: Google Indexing API
- [ ] After every deploy, ping Google's indexing API for new pages
- [ ] Speeds up time-to-index for new comparisons

---

## ❌ What Not to Do (Notes from Gemini Review)

- **Don't add fake precision metrics** like "Faithfulness Score: 85%" or "Time to Read: 12 hrs" — this turns your site into a generic affiliate data sheet and erases your competitive advantage
- **Don't optimize purely for AI zero-click snippets** at the expense of prose quality — your readers want to read, not get bullet answers
- **Don't add community voting yet** — adds backend complexity with no clear payoff at current traffic levels
- **Don't rush clean URLs** — the SEO benefit doesn't justify the migration work until you're much larger

---

## 💡 Strategic North Star

Your competitive advantage is that the site **doesn't feel like an affiliate site** — it reads like a publication with a strong editorial voice. Every decision should protect that. The goal is to monetize the publication, not turn it into a comparison database.

Schema markup, streaming CTAs, email list, and Bookshop.org are the moves that add revenue **without changing what makes the site good**. Everything else is secondary.

---

*Next batch of comparisons to build:*
- The Road (Cormac McCarthy)
- Beloved (Toni Morrison)
- Normal People (Sally Rooney)
- Pachinko (Min Jin Lee)
- Where the Crawdads Sing
