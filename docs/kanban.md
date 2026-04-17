# BooksVersusMovies.com — Kanban

==========================================
Last updated: April 17 2026



## In Progress

* Pillar pages — 10 live, monitoring GSC for cannibalization



## To Do — Today

* \[ ] Add Reminders of Him to featured.html grid
* \[ ] GSC indexing — 10 pillar page URLs



## To Do — High Priority

* \[ ] /how-we-judge page — short editorial standards page, links to pillar pages
* \[ ] Recently added section on browse/index page — surfaces new Film Wins batch
* \[ ] llm-client.js — shared LLM client module (before next big batch)
* \[ ] Email capture — ConvertKit setup + opt-in form
* \[ ] Anchor text on internal links — add "book vs movie" to related card links
* \[ ] Cross-link spotlight pages to each other (relatedSpotlights field)
* \[ ] /book-vs-movie hub page
* \[ ] Logger config file — option to log errors only (config/logger.json)
* \[ ] pipeline-greenfield.js — fix double output lines (spawnSync printing twice)
* \[ ] Update deploy-files.bat — paths changed after scripts reorganization
* \[ ] add-destination.js — update SCAN array when new subfolders created
* \[ ] Spotlight pages — migrate buy button CSS to style.css (Vercel migration)



## To Do — Medium Priority

* \[ ] Genre hub pages (/thriller, /romance, /literary-fiction)
* \[ ] Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
* \[ ] "Ones to Watch" section on Auteurs page (emerging directors/showrunners)
* \[ ] WebP conversion for book cover images
* \[ ] Social meta tags (Open Graph / Twitter Card) on all pages
* \[ ] Reader verdict poll below verdict box
* \[ ] Video affiliate links — add to input JSON and render pipeline
* \[ ] Multi-LLM code review — review pipeline scripts with Grok/Gemini/Sonnet
* \[ ] Add video affiliate links to input JSON convention



## To Do — Vercel Migration (do together, in order)

* \[ ] Migrate from Netlify to Vercel
* \[ ] Move reviews HTML out of project root into /reviews subfolder
* \[ ] Set up Vercel cron job for pipeline-guide.js (nightly)
* \[ ] Email notification for missing book images (nodemailer)
* \[ ] Scaffold Docusaurus at docs.booksversusmovies.com
* \[ ] Port docs/ folder into Docusaurus sidebar structure
* \[ ] Set up Postgres database (Neon or PlanetScale)
* \[ ] Abstract pipeline for multi-site reuse (TheApiaryGuide)



## To Do — Pipeline Robustness

* \[ ] Title retry — pass shorter instruction to LLM before falling back
* \[ ] pipeline-greenfield.js — fix double console output
* \[ ] pipeline-greenfield.js — unified log not capturing all output yet
* \[ ] Add --pass conversion alias to pipeline-revise.js
* \[ ] quality-gate.js — review after Film Wins batch
* \[ ] Script version metadata in all pipeline HTML outputs



## TheApiaryGuide.com (Future Project)

Domain owned: TheApiaryGuide.com

Site structure:

* Shop     — best-of roundups, starter kits, gear comparisons (affiliate)
* Learn    — beginner guides, how-to, science/biology of beekeeping
* Discover — history, famous beekeepers, books, movies, documentaries (link bait)
* Community — local clubs directory, associations, events

Stack decision: WordPress (not HTML-first)

* Hosting:          SiteGround (\~$2.99/mo intro)
* Affiliate plugin: AAWP (\~$49/year) — Amazon product boxes + pricing
* SEO plugin:       Rank Math (free)
* Theme:            Astra or Kadence (free)
* \[ ] Set up SiteGround hosting + WordPress
* \[ ] Install AAWP + Rank Math + chosen theme
* \[ ] Map first 12 articles (3-4 best-of roundups, 2-3 comparisons, 2-3 single reviews,
1 beginner guide, 1 history page, 1 clubs directory)
* \[ ] Build clubs/associations directory page (link bait — clubs will link back)
* \[ ] "History of Beekeeping" long-form evergreen page
* \[ ] "Best Beginner Starter Kit" roundup (highest buyer intent)
* \[ ] Abstract BooksVersusMovies pipeline for reuse across sites
* \[ ] Explore WordPress REST API for automated draft publishing from pipeline
* \[ ] ConvertKit email capture from day one



## To Do — Low Priority / Later

* \[ ] Priority/hype field in JSON schema
* \[ ] Spoiler-free mode toggle
* \[ ] "What to read next" quiz
* \[ ] Reading progress tracker
* \[ ] Goodreads rating integration
* \[ ] Director filmography pages
* \[ ] Print-friendly CSS
* \[ ] Author profile pages (Stephen King, Colleen Hoover, Gillian Flynn)



## Done — April 17 2026

* \[x] Reminders of Him spotlight page live
* \[x] 10 pillar pages live and indexed
* \[x] pipeline-pillar.js + pipeline-pillar-render.js built
* \[x] config/pillars.json — 10 pillars configured
* \[x] sitemap-generate.js — now auto-discovers pillar pages + all static pages
* \[x] SEO titles, meta, oneLineReasons updated — Sonnet review pass (171 pages)
* \[x] seo-metadata-export.js + seo-metadata-import.js built (scripts/utils/)
* \[x] tree-code.js + tree-text.js built (scripts/utils/)
* \[x] consolidate-docs.js — flexible folder consolidation (scripts/content/)
* \[x] featured.html hub page live — 5 spotlights
* \[x] pipeline-guide.js — fixed \_destination JSON bug in --render-only mode
* \[x] check-nav.js ROOT path fixed
* \[x] Nav updated across all pages — Featured → /featured
* \[x] Blade Runner, Shawshank Redemption, Arrival greenfield JSONs ready
* \[x] Jaws, Lady Chatterley's Lover, No Country for Old Men live



## Done — April 15 2026

* \[x] 5 spotlight pages live — lonesome-dove, fight-club, gone-girl, dune, the-shining
* \[x] Spotlight buy buttons — terracotta → Book Wins green style
* \[x] pipeline-spotlight.js — affiliate link auto-lookup from review JSON
* \[x] pipeline-spotlight.js — script version metadata in HTML output
* \[x] pipeline-post.js — post-processing wrapper
* \[x] pipeline-greenfield.js — full orchestrator with auto-fix for long titles
* \[x] pipeline-clear.js — clears pipeline outputs for a slug
* \[x] archive-logs.js
* \[x] sitemap-generate.js path fixed for ops/ subdirectory



## Done — April 14 2026

* \[x] pipeline-guide.js — upcoming adaptations guide (3-model parallel)
* \[x] upcoming-adaptations.html live
* \[x] pipeline-spotlight.js — spotlight page generator
* \[x] schema-spotlight.json
* \[x] config/nav.json — single source of truth for nav
* \[x] check-nav.js + fix-nav.js
* \[x] pipeline-render.js — auto-copies to project root
* \[x] fix-titles-book-vs-movie.js — Book vs Movie in all 162 title tags
* \[x] pass1b-titles.txt — enforces Book vs Movie pattern
* \[x] Homepage h1 + meta updated
* \[x] netlify.toml — 301 redirects for all .html URLs
* \[x] Scripts reorganized — utils/, ops/, content/, reporting/
* \[x] logger.js, validate-json-schema.js, pipeline-revise.js paths fixed
* \[x] deploy.js + add-destination.js
* \[x] tree.js --save flag
* \[x] docs/ restructured — reference/, strategy/, research/, archive/



about page thoughts: 

\- \[ ] About page rewrite — real person, real story, why this site exists

\- \[ ] Voice pass on top 10 traffic pages — sharpen opinions, remove safe hedging

