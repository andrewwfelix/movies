[//]: # (Destination: docs/pipeline/completed-tasks.md)

# BooksVersusMovies.com — Completed Tasks
==========================================
Format: [YYYY-MM-DD] Description


## Section 1 — Housekeeping ✓

[2026-04-11] Established project folder structure — docs/, data/reports/, pipeline/,
             scripts/prompts/, reviews-to-review/
[2026-04-11] Renamed failures-to-reprocess/ to reviews-to-review/ (quarantine folder)
[2026-04-11] Moved to reviews-to-review/: wild.html, twilight.html, unbroken.html,
             no-country-for-old-men.html, the-goldfinch.html, ugly-love.html
[2026-04-11] Deleted spotlight.html, old metadata.csv, data/spotlight.zip
[2026-04-11] Archived legacy scripts to scripts/archive/
[2026-04-11] Created scripts/extract-metadata.js v1, updated to v2
[2026-04-11] Ran extractor — clean baseline: 163 pages, checkpoint passed
[2026-04-11] Step 1 complete ✓


## Section 2 — Content/Structure Divorce ✓

[2026-04-11] Designed canonical JSON schema — docs/review-schema.md
[2026-04-11] Created scripts/logger.js — shared pipeline logging module
[2026-04-11] Created scripts/pipeline-extract.js — HTML to JSON extractor
[2026-04-11] Fixed extractVerdictBox regex (nested div boundary)
[2026-04-11] Ran pipeline-extract.js — 163 files, 0 warnings, checkpoint passed
[2026-04-11] Added quick-answer, comparison-table, cta-block to style.css
[2026-04-11] Section 2 complete ✓


## Section 3 — Revision Pipeline ✓

[2026-04-11] Adopted pipeline-* naming convention for all production scripts
[2026-04-11] Created config/models.json — LLM model assignments factored out
[2026-04-11] Created scripts/prompts/pass1-structural.txt
[2026-04-11] Created scripts/pipeline-revise.js — OpenRouter, models.json,
             validation, checkpoint, logging, retry logic, socket timeout,
             smart skip, per-pass progress logging, quality gate integration
[2026-04-11] Created README.md — project conventions, API resilience
[2026-04-11] Created POLICIES.md — hard rules for pipeline and deployment
[2026-04-11] Single-page evaluation loop — tested atonement, big-fish ✓
[2026-04-11] Step 3.4 complete — Pass 1 full batch, 163 pages ✓

[2026-04-12] Created scripts/prompts/pass1b-titles.txt
[2026-04-12] Added titles pass to pipeline-revise.js
[2026-04-12] Ran titles pass — 163 pages via claude-sonnet-4-5
[2026-04-12] Created scripts/log-all-titles.js
[2026-04-12] Created scripts/prompts/pass2-conversion.txt
[2026-04-12] Ran Pass 2 — 163 pages, ctaBlocks populated
[2026-04-12] Created scripts/fix-cta-titles.js
[2026-04-12] Section 3 complete ✓


## Post-Revision Run 1 — April 12 2026

[2026-04-12] Fixed IN_DIR bug — titles/Pass 2 now read from 2-revised
[2026-04-12] Added 90-second socket timeout
[2026-04-12] Added per-pass progress logging (↻ prefix)
[2026-04-12] Updated metaDesc validation limit to 155 chars
[2026-04-12] Built quality-gate.js — generic phrase detector, hard failure
             vs warning, --fail-fast, --warn-only, --last N, --strict flags
[2026-04-12] Integrated quality gate into pipeline-revise.js via
             --quality-check-interval N flag
[2026-04-12] Added tie verdict guidance to pass1-structural.txt
[2026-04-12] Ran full production batch — Pass 1 + titles + Pass 2, 162 pages
[2026-04-12] Ran fix-cta-titles.js — 28 long CTA titles fixed


## Section 4 — Renderer ✓

[2026-04-13] Built scripts/pipeline-render.js — deterministic HTML renderer
[2026-04-13] Hero redesign — pageTitle hook as subtitle, subtitle-meta line
[2026-04-13] Moved quick-answer block ABOVE comparison panel (SEO fix)
[2026-04-13] Ran pipeline-render.js --all — 162 pages, checkpoint passed ✓
[2026-04-13] Built scripts/pipeline-browse.js — landing page generator
[2026-04-13] Built scripts/sitemap-generate.js
[2026-04-13] Built scripts/review-pipeline-output.js
[2026-04-13] Built scripts/export-titles.js
[2026-04-13] Built scripts/import-titles.js
[2026-04-13] Reviewed all 163 titles via CSV — trimmed 8 long titles
[2026-04-13] Section 4 complete ✓


## Section 5 — Landing Page + SEO + Tooling ✓

[2026-04-13] Landing page redesign deployed
[2026-04-13] Built get-advice.js — multi-LLM advice tool
[2026-04-13] Built evals/compare-models.js + evals/models.json
[2026-04-13] Built scripts/pipeline-auteurs.js — The Auteurs page
[2026-04-13] Added The Auteurs to nav across all pages
[2026-04-13] Established dev/main branch workflow
[2026-04-13] Added RavensEdge AI LLC footer across all pages
[2026-04-13] Created docs/ROADMAP-TECHNICAL.md
[2026-04-13] Created docs/ROADMAP-PRODUCT.md
[2026-04-13] Updated docs/business-strategy.md
[2026-04-13] Created docs/SEO-STRATEGY.md
[2026-04-13] Deployed — 162 pages + landing page + Auteurs + SEO fixes


## Section 6 — Greenfield Pipeline ✓

[2026-04-14] Built scripts/prompts/greenfield-stage1.txt
[2026-04-14] Built scripts/prompts/greenfield-stage2.txt
[2026-04-14] Built scripts/pipeline-generate.js — two-stage greenfield generator
[2026-04-14] Built scripts/validate-json-schema.js — ajv-based validator
[2026-04-14] Created data/schemas/schema-extracted.json
[2026-04-14] Created data/schemas/schema-greenfield.json
[2026-04-14] Created data/schemas/schema-revised.json
[2026-04-14] Built scripts/generate-review.js — end-to-end orchestrator
[2026-04-14] Tested full greenfield pipeline on The Godfather ✓
[2026-04-14] Tested generate-review.js end-to-end on Ghost World ✓
[2026-04-14] Section 6 complete ✓


## Section 7 — Upcoming Adaptations Guide ✓

[2026-04-14] Built scripts/pipeline-guide.js — 3-model parallel aggregation
             Grok 3 + Perplexity Sonar Pro + Gemini 2.5 Pro run in parallel
             Results merged and deduplicated by slug
             Claude Sonnet editorial pass rewrites notes field per item
             Per-item JSON files in data/guides/items/
             Raw model output in data/guides/raw/
[2026-04-14] Built scripts/prompts/guide-aggregator.txt
[2026-04-14] Created data/guides/sources.json — 10 trusted sources
[2026-04-14] Added guide + editorial entries to config/models.json
[2026-04-14] upcoming-adaptations.html live at /upcoming-adaptations
[2026-04-14] Section 7 complete ✓


## Section 8 — Spotlight Pages ✓

[2026-04-14] Built scripts/pipeline-spotlight.js — spotlight page generator
[2026-04-14] Built scripts/prompts/spotlight-page.txt
[2026-04-14] Created data/schemas/schema-spotlight.json
[2026-04-14] Added spotlight entry to config/models.json
[2026-04-14] spotlight-lonesome-dove.html generated and live
[2026-04-14] Section 8 complete ✓


## Section 9 — SEO + Nav Consistency ✓

[2026-04-14] fix-titles-book-vs-movie.js — added "Book vs Movie" to all 162 title tags
[2026-04-14] Updated pass1b-titles.txt — enforces Book vs Movie pattern going forward
[2026-04-14] pipeline-browse.js h1 updated — "Book vs Movie We Pick a Winner Every Time"
[2026-04-14] Homepage meta description updated — "book vs movie" phrase added
[2026-04-14] JSON-LD description updated — "book vs film" → "book vs movie"
[2026-04-14] Upcoming adaptations page title updated — "Book vs Movie Adaptations 2026"
[2026-04-14] Created config/nav.json — single source of truth for site navigation
[2026-04-14] All pipeline scripts updated to read nav from config/nav.json
[2026-04-14] Built scripts/ops/check-nav.js — nav consistency auditor
[2026-04-14] Built scripts/ops/fix-nav.js — fixes nav in static HTML files
[2026-04-14] pipeline-render.js — auto-copies rendered HTML to project root
[2026-04-14] netlify.toml — 301 redirects for all .html URLs to clean URLs
[2026-04-14] Section 9 complete ✓


## Section 10 — Scripts Reorganization ✓

[2026-04-14] scripts/utils/    — logger.js, validate-json-schema.js, quality-gate.js, tree.js
[2026-04-14] scripts/ops/      — check-nav.js, fix-nav.js, fix-titles-book-vs-movie.js,
                                  fix-cta-titles.js, housekeeping.js, sitemap-generate.js
[2026-04-14] scripts/content/  — generate-review.js, html-to-json.js, export/import-titles.js,
                                  generate-next-steps.js, consolidate-docs.js, log-all-titles.js
[2026-04-14] scripts/reporting/ — dashboard.js, get-advice.js, review-pipeline-output.js,
                                   get-todays-changes.js
[2026-04-14] Fixed require() paths in pipeline-render.js, pipeline-generate.js,
             scripts/content/generate-review.js after reorganization
[2026-04-14] Fixed logger.js LOGS_DIR path — was writing to scripts/logs/, now logs/
[2026-04-14] tree.js — added --save flag to write docs/project-structure.md
[2026-04-14] Section 10 complete ✓


## Section 11 — Deployment Tooling ✓

[2026-04-14] Built scripts/utils/deploy.js — reads Destination: comments,
             copies files from Downloads/files/ to correct project locations
[2026-04-14] Built scripts/utils/add-destination.js — stamps all project scripts
             with Destination: comments for use by deploy.js
[2026-04-14] docs/ reorganized — pipeline/, strategy/, research/, archive/
[2026-04-14] docs/strategy/kanban.md created with full backlog
[2026-04-14] Section 11 complete ✓


## April 15 2026

[2026-04-15] 5 spotlight pages live — lonesome-dove, fight-club, gone-girl,
             dune, the-shining
[2026-04-15] Spotlight buy buttons — terracotta → Book Wins green style
[2026-04-15] pipeline-spotlight.js — affiliate link auto-lookup from review JSON
[2026-04-15] pipeline-spotlight.js — script version metadata in HTML output
[2026-04-15] pipeline-post.js — post-processing wrapper
[2026-04-15] pipeline-greenfield.js — full orchestrator with auto-fix for long titles
[2026-04-15] pipeline-clear.js — clears pipeline outputs for a slug
[2026-04-15] archive-logs.js
[2026-04-15] sitemap-generate.js path fixed for ops/ subdirectory
[2026-04-15] Jaws, Lady Chatterley's Lover, No Country for Old Men greenfield pages


## April 17 2026

[2026-04-17] SEO titles, meta, oneLineReasons updated — Sonnet review pass (171 pages)
[2026-04-17] seo-metadata-export.js + seo-metadata-import.js built (scripts/utils/)
[2026-04-17] tree-code.js + tree-text.js built (scripts/utils/)
[2026-04-17] consolidate-docs.js — flexible folder consolidation (scripts/content/)
[2026-04-17] consistency-audit.js — 8-check site audit script (scripts/utils/)
[2026-04-17] fix-related-cards.js — fixed 55 broken related card slugs (scripts/utils/)
[2026-04-17] featured.html hub page live — Reminders of Him as hero, 6 spotlights
[2026-04-17] spotlight-reminders-of-him.html — New Release Spotlight live
[2026-04-17] pipeline-pillar.js + pipeline-pillar-render.js built
[2026-04-17] config/pillars.json — 10 pillars configured
[2026-04-17] 10 pillar pages live and indexed in GSC
[2026-04-17] pipeline-guide.js — fixed _destination JSON bug in --render-only mode
[2026-04-17] check-nav.js ROOT path fixed
[2026-04-17] sitemap-generate.js — auto-discovers pillar pages + all static pages
             Total URLs now: 191 (171 reviews + 10 pillars + 10 static)
[2026-04-17] Nav fixed across all pages — Featured → /featured
[2026-04-17] Beehiiv newsletter embed integrated into all review pages via pipeline-render.js
[2026-04-17] Fight Club newsletter email written and staged in Beehiiv
[2026-04-17] Beehiiv form tested — subscriber confirmed in dashboard
[2026-04-17] Newsletter send held pending DNS/custom domain setup
[2026-04-17] docs/team/ created — onboarding.md, tasks.md, affiliate-links.md,
             onboarding-prep.md, job-rec-content-researcher.md
[2026-04-17] Greenfield JSONs ready: Blade Runner, Shawshank Redemption, Arrival


## Current State

DEPLOYED ✓ — April 17 2026
191 URLs in sitemap:
  - 171 review pages
  - 10 pillar pages
  - 10 static pages (spotlights, featured, upcoming, auteurs, about)
Newsletter: Beehiiv embed live on all pages, first subscriber confirmed
Team docs: onboarding pack ready in docs/team/
GSC: 10 pillar pages indexed, impressions growing (286/day as of April 15)


## Next Steps — Highest Priority

  1. Add hyperlinks from pillar pages to individual review pages
  2. Beehiiv DNS / custom domain setup
  3. Beehiiv welcome email for new subscribers
  4. Fill affiliate links for Blade Runner, Shawshank, Arrival greenfields
  5. llm-client.js — shared LLM client before next big batch
  6. Email capture — ConvertKit setup + opt-in form
  7. /how-we-judge page
  8. Recently added section on browse/index page
