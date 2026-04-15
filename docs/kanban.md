[//]: # (Destination: docs/strategy/kanban.md)

# BooksVersusMovies.com — Kanban
==========================================
Last updated: April 14 2026


## In Progress

- No Country for Old Men — greenfield running


## To Do — Tomorrow (April 15)

- [ ] Review jaws.html, lady-chatterleys-lover.html, no-country-for-old-men.html in browser
- [ ] Check images exist for all three new pages
- [ ] GSC indexing requests — Priority 1 list (10 per day, docs/indexing-requests.txt)
- [ ] Film Wins batch continued — Blade Runner, Shawshank, Arrival
- [ ] Add video affiliate links to kanban + input JSON convention


## To Do — High Priority

- [ ] llm-client.js — shared LLM client module (before next big batch)
- [ ] Logger config file — option to log errors only (config/logger.json)
- [ ] pipeline-greenfield.js — fix double output lines (spawnSync printing twice)
- [ ] Email capture — ConvertKit setup + opt-in form
- [ ] /book-vs-movie hub page
- [ ] Anchor text on internal links — add "book vs movie" to related card links
- [ ] Update deploy-files.bat — paths changed after scripts reorganization
- [ ] add-destination.js — update SCAN array when new subfolders created


## To Do — Medium Priority

- [ ] Genre hub pages (/thriller, /romance, /literary-fiction)
- [ ] Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
- [ ] 4 more spotlight pages (Gone Girl, Dune, Stephen King universe, Colleen Hoover)
- [ ] Featured hub page at /featured listing all spotlights
- [ ] "Ones to Watch" section on Auteurs page (emerging directors/showrunners)
- [ ] WebP conversion for book cover images
- [ ] Social meta tags (Open Graph / Twitter Card) on all pages
- [ ] Reader verdict poll below verdict box
- [ ] Video affiliate links — add to input JSON and render pipeline


## To Do — Vercel Migration (do together, in order)

- [ ] Migrate from Netlify to Vercel
- [ ] Move reviews HTML out of project root into /reviews subfolder
- [ ] Set up Vercel cron job for pipeline-guide.js (nightly)
- [ ] Email notification for missing book images (nodemailer)
- [ ] Scaffold Docusaurus at docs.booksversusmovies.com
- [ ] Port docs/ folder into Docusaurus sidebar structure
- [ ] Set up Postgres database (Neon or PlanetScale)


## To Do — Pipeline Robustness

- [ ] Title retry — pass shorter instruction to LLM before falling back
- [ ] pipeline-greenfield.js — fix double console output
- [ ] pipeline-greenfield.js — unified log not capturing all output yet
- [ ] Add --pass conversion alias to pipeline-revise.js
- [ ] quality-gate.js — review after Film Wins batch


## To Do — Low Priority / Later

- [ ] Priority/hype field in JSON schema
- [ ] Spoiler-free mode toggle
- [ ] "What to read next" quiz
- [ ] Reading progress tracker
- [ ] Goodreads rating integration
- [ ] Director filmography pages
- [ ] Print-friendly CSS


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
- [x] pipeline-clear.js
- [x] pipeline-greenfield.js — full orchestrator with logging
- [x] archive-logs.js
- [x] tree.js --save flag
- [x] docs/ restructured — reference/, strategy/, research/, archive/
- [x] Jaws greenfield page generated
- [x] Lady Chatterley's Lover greenfield page generated
- [x] spotlight-lonesome-dove.html live
