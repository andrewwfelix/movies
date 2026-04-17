[//]: # (Destination: docs/kanban.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, - [ ] checkboxes no backslashes, dates YYYY-MM-DD, status: not-started|in-progress|done|blocked, priority: high|medium|low, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Kanban
Last updated: 2026-04-17

---

## In Progress

- Pillar pages — 10 live, monitoring GSC for cannibalization
- docs branch — standardizing doc formats, building docs-to-json parser

---

## Today

- [ ] GSC indexing — 10 pillar page URLs
- [ ] Fill affiliate links for Blade Runner, Shawshank, Arrival greenfield JSONs
- [ ] docs-to-json.js — kanban parser, project-status.json schema

---

## High Priority

- [ ] Add hyperlinks from pillar pages to individual review pages
- [ ] /how-we-judge page — short editorial standards page, links to pillar pages
- [ ] Recently added section on browse/index page — surfaces new Film Wins batch
- [ ] llm-client.js — shared LLM client module (before next big batch)
- [ ] Beehiiv DNS / custom domain setup
- [ ] Beehiiv welcome email for new subscribers
- [ ] Email capture — ConvertKit setup + opt-in form
- [ ] Anchor text on internal links — add "book vs movie" to related card links
- [ ] Cross-link spotlight pages to each other (relatedSpotlights field)
- [ ] /book-vs-movie hub page
- [ ] Logger config file — option to log errors only (config/logger.json)
- [ ] pipeline-greenfield.js — fix double output lines (spawnSync printing twice)
- [ ] Update deploy-files.bat — paths changed after scripts reorganization
- [ ] add-destination.js — update SCAN array when new subfolders created
- [ ] Spotlight pages — migrate buy button CSS to style.css (Vercel migration)

---

## Medium Priority

- [ ] Genre hub pages (/thriller, /romance, /literary-fiction)
- [ ] Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
- [ ] Ones to Watch section on Auteurs page (emerging directors/showrunners)
- [ ] WebP conversion for book cover images
- [ ] Social meta tags (Open Graph / Twitter Card) on all pages
- [ ] Reader verdict poll below verdict box
- [ ] Video affiliate links — add to input JSON and render pipeline
- [ ] Multi-LLM code review — review pipeline scripts with Grok/Gemini/Sonnet

---

## Pipeline Robustness

- [ ] Title retry — pass shorter instruction to LLM before falling back
- [ ] pipeline-greenfield.js — fix double console output
- [ ] pipeline-greenfield.js — unified log not capturing all output yet
- [ ] Add --pass conversion alias to pipeline-revise.js
- [ ] quality-gate.js — review after Film Wins batch
- [ ] Script version metadata in all pipeline HTML outputs

---

## Dashboard

- [ ] Dashboard — wire up GSC API on Vercel migration
- [ ] Dashboard — password protection (Netlify Basic Auth or Vercel middleware)
- [ ] Dashboard — CSV import script to auto-update latest.json from GSC exports
- [ ] Dashboard Tab 6 Content — review queue and generation status

---

## Business / Operations

- [ ] Transfer site accounts to RavensEdge AI LLC — Amazon Associates, GSC, GA, Netlify, Beehiiv, domain registrar
- [ ] About page rewrite — real person, real story, why this site exists
- [ ] Voice pass on top 10 traffic pages — sharpen opinions, remove safe hedging
- [ ] Hire Content Researcher (Person 1) — post job rec, review applications
- [ ] Project plan doc — objectives vs analytics, quarterly roadmap

---

## Vercel Epic (do not start until Netlify stable + revenue consistent)

- [ ] Sprint 1 — /api/generate endpoint with dashboard UI (Tab 6 Content)
- [ ] Sprint 1 — Live GSC API wired to Tab 1 Analytics (no more CSV exports)
- [ ] Sprint 1 — Beehiiv auto-draft on review Published
- [ ] Sprint 2 — Supabase schema: reviews, analytics_history, redirects tables
- [ ] Sprint 2 — Migrate 191 reviews into Supabase
- [ ] Sprint 2 — Vercel static site + ISR setup
- [ ] Sprint 2 — Redirects table replacing netlify.toml
- [ ] Sprint 3 — Programmatic SEO pages from DB queries
- [ ] Sprint 3 — Auto internal linking via DB trigger
- [ ] Sprint 3 — CTR optimization loop
- [ ] Sprint 3 — Stale content detector cron
- [ ] Sprint 4 — site_id in all tables (multi-site architecture)
- [ ] Sprint 4 — TheApiaryGuide as second site
- [ ] Sprint 4 — RBAC for Content Researcher via Supabase Auth
- [ ] Sprint 4 — Cross-site dashboard reporting

---

## TheApiaryGuide.com (Future Project)

Domain owned: TheApiaryGuide.com

Site structure:
- Shop — best-of roundups, starter kits, gear comparisons (affiliate)
- Learn — beginner guides, how-to, science/biology of beekeeping
- Discover — history, famous beekeepers, books, movies, documentaries (link bait)
- Community — local clubs directory, associations, events

Stack: WordPress, SiteGround (~$2.99/mo), AAWP (~$49/yr), Rank Math, Astra or Kadence

- [ ] Set up SiteGround hosting + WordPress
- [ ] Install AAWP + Rank Math + chosen theme
- [ ] Map first 12 articles
- [ ] Build clubs/associations directory page (link bait)
- [ ] History of Beekeeping long-form evergreen page
- [ ] Best Beginner Starter Kit roundup (highest buyer intent)
- [ ] Abstract BooksVersusMovies pipeline for reuse across sites
- [ ] Explore WordPress REST API for automated draft publishing from pipeline
- [ ] ConvertKit email capture from day one

---

## Low Priority / Later

- [ ] Priority/hype field in JSON schema
- [ ] Spoiler-free mode toggle
- [ ] What to read next quiz
- [ ] Reading progress tracker
- [ ] Goodreads rating integration
- [ ] Director filmography pages
- [ ] Print-friendly CSS
- [ ] Author profile pages (Stephen King, Colleen Hoover, Gillian Flynn)

---

## Done — 2026-04-17

- [x] Reminders of Him spotlight page live
- [x] Reminders of Him as hero card in featured.html
- [x] 10 pillar pages live and indexed
- [x] pipeline-pillar.js + pipeline-pillar-render.js built
- [x] config/pillars.json — 10 pillars configured
- [x] sitemap-generate.js — auto-discovers pillar pages + all static pages (191 URLs)
- [x] SEO titles, meta, oneLineReasons updated — Sonnet review pass (171 pages)
- [x] seo-metadata-export.js + seo-metadata-import.js built (scripts/utils/)
- [x] tree-code.js + tree-text.js built (scripts/utils/)
- [x] consolidate-docs.js — flexible folder consolidation (scripts/content/)
- [x] consistency-audit.js — 8-check site audit script (scripts/utils/)
- [x] fix-related-cards.js — fixed 55 broken related card slugs (scripts/utils/)
- [x] featured.html hub page live — 6 spotlights
- [x] pipeline-guide.js — fixed _destination JSON bug in --render-only mode
- [x] check-nav.js ROOT path fixed
- [x] Nav updated across all pages — Featured → /featured
- [x] Beehiiv newsletter embed integrated into all review pages
- [x] Fight Club newsletter email written and staged in Beehiiv
- [x] Beehiiv form tested — first subscriber confirmed
- [x] docs/team/ created — onboarding pack, job rec
- [x] Dashboard live at /dashboard — 5 tabs, light color scheme
- [x] dashboard/data/ folder — latest.json, project-status.json, decisions.json
- [x] docs-to-json.js — parses kanban.md and decisions.md into JSON
- [x] Greenfield JSONs ready: Blade Runner, Shawshank Redemption, Arrival
- [x] docs branch — 6 core docs standardized to v1 format
- [x] decisions.md created — 18 architectural decisions
- [x] docs-archive.bat + docs-cleanup.bat created

## Done — 2026-04-15

- [x] 5 spotlight pages live — lonesome-dove, fight-club, gone-girl, dune, the-shining
- [x] Spotlight buy buttons — terracotta → Book Wins green style
- [x] pipeline-spotlight.js — affiliate link auto-lookup from review JSON
- [x] pipeline-post.js — post-processing wrapper
- [x] pipeline-greenfield.js — full orchestrator with auto-fix for long titles
- [x] pipeline-clear.js — clears pipeline outputs for a slug
- [x] archive-logs.js
- [x] sitemap-generate.js path fixed for ops/ subdirectory
- [x] Jaws, Lady Chatterley's Lover, No Country for Old Men greenfield pages

## Done — 2026-04-14

- [x] pipeline-guide.js — upcoming adaptations guide (3-model parallel)
- [x] upcoming-adaptations.html live
- [x] pipeline-spotlight.js — spotlight page generator
- [x] config/nav.json — single source of truth for nav
- [x] check-nav.js + fix-nav.js
- [x] pipeline-render.js — auto-copies to project root
- [x] fix-titles-book-vs-movie.js — Book vs Movie in all 162 title tags
- [x] Homepage h1 + meta updated
- [x] netlify.toml — 301 redirects for all .html URLs
- [x] Scripts reorganized — utils/, ops/, content/, reporting/
- [x] deploy.js + add-destination.js
- [x] tree.js --save flag
- [x] docs/ restructured — reference/, strategy/, research/, archive/
