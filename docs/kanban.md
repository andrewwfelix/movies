[//]: # (Destination: docs/strategy/kanban.md)

# BooksVersusMovies.com — Kanban
==========================================
Last updated: April 15 2026


## In Progress

- Film Wins batch — Jaws, Lady Chatterley's Lover, No Country for Old Men done


## To Do — Today

- [ ] Review jaws.html, lady-chatterleys-lover.html, no-country-for-old-men.html in browser
- [ ] Check images exist for all three new pages
- [ ] GSC indexing requests — Priority 1 list (10 per day, docs/indexing-requests.txt)
- [ ] Film Wins batch continued — Blade Runner, Shawshank, Arrival
- [ ] Add video affiliate links to input JSON convention
- [ ] Featured hub page at /featured listing all 5 spotlights
- [ ] Update nav.json Featured link to point to /featured hub


## To Do — High Priority

- [ ] llm-client.js — shared LLM client module (before next big batch)
- [ ] Logger config file — option to log errors only (config/logger.json)
- [ ] pipeline-greenfield.js — fix double output lines (spawnSync printing twice)
- [ ] Email capture — ConvertKit setup + opt-in form
- [ ] /book-vs-movie hub page
- [ ] Anchor text on internal links — add "book vs movie" to related card links
- [ ] Update deploy-files.bat — paths changed after scripts reorganization
- [ ] add-destination.js — update SCAN array when new subfolders created
- [ ] Cross-link spotlight pages to each other (relatedSpotlights field)
- [ ] Spotlight pages — migrate buy button CSS to style.css (Vercel migration)


## To Do — Medium Priority

- [ ] Genre hub pages (/thriller, /romance, /literary-fiction)
- [ ] Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
- [ ] "Ones to Watch" section on Auteurs page (emerging directors/showrunners)
- [ ] WebP conversion for book cover images
- [ ] Social meta tags (Open Graph / Twitter Card) on all pages
- [ ] Reader verdict poll below verdict box
- [ ] Video affiliate links — add to input JSON and render pipeline
- [ ] Multi-LLM code review — review pipeline scripts with Grok/Gemini/Sonnet


## To Do — Vercel Migration (do together, in order)

- [ ] Migrate from Netlify to Vercel
- [ ] Move reviews HTML out of project root into /reviews subfolder
- [ ] Set up Vercel cron job for pipeline-guide.js (nightly)
- [ ] Email notification for missing book images (nodemailer)
- [ ] Scaffold Docusaurus at docs.booksversusmovies.com
- [ ] Port docs/ folder into Docusaurus sidebar structure
- [ ] Set up Postgres database (Neon or PlanetScale)
- [ ] Abstract pipeline for multi-site reuse (TheApiaryGuide)


## To Do — Pipeline Robustness

- [ ] Title retry — pass shorter instruction to LLM before falling back
- [ ] pipeline-greenfield.js — fix double console output
- [ ] pipeline-greenfield.js — unified log not capturing all output yet
- [ ] Add --pass conversion alias to pipeline-revise.js
- [ ] quality-gate.js — review after Film Wins batch
- [ ] Script version metadata in all pipeline HTML outputs


## TheApiaryGuide.com (Future Project)

Domain owned: TheApiaryGuide.com

Site structure:
  - Shop     — best-of roundups, starter kits, gear comparisons (affiliate)
  - Learn    — beginner guides, how-to, science/biology of beekeeping
  - Discover — history, famous beekeepers, books, movies, documentaries (link bait)
  - Community — local clubs directory, associations, events

Stack decision: WordPress (not HTML-first)
  - Hosting:          SiteGround (~$2.99/mo intro)
  - Affiliate plugin: AAWP (~$49/year) — Amazon product boxes + pricing
  - SEO plugin:       Rank Math (free)
  - Theme:            Astra or Kadence (free)

- [ ] Set up SiteGround hosting + WordPress
- [ ] Install AAWP + Rank Math + chosen theme
- [ ] Map first 12 articles (3-4 best-of roundups, 2-3 comparisons, 2-3 single reviews,
      1 beginner guide, 1 history page, 1 clubs directory)
- [ ] Build clubs/associations directory page (link bait — clubs will link back)
- [ ] "History of Beekeeping" long-form evergreen page
- [ ] "Best Beginner Starter Kit" roundup (highest buyer intent)
- [ ] Abstract BooksVersusMovies pipeline for reuse across sites
- [ ] Explore WordPress REST API for automated draft publishing from pipeline
- [ ] ConvertKit email capture from day one


## To Do — Low Priority / Later

- [ ] Priority/hype field in JSON schema
- [ ] Spoiler-free mode toggle
- [ ] "What to read next" quiz
- [ ] Reading progress tracker
- [ ] Goodreads rating integration
- [ ] Director filmography pages
- [ ] Print-friendly CSS
- [ ] Author profile pages (Stephen King, Colleen Hoover, Gillian Flynn)


## Done — April 15 2026

- [x] 5 spotlight pages live — lonesome-dove, fight-club, gone-girl, dune, the-shining
- [x] Spotlight buy buttons — terracotta → Book Wins green style
- [x] pipeline-spotlight.js — affiliate link auto-lookup from review JSON
- [x] pipeline-spotlight.js — script version metadata in HTML output
- [x] pipeline-post.js — post-processing wrapper
- [x] pipeline-greenfield.js — full orchestrator with auto-fix for long titles
- [x] pipeline-clear.js — clears pipeline outputs for a slug
- [x] archive-logs.js
- [x] sitemap-generate.js path fixed for ops/ subdirectory
- [x] Jaws, Lady Chatterley's Lover, No Country for Old Men greenfield pages


## Done — April 14 2026

- [x] pipeline-guide.js — upcoming adaptations guide (3-model parallel)
- [x] upcoming-adaptations.html live
- [x] pipeline-spotlight.js — spotlight page generator
- [x] schema-spotlight.json
- [x] config/nav.json — single source of truth for nav
- [x] check-nav.js + fix-nav.js
- [x] pipeline-render.js — auto-copies to project root
- [x] fix-titles-book-vs-movie.js — Book vs Movie in all 162 title tags
- [x] pass1b-titles.txt — enforces Book vs Movie pattern
- [x] Homepage h1 + meta updated
- [x] netlify.toml — 301 redirects for all .html URLs
- [x] Scripts reorganized — utils/, ops/, content/, reporting/
- [x] logger.js, validate-json-schema.js, pipeline-revise.js paths fixed
- [x] deploy.js + add-destination.js
- [x] tree.js --save flag
- [x] docs/ restructured — reference/, strategy/, research/, archive/
