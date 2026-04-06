# BooksVersusMovies.com — Master Todo & Strategy
*Consolidated April 3, 2026*

---

## ✅ COMPLETED (Sessions 1 & 2)

- Migrated site from GoDaddy to Netlify
- DNS, HTTPS, and SSL live
- Google Analytics on all pages
- Google Search Console verified on all 3 sites (DNS TXT method)
- Sitemap created and submitted
- 21 comparison pages live
- index.html updated with categorized sections
- Affiliate disclosures added to all pages (script: script_add_disclosure.js)
- Alt-text updated on all pages (script: update_alt_text.js)
- Schema.org Review markup on all pages (script: add_schema.js)
- Google Analytics injected on all pages (script: add_analytics.js)
- "I vs We" disclosure fixed on all pages (script: script_i_vs_we.js)
- Schema validated — Google Rich Results Test confirmed valid
- Indexing requested in Search Console (partial — hit daily quota)
- About page created and linked in nav and footer
- Verdict badge emoji removed (script: remove_emojis.js)
- Title and meta descriptions updated on all pages (script: update_meta.js)
- Trailer notes updated with confirmed release dates (script: update_trailer_notes.js)
- booksvmovies.com purchased for future 301 redirect
- CSS verdict badge updated to left-border style

---

## 🔴 PRIORITY 1 — Do Next (High Impact, Low Effort)

### Finish indexing in Search Console
- [ ] Hit daily quota — resume requesting indexing on remaining pages
- [ ] Priority order: The Odyssey, Verity, Hamnet, Narnia, Hunger Games

### Bookshop.org Affiliate
- [ ] Sign up at bookshop.org/affiliates
- [ ] Get affiliate links for all 21 books
- [ ] Build Node script to add second "Support Independent Bookstores" buy button to all pages
- [ ] Higher commissions (10% vs Amazon 4.5%) + 30-day cookie vs 24 hours

### Streaming & Ticket CTAs
- [ ] Add "Watch Now" / "Get Tickets" button to film panel on 2026 pages
- [ ] Fandango affiliate for theatrical releases (Project Hail Mary, Odyssey, Verity, Hunger Games, Narnia, Hamnet)
- [ ] Streaming links for Remarkably Bright Creatures (Netflix) and Wuthering Heights (digital March 31)
- [ ] Research Apple TV+ and Fandango affiliate programs

### Wuthering Heights page update
- [ ] Film is already out (Feb 13, 2026) — update verdict and body text to reflect actual film
- [ ] Stars Margot Robbie and Jacob Elordi (not Jessie Buckley as previously noted)
- [ ] Mixed reviews (57% RT) — site's verdict may need updating
- [ ] Project Hail Mary also already out (March 20, 2026, 95% RT) — update accordingly

### Fix trailer embedding issue
- [ ] Some trailers (e.g. Wuthering Heights) have embedding blocked by YouTube
- [ ] Current facade pattern (thumbnail + play button linking to YouTube) is the correct solution
- [ ] Already implemented correctly — verify all pages use this pattern not iframes
- [ ] Legal and standard practice for review/editorial sites

---

## 🟡 PRIORITY 2 — This Week (High Impact, Medium Effort)

### Master Reference File (JSON manifest)
- [ ] Create books.json as single source of truth for all page data
- [ ] Fields per entry: slug, book title, author, year, film title, director, release year, Amazon ASIN, affiliate tag, YouTube ID, image filename, status (draft/complete/live), genre, verdict
- [ ] This is the most important architectural decision for scaling beyond 30 pages
- [ ] Change affiliate tag site-wide in ONE place
- [ ] Status field lets you stage drafts without publishing

### Automation: Page Generator
- [ ] Script reads one row from books.json and outputs complete HTML page
- [ ] Auto-injects: Schema.org markup, Google Analytics, affiliate disclosure, alt text
- [ ] Adding a new page = adding one row to books.json + running the script
- [ ] Include per-title affiliate tracking tags from day one (booksversusmovies-dune-20) so Associates data is clean

### Automation: Sitemap Generator
- [ ] Script scans root directory for .html files and regenerates sitemap.xml
- [ ] Hook into Netlify build process — runs automatically on every deploy
- [ ] No more manual sitemap updates

### Automation: Index Page Generator
- [ ] Script reads books.json and rebuilds index.html automatically
- [ ] Starter version already drafted in idea_build-js.txt — build on this
- [ ] Adding a new page = one JSON row, one script run, done

### Per-Title Affiliate Tracking Tags
- [ ] Switch from generic tag to per-title tags: booksversusmovies-dune-20, booksversusmovies-gone-girl-20 etc.
- [ ] Harder to retrofit later — do this now before traffic builds
- [ ] Lets Amazon Associates dashboard show which titles actually drive clicks
- [ ] Node script to find-and-replace tags across all pages

---

## 🟢 PRIORITY 3 — This Month (Medium Impact, Worth Doing)

### Cover Image Pipeline
- [ ] Tool already drafted in ideas.txt (cover_image_fetcher.html)
- [ ] Fetches cover images from Amazon CDN by ASIN
- [ ] Falls back to wget script if CORS blocks browser fetching
- [ ] Naming convention: use slug-based filenames (dune.jpg, gone-girl.jpg) — already doing this

### robots.txt
- [ ] Add robots.txt to site root — currently missing
- [ ] Basic version: allow all crawlers, point to sitemap
```
User-agent: *
Allow: /
Sitemap: https://booksversusmovies.com/sitemap.xml
```

### Internal Linking Pass
- [ ] Expand "More Comparisons" from 3 to 5 cards on each page
- [ ] Group by genre: thrillers link to thrillers, sci-fi to sci-fi
- [ ] Dune → Project Hail Mary, The Martian, The Odyssey (strong sci-fi cluster)
- [ ] Gone Girl → Girl on the Train, Verity, Big Little Lies (thriller cluster)

### About Page
- [ ] Already created — add personal details when ready
- [ ] Add "Get in Touch" section once email is set up
- [ ] Add to sitemap.xml

### Sitemap update
- [ ] Add about.html to sitemap.xml
- [ ] Resubmit sitemap after adding

### Next batch of comparison pages
- [ ] The Road (Cormac McCarthy) — no film yet but high search volume
- [ ] Normal People (Sally Rooney) — Hulu series
- [ ] Where the Crawdads Sing — strong search volume
- [ ] Beloved (Toni Morrison) — classic, high authority
- [ ] Pachinko (Min Jin Lee) — Apple TV+ series

---

## 🔵 PRIORITY 4 — Long Term (Revisit at 40-50 Pages)

### Intelligent Content Orchestrator
- [ ] Full pipeline outlined in ideas.txt section 4
- [ ] Accepts seed input (book title), auto-discovers metadata, validates, outputs manifest entry
- [ ] Bridges gap between raw ideas and deployed pages
- [ ] Build after manifest file and page generator are stable

### Genre Pillar Pages
- [ ] /science-fiction/, /thriller/, /literary-fiction/ index pages
- [ ] Each links to all comparisons in that genre
- [ ] Builds topical authority with Google
- [ ] Not worth doing until 40-50 pages

### Clean URL Architecture
- [ ] Migrate from dune.html to /dune/index.html
- [ ] Set up Netlify redirects to preserve SEO
- [ ] Right move eventually, not now

### High-Ticket Affiliate Items
- [ ] Folio Society editions, 4K Steelbooks
- [ ] Higher price = meaningful commission at 4-5%
- [ ] Start with Dune and Gone Girl as highest-traffic candidates

### Email List (revisit at 100 users)
- [ ] Platform decision: MailerLite (free to 1,000) or Substack (free forever)
- [ ] Neither Mailchimp nor ConvertKit/Kit have genuinely free tiers
- [ ] Substack interesting for built-in literary audience discovery
- [ ] Add "New Adaptation Alerts" signup to homepage and footer
- [ ] Welcome email: one sentence, what the list is, how often

### Google Indexing API
- [ ] After every deploy, ping Google's indexing API for new pages
- [ ] Speeds up time-to-index
- [ ] Build after automation pipeline is stable

### Domain
- [ ] booksvmovies.com purchased — set up 301 redirect to booksversusmovies.com when ready

---

## ❌ WHAT NOT TO DO

- No fake precision metrics (Faithfulness Score, Time to Read) — kills editorial voice
- No community voting or comment systems yet — backend complexity, no payoff
- No dark mode toggle — distraction
- No clean URLs yet — migration cost not worth it at current scale
- No genre pillar pages yet — need more pages behind each genre first
- Don't optimize for AI zero-click snippets at expense of prose quality
- Don't add comparison tables — turns site into generic affiliate data sheet

---

## 💡 STRATEGIC NORTH STAR

The site doesn't feel like an affiliate site — it reads like a publication. Protect that.
Monetize the publication, don't turn it into a comparison database.

The Nolan Odyssey (July 17, 2026) is the single highest-traffic opportunity of the year.
It bridges all three sites: BooksVersusMovies (comparison), ReadingTheOdyssey (text),
AncientWorldReference (context). Prioritize getting that page excellent before July.

---

## 📋 SCRIPTS INVENTORY

| Script | Purpose |
|--------|---------|
| script_add_disclosure.js | Adds Amazon affiliate disclosure near buy buttons |
| update_alt_text.js | Updates image alt text with keyword-rich descriptions |
| add_schema.js | Injects Schema.org Review JSON-LD into all pages |
| add_analytics.js | Injects Google Analytics tag into all pages |
| script_i_vs_we.js | Fixes "we earn" to "I earn" in all footers |
| remove_emojis.js | Removes emoji from verdict badges and card footers |
| update_meta.js | Updates title and meta description on all pages |
| update_trailer_notes.js | Updates trailer cast and release date notes |

---

## 🗓 NEXT COMPARISON PAGES TO BUILD

Priority order based on search volume and 2026 relevance:
1. Where the Crawdads Sing
2. Normal People
3. The Road
4. Beloved
5. Pachinko
