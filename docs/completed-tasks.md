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
[2026-04-11] Created config/models.json — LLM model assignments factored out of scripts
[2026-04-11] Created scripts/prompts/pass1-structural.txt
[2026-04-11] Created scripts/pipeline-revise.js — OpenRouter, models.json, validation,
             checkpoint, logging, retry logic, socket timeout, smart skip,
             per-pass progress logging, quality gate integration
[2026-04-11] Created README.md — project conventions, API resilience best practices
[2026-04-11] Created POLICIES.md — hard rules for pipeline and deployment
[2026-04-11] Single-page evaluation loop — tested atonement, big-fish, normal-people ✓
[2026-04-11] Step 3.4 complete — Pass 1 full batch, 163 pages ✓

[2026-04-12] Created scripts/prompts/pass1b-titles.txt — emotional resonance,
             provocative tone guidance, TITLE_ANCHOR, gold standard examples,
             iterated through 4 prompt versions
[2026-04-12] Added titles pass to pipeline-revise.js — Sonnet model, small payload,
             before/after logging, titles-review-YYYY-MM-DD.txt written to logs/
[2026-04-12] Ran titles pass — 163 pages via claude-sonnet-4-5
[2026-04-12] Created scripts/log-all-titles.js — sanity check utility
[2026-04-12] Created scripts/prompts/pass2-conversion.txt
[2026-04-12] Ran Pass 2 — 163 pages, ctaBlocks populated
[2026-04-12] Created scripts/fix-cta-titles.js — fixes long after-verdict CTA text
[2026-04-12] Step 3.5 complete — all three passes across 163 pages ✓
[2026-04-12] Section 3 complete ✓


## Post-Revision Run 1 — April 12 2026

[2026-04-12] Discovered IN_DIR bug — titles/Pass 2 reading from 1-extracted
             instead of 2-revised, causing quickAnswer to be overwritten as null
[2026-04-12] Fixed IN_DIR — Pass 1 reads 1-extracted, titles/Pass 2 read 2-revised
[2026-04-12] Fixed const ordering (EXTRACTED_DIR defined before IN_DIR)
[2026-04-12] Added 90-second socket timeout to prevent indefinite hangs
[2026-04-12] Added per-pass progress logging (↻ prefix)
[2026-04-12] Updated metaDesc validation limit from 160 to 155 chars
[2026-04-12] Built quality-gate.js — generic phrase detector, hard failure vs warning,
             --fail-fast, --warn-only, --last N, --strict flags
[2026-04-12] Integrated quality gate into pipeline-revise.js via
             --quality-check-interval N flag
[2026-04-12] Added tie verdict guidance to pass1-structural.txt
[2026-04-12] Ran full production batch — Pass 1 + titles + Pass 2, 162 pages
             Quality gate fired at pages 10, 125, 150 — all resolved
[2026-04-12] Ran fix-cta-titles.js — 28 long CTA titles fixed


## Section 4 — Renderer ✓

[2026-04-13] Built scripts/pipeline-render.js — deterministic HTML renderer
             canonical tags, root-relative paths, quick-answer, CTA blocks,
             FAQ schema, Review schema, character table, differences, related cards
[2026-04-13] Fixed checkpoint to read HTML from disk rather than memory
[2026-04-13] Redesigned hero section:
             - pageTitle hook as subtitle (title prefix stripped)
             - subtitle-meta for factual book/year/director line
             - genre moved from hero to meta strip
             - h1 font size reduced, subtitle size increased to 1.5rem Playfair
             - hero padding reduced
[2026-04-13] Ran pipeline-render.js --all — 162 pages, checkpoint passed ✓
[2026-04-13] Built scripts/pipeline-browse.js — index.html generator with
             client-side verdict filter, stats, extensionless links, tagline
             "Read it or watch it. We'll tell you which comes first."
[2026-04-13] Built scripts/sitemap-generate.js — sitemap.xml generator
[2026-04-13] Built scripts/review-pipeline-output.js — tabular QA summary
[2026-04-13] Built scripts/export-titles.js — export slug/title/meta/reason to CSV
[2026-04-13] Built scripts/import-titles.js — import revised titles from CSV to JSON
[2026-04-13] Reviewed all 163 titles via CSV — trimmed 8 long titles manually
[2026-04-13] Fixed my-sisters-keeper, the-maze-runner (encoding + generic title)
[2026-04-13] Quarantined the-maze-runner.html (duplicate of the-maze-runner-film)
[2026-04-13] Section 4 complete ✓


## Documentation Created

[2026-04-11] docs/action-plan.txt
[2026-04-11] docs/pipeline-notes.md
[2026-04-11] docs/project-objectives.md
[2026-04-11] docs/business-strategy.md — updated April 13 with business action roadmap
[2026-04-11] docs/review-schema.md
[2026-04-11] docs/completed-tasks.md
[2026-04-13] docs/SEO-STRATEGY.md
[2026-04-13] docs/POLICIES.md
[2026-04-13] docs/pipeline-init.md — algorithm design for project template bootstrapper
[2026-04-13] docs/ROADMAP-TECHNICAL.md
[2026-04-13] docs/ROADMAP-PRODUCT.md
[2026-04-13] README.md — conventions, API resilience, environment config


## Version Control

[2026-04-11] Committed full project restructure
[2026-04-11] Committed README, models config, pipeline-revise with OpenRouter
[2026-04-12] Committed titles pass, log-all-titles, models update
[2026-04-12] Committed Pass 2, fix-cta-titles, retry logic, smart skip
[2026-04-13] Committed quality gate, export/import titles, roadmaps, browse generator
[2026-04-13] Committed final deploy — hero redesign, nav cleanup, sitemap


---
## Current Step

DEPLOYED ✓ — April 13 2026
162 pages live at booksversusmovies.com
Sitemap submitted to Google Search Console

Tomorrow — highest priority:
  1. Featured/spotlight section on browse page (config/featured.json)
  2. Priority/hype field in JSON schema (controls browse order + model assignment)
  3. Design greenfield process document (Step 5 prep)
  4. Build pipeline-generate.js (Step 5)
