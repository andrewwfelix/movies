[//]: # (Destination: docs/pipeline/completed-tasks.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, dates YYYY-MM-DD, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Completed Tasks
Last updated: 2026-04-19
Format: [YYYY-MM-DD] Description — one entry per task

---

## Section 1 — Housekeeping (done 2026-04-11)

- [2026-04-11] Established project folder structure — docs/, data/reports/, pipeline/, scripts/prompts/, reviews-to-review/
- [2026-04-11] Renamed failures-to-reprocess/ to reviews-to-review/ (quarantine folder)
- [2026-04-11] Moved to reviews-to-review/: wild.html, twilight.html, unbroken.html, no-country-for-old-men.html, the-goldfinch.html, ugly-love.html
- [2026-04-11] Deleted spotlight.html, old metadata.csv, data/spotlight.zip
- [2026-04-11] Archived legacy scripts to scripts/archive/
- [2026-04-11] Created scripts/extract-metadata.js v1, updated to v2
- [2026-04-11] Ran extractor — clean baseline: 163 pages, checkpoint passed

---

## Section 2 — Content/Structure Divorce (done 2026-04-11)

- [2026-04-11] Designed canonical JSON schema — docs/review-schema.md
- [2026-04-11] Created scripts/logger.js — shared pipeline logging module
- [2026-04-11] Created scripts/pipeline-extract.js — HTML to JSON extractor
- [2026-04-11] Fixed extractVerdictBox regex (nested div boundary)
- [2026-04-11] Ran pipeline-extract.js — 163 files, 0 warnings, checkpoint passed
- [2026-04-11] Added quick-answer, comparison-table, cta-block to style.css

---

## Section 3 — Revision Pipeline (done 2026-04-12)

- [2026-04-11] Adopted pipeline-* naming convention for all production scripts
- [2026-04-11] Created config/models.json — LLM model assignments factored out
- [2026-04-11] Created scripts/prompts/pass1-structural.txt
- [2026-04-11] Created scripts/pipeline-revise.js — OpenRouter, models.json, validation, checkpoint, logging, retry logic, socket timeout, smart skip, quality gate integration
- [2026-04-11] Created README.md — project conventions, API resilience
- [2026-04-11] Created POLICIES.md — hard rules for pipeline and deployment
- [2026-04-12] Created scripts/prompts/pass1b-titles.txt
- [2026-04-12] Added titles pass to pipeline-revise.js
- [2026-04-12] Ran titles pass — 163 pages via claude-sonnet-4-5
- [2026-04-12] Created scripts/prompts/pass2-conversion.txt
- [2026-04-12] Ran Pass 2 — 163 pages, ctaBlocks populated
- [2026-04-12] Fixed IN_DIR bug — titles/Pass 2 now read from 2-revised
- [2026-04-12] Added 90-second socket timeout
- [2026-04-12] Built quality-gate.js — generic phrase detector, hard failure vs warning
- [2026-04-12] Integrated quality gate into pipeline-revise.js via --quality-check-interval N flag
- [2026-04-12] Ran full production batch — Pass 1 + titles + Pass 2, 162 pages

---

## Section 4 — Renderer (done 2026-04-13)

- [2026-04-13] Built scripts/pipeline-render.js — deterministic HTML renderer
- [2026-04-13] Hero redesign — pageTitle hook as subtitle, subtitle-meta line
- [2026-04-13] Moved quick-answer block above comparison panel (SEO fix)
- [2026-04-13] Ran pipeline-render.js --all — 162 pages, checkpoint passed
- [2026-04-13] Built scripts/pipeline-browse.js — landing page generator
- [2026-04-13] Built scripts/sitemap-generate.js
- [2026-04-13] Built scripts/export-titles.js + import-titles.js
- [2026-04-13] Reviewed all 163 titles via CSV — trimmed 8 long titles

---

## Section 5 — Landing Page + SEO + Tooling (done 2026-04-13)

- [2026-04-13] Landing page redesign deployed
- [2026-04-13] Built get-advice.js — multi-LLM advice tool
- [2026-04-13] Built scripts/pipeline-auteurs.js — The Auteurs page
- [2026-04-13] Established dev/main branch workflow
- [2026-04-13] Created docs/ROADMAP-TECHNICAL.md, docs/ROADMAP-PRODUCT.md
- [2026-04-13] Deployed — 162 pages + landing page + Auteurs + SEO fixes

---

## Section 6 — Greenfield Pipeline (done 2026-04-14)

- [2026-04-14] Built scripts/pipeline-generate.js — two-stage greenfield generator
- [2026-04-14] Built scripts/validate-json-schema.js — ajv-based validator
- [2026-04-14] Created data/schemas/schema-extracted.json, schema-greenfield.json, schema-revised.json
- [2026-04-14] Built scripts/generate-review.js — end-to-end orchestrator
- [2026-04-14] Tested full greenfield pipeline on The Godfather and Ghost World

---

## Section 7 — Upcoming Adaptations Guide (done 2026-04-14)

- [2026-04-14] Built scripts/pipeline-guide.js — 3-model parallel aggregation (Grok + Perplexity + Gemini)
- [2026-04-14] Built scripts/prompts/guide-aggregator.txt
- [2026-04-14] Created data/guides/sources.json — 10 trusted sources
- [2026-04-14] upcoming-adaptations.html live at /upcoming-adaptations

---

## Section 8 — Spotlight Pages (done 2026-04-14)

- [2026-04-14] Built scripts/pipeline-spotlight.js — spotlight page generator
- [2026-04-14] Created data/schemas/schema-spotlight.json
- [2026-04-14] spotlight-lonesome-dove.html generated and live

---

## Section 9 — SEO + Nav Consistency (done 2026-04-14)

- [2026-04-14] fix-titles-book-vs-movie.js — added "Book vs Movie" to all 162 title tags
- [2026-04-14] Created config/nav.json — single source of truth for site navigation
- [2026-04-14] Built scripts/ops/check-nav.js — nav consistency auditor
- [2026-04-14] Built scripts/ops/fix-nav.js — fixes nav in static HTML files
- [2026-04-14] pipeline-render.js — auto-copies rendered HTML to project root
- [2026-04-14] netlify.toml — 301 redirects for all .html URLs to clean URLs

---

## Section 10 — Scripts Reorganization (done 2026-04-14)

- [2026-04-14] Reorganized scripts/ into utils/, ops/, content/, reporting/
- [2026-04-14] Fixed require() paths after reorganization
- [2026-04-14] tree.js — added --save flag to write docs/project-structure.md

---

## Section 11 — Deployment Tooling (done 2026-04-14)

- [2026-04-14] Built scripts/utils/deploy.js — reads Destination: comments, copies files
- [2026-04-14] Built scripts/utils/add-destination.js — stamps scripts with Destination: comments
- [2026-04-14] docs/ reorganized — pipeline/, strategy/, research/, archive/

---

## 2026-04-15

- [2026-04-15] 5 spotlight pages live — lonesome-dove, fight-club, gone-girl, dune, the-shining
- [2026-04-15] Spotlight buy buttons — terracotta → Book Wins green style
- [2026-04-15] pipeline-spotlight.js — affiliate link auto-lookup from review JSON
- [2026-04-15] pipeline-post.js — post-processing wrapper
- [2026-04-15] pipeline-greenfield.js — full orchestrator with auto-fix for long titles
- [2026-04-15] pipeline-clear.js — clears pipeline outputs for a slug
- [2026-04-15] archive-logs.js
- [2026-04-15] sitemap-generate.js path fixed for ops/ subdirectory
- [2026-04-15] Jaws, Lady Chatterley's Lover, No Country for Old Men greenfield pages live

---

## 2026-04-17

- [2026-04-17] SEO titles, meta, oneLineReasons updated — Sonnet review pass (171 pages)
- [2026-04-17] seo-metadata-export.js + seo-metadata-import.js built (scripts/utils/)
- [2026-04-17] tree-code.js + tree-text.js built (scripts/utils/)
- [2026-04-17] consolidate-docs.js — flexible folder consolidation (scripts/content/)
- [2026-04-17] consistency-audit.js — 8-check site audit (scripts/utils/)
- [2026-04-17] fix-related-cards.js — fixed 55 broken related card slugs (scripts/utils/)
- [2026-04-17] featured.html hub page live — Reminders of Him as hero, 6 spotlights
- [2026-04-17] spotlight-reminders-of-him.html — New Release Spotlight live
- [2026-04-17] pipeline-pillar.js + pipeline-pillar-render.js built
- [2026-04-17] config/pillars.json — 10 pillars configured
- [2026-04-17] 10 pillar pages live and indexed in GSC
- [2026-04-17] pipeline-guide.js — fixed _destination JSON bug in --render-only mode
- [2026-04-17] check-nav.js ROOT path fixed
- [2026-04-17] sitemap-generate.js — auto-discovers pillar pages + all static pages (191 URLs)
- [2026-04-17] Nav fixed across all pages — Featured → /featured
- [2026-04-17] Beehiiv newsletter embed integrated into all review pages via pipeline-render.js
- [2026-04-17] Fight Club newsletter email written and staged in Beehiiv
- [2026-04-17] Beehiiv form tested — first subscriber confirmed
- [2026-04-17] Newsletter send held pending DNS/custom domain setup
- [2026-04-17] docs/team/ created — onboarding.md, tasks.md, affiliate-links.md, onboarding-prep.md, job-rec-content-researcher.md
- [2026-04-17] Dashboard live at /dashboard — GSC analytics, light color scheme
- [2026-04-17] dashboard/latest.json + dashboard.schema.json
- [2026-04-17] Greenfield JSONs ready: Blade Runner, Shawshank Redemption, Arrival

---

## 2026-04-18

- [2026-04-18] Homepage restructured — compact hero, stats strip, book covers above fold
- [2026-04-18] style.css updated — Grok card improvements, verdict badge overlays on covers, bigger CTA button, box-shadow cards, 265px cover images
- [2026-04-18] pipeline-browse.js — Grok structure adopted, DEFAULT_FEATURED data-driven from GA4+GSC scores
- [2026-04-18] featured.html — rebuilt with emotional spotlights first, prestige second
- [2026-04-18] Spotlight prompt upgraded — intent-aware, emotional-engine required section, search intent mode, no-markdown rule
- [2026-04-18] pipeline-spotlight.js — upgraded: Sonnet model, REVISED_DIR slug injection, relatedSlugs truncation to 6, renderParagraphs markdown-to-HTML, renderRelated reads from REVISED_DIR + links to spotlight URLs
- [2026-04-18] 5 new spotlight pages generated — it-ends-with-us, normal-people, the-fault-in-our-stars, where-the-crawdads-sing, a-little-life
- [2026-04-18] 6 existing spotlights regenerated with new intent-aware prompt
- [2026-04-18] admin/import-gsc.js — handles hourly Time column, aggregates by date, reads/writes from dashboard-data/ directly
- [2026-04-18] dashboard-data/ restructured — gsc-24-hour.json, gsc-03-month.json
- [2026-04-18] Public /dashboard (analytics only) and full /admin (5 tabs) split
- [2026-04-18] intent-aware-spotlights branch merged to main and deleted
- [2026-04-18] render-spotlights.js and related-graph.json deleted (over-engineered)
- [2026-04-18] scripts/supabase/setup-phase1.sql — complete Phase 1 schema with CHECK constraints, indexes, RLS policies, updated_at triggers, table comments
- [2026-04-18] docs/brainstorming/vercel/vercel-phase1-plan.md — updated with Grok review, sprint order, Phase 1.5 site_config table design
- [2026-04-18] GA4 pages scored by views+engagement — data-driven featured order established
- [2026-04-18] GSC 24-hour: 18 clicks, 417 impressions, Reminders of Him 9.76% CTR pos 8.1
- [2026-04-18] git cleanup — all feature branches deleted, main is clean and pushed

---

## 2026-04-19

- [2026-04-19] SEO multi-model review pipeline complete — seo-llm-review.js, seo-llm-apply.js, seo-llm-import.js
- [2026-04-19] 171 pages scored by Claude Sonnet 4.5, Gemini 2.5 Pro, Grok-3 — 28 high, 135 medium, 8 low priority
- [2026-04-19] seo-llm-apply.js — null guard fix for missing Gemini data on 41 pages
- [2026-04-19] 162 pages adjudicated by Claude, new titles and metas accepted
- [2026-04-19] Reminders of Him intentionally excluded from import (top performer, 8.84% CTR)
- [2026-04-19] 162 pages re-rendered and deployed to production with new titles/metas
- [2026-04-19] Gone Girl title: "Pike's Face vs Flynn's Mind" — live
- [2026-04-19] Ender's Game title fixed — was truncated with ellipsis, now clean 51 chars
- [2026-04-19] Google Cloud project ravensedge-bvm created under andrew@ravensedge.ai
- [2026-04-19] Google Cloud service account ravens-api created
- [2026-04-19] GSC API and GA4 API enabled on ravensedge-bvm project
- [2026-04-19] Credentials saved to config/ravensedge-bvm.json (gitignored)
- [2026-04-19] .env updated — GOOGLE_APPLICATION_CREDENTIALS=./config/ravensedge-bvm.json
- [2026-04-19] scripts/analyze-gsc-morning.js — working, pulls 28-day + 7-day + 24-hour GSC data + sitemap index + LLM analysis via OpenRouter
- [2026-04-19] gsc-prompt.txt updated — site context block added, sitemap unreliability noted, prevents recommending already-done work
- [2026-04-19] config/gsc-analysis.json — updated periods (28days/7days/24hours), model claude-sonnet-4-5, maxTokens 4000
- [2026-04-19] admin/index.html — SEO Review Tab (Tab 6) added, sortable/filterable table, click-to-expand model suggestions
- [2026-04-19] admin/index.html — chart updated to use gsc-03-month.json for trend line
- [2026-04-19] admin/index.html — Project and Decisions tabs show graceful error when JSON files missing
- [2026-04-19] admin/index.html — arrow removed from Best Suggestion column
- [2026-04-19] GSC URL Inspection — reminders-of-him.html confirmed NOT indexed, canonical clean
- [2026-04-19] GSC URL Inspection — reminders-of-him confirmed indexed with valid FAQPage schema
- [2026-04-19] Schema v3.1 designed — multi-model review (Claude, ChatGPT, Gemini, Perplexity, DeepSeek)
- [2026-04-19] data/schemas/schema-revised-v3.1.json — complete schema document with _rules block
- [2026-04-19] docs/strategy/seo-lessons-learned.md — three-phase SEO lessons learned document
- [2026-04-19] docs/strategy/seo-greenfield.md — client-facing greenfield site guide
- [2026-04-19] docs/strategy/seo-pipeline-gameplan.md — multi-model pipeline philosophy document
- [2026-04-19] scripts/utils/schema-migrate.js — reads pipeline/2-revised/, writes to pipeline/2-revised-v31/ with null v3.1 fields. Run complete (171 pages).
- [2026-04-19] scripts/utils/seo-llm-fullpage.js — 7-call per-page v3.1 field generator. Per-call model config, separate input/output dirs, inline verification, 0-tolerance failure threshold, --dev/--force/--slug/--limit flags
- [2026-04-19] config/seo-review.json — updated with fullpage.calls section, per-call prod/dev model config
- [2026-04-19] pipeline/2-revised/ and pipeline/1-extracted/ added to git tracking (removed from .gitignore)
- [2026-04-19] Branch schema-v31-migration-2 created off main for v3.1 migration work
- [2026-04-19] schema-migrate.js run — 171 pages migrated to pipeline/2-revised-v31/
- [2026-04-19] seo-llm-fullpage.js dev run in progress — stopped at page 52/171 (hannibal-series call 5 verification failure, fix applied)
- [2026-04-19] Three verification bugs caught and fixed during dev run: N/A table check, H2 title word-level matching, callNums missing Call 7
- [2026-04-19] docs/session-handoff.md — comprehensive session handoff document created

---

## Current State

Status: v3.1 migration in progress on schema-v31-migration-2 branch
Date: 2026-04-19
Branch: schema-v31-migration-2
Pages: 191 URLs in sitemap (171 reviews + 10 pillars + 10 static)
Pipeline/2-revised: 162 pages with new titles/metas, deployed
Pipeline/2-revised-v31: 171 pages migrated with null v3.1 fields
Pipeline/2-revised-v31-haiku: 51 pages complete, stopped at page 52
GSC: 13 clicks, 306 impressions, 3.28% CTR, avg position 26.8 (28-day)
Top performer: Reminders of Him — 8.84% CTR, position 8.29
