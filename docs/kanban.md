[//]: # (Destination: docs/strategy/kanban.md)
# BooksVersusMovies.com — Kanban
==========================================
Last updated: April 14 2026


## In Progress

- Film Wins batch — 10 new greenfield pages (Jaws, Blade Runner, Shawshank, Arrival, etc.)


## To Do — High Priority

- [ ] llm-client.js — shared LLM client before Film Wins batch
- [ ] Run spotlight: node scripts\pipeline-spotlight.js --slug lonesome-dove
- [ ] Add oneLineReason to browse rows
- [ ] Request indexing — Priority 1 pages (see docs/indexing-requests.txt)
- [ ] Email capture — ConvertKit setup + opt-in form
- [ ] fix-nav.js — add to deploy pipeline so it runs automatically after render
- [ ] Update deploy-files.bat — paths changed after scripts reorganization


## To Do — Medium Priority

- [ ] /book-vs-movie hub page (suggestion 4 from SEO list)
- [ ] Anchor text on internal links — add "book vs movie" to related card links
- [ ] Genre hub pages (/thriller, /romance, /literary-fiction)
- [ ] Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
- [ ] WebP conversion for book cover images
- [ ] Social meta tags (Open Graph / Twitter Card) on all pages
- [ ] Add "Ones to Watch" section to Auteurs page (emerging directors)
- [ ] 4 more spotlight pages (Gone Girl, Dune, Stephen King universe, Colleen Hoover)
- [ ] Featured hub page at /featured listing all spotlights
- [ ] Reader verdict poll below verdict box


## To Do — Vercel Migration (do together, in order)

- [ ] Migrate from Netlify to Vercel
- [ ] Move reviews HTML out of project root into /reviews subfolder
- [ ] Set up Vercel cron job for pipeline-guide.js (nightly)
- [ ] Email notification for missing book images (nodemailer)
- [ ] Scaffold Docusaurus at docs.booksversusmovies.com
- [ ] Port docs/ folder into Docusaurus sidebar structure
- [ ] Set up Postgres database (Neon or PlanetScale) for structured data layer


## To Do — Low Priority / Later

- [ ] Priority/hype field in JSON schema
- [ ] Spoiler-free mode toggle
- [ ] "What to read next" quiz
- [ ] Reading progress tracker (localStorage)
- [ ] Goodreads rating integration
- [ ] Director filmography pages (/director/joe-wright)
- [ ] Print-friendly CSS for review pages
- [ ] Structured logging — Pino + OpenTelemetry


## Done — April 14 2026

- [x] pipeline-guide.js — upcoming adaptations guide (3-model parallel aggregation)
- [x] upcoming-adaptations.html — live at booksversusmovies.com/upcoming-adaptations
- [x] pipeline-spotlight.js — spotlight page generator
- [x] schema-spotlight.json — generic feature page schema
- [x] config/nav.json — single source of truth for site nav
- [x] check-nav.js — nav consistency auditor
- [x] fix-nav.js — fixes nav in static HTML files
- [x] pipeline-render.js — auto-copies rendered HTML to project root
- [x] fix-titles-book-vs-movie.js — added Book vs Movie to all 162 title tags
- [x] pass1b-titles.txt — updated to enforce Book vs Movie pattern
- [x] pipeline-browse.js h1 — "Book vs Movie" + updated meta
- [x] netlify.toml — 301 redirects for all .html URLs to clean URLs
- [x] Scripts reorganized — utils/, ops/, content/, reporting/
- [x] logger.js — fixed log path after scripts reorganization
- [x] docs/ reorganized — pipeline/, strategy/, research/, archive/
- [x] Section 6 complete — greenfield pipeline, generate-review.js
- [x] 164 pages live (162 revised + The Godfather + Ghost World)
