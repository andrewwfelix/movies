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
             canonical tags, root-relative paths, quick-answer above fold,
             CTA blocks, FAQ schema, Review schema, character table,
             differences, related cards
[2026-04-13] Hero redesign:
             - pageTitle hook as subtitle (title prefix stripped)
             - subtitle-meta for factual book/year/director line
             - genre moved from hero to meta strip
             - h1 font size reduced, subtitle 1.5rem Playfair italic
             - hero padding reduced
[2026-04-13] Moved quick-answer block ABOVE comparison panel (SEO fix)
[2026-04-13] Restructured quick-answer: Key Difference full-width on top,
             Best Version + Read First below as centered flex pair
[2026-04-13] Removed CTA button from quick-answer block
[2026-04-13] Removed max-width from quick-answer, body-text,
             comparison-table, cta-block
[2026-04-13] Ran pipeline-render.js --all — 162 pages, checkpoint passed ✓
[2026-04-13] Built scripts/pipeline-browse.js — landing page generator:
             hero, trust strip, spotlight (6 curated cards), verdict filters,
             year-descending sort, matched image heights
[2026-04-13] Built scripts/sitemap-generate.js
[2026-04-13] Built scripts/review-pipeline-output.js
[2026-04-13] Built scripts/export-titles.js
[2026-04-13] Built scripts/import-titles.js
[2026-04-13] Reviewed all 163 titles via CSV — trimmed 8 long titles
[2026-04-13] Fixed my-sisters-keeper, the-maze-runner (encoding + generic)
[2026-04-13] Quarantined the-maze-runner.html (duplicate of film version)
[2026-04-13] Section 4 complete ✓


## Section 5 — Landing Page + SEO + Tooling ✓

[2026-04-13] Landing page redesign deployed:
             - "Book or Movie? We Pick a Winner." hero
             - Trust strip (4 credibility signals)
             - Spotlight section — 6 curated cards with oneLineReason hooks
             - DEFAULT_FEATURED: verity, reminders-of-him, dune,
               the-shining, gone-girl, atonement
             - Verdict filters with counts
             - Year-descending sort (most recent first)
[2026-04-13] Built get-advice.js — multi-LLM advice tool
             config/advice.json (Sonnet, Grok, Perplexity)
             advice/inputs/, advice/outputs/
[2026-04-13] Built evals/compare-models.js + evals/models.json
[2026-04-13] Built scripts/pipeline-auteurs.js — The Auteurs page
             Auto-generates director profiles via Sonnet from site data
             Single page: table + critical bios
             data/auteurs.json for editorial review
[2026-04-13] Added The Auteurs to nav across all pages
[2026-04-13] Established dev/main branch workflow
[2026-04-13] Added RavensEdge AI LLC footer across all pages
[2026-04-13] Created docs/ROADMAP-TECHNICAL.md
[2026-04-13] Created docs/ROADMAP-PRODUCT.md
[2026-04-13] Updated docs/business-strategy.md with business action roadmap
[2026-04-13] Created docs/SEO-STRATEGY.md
[2026-04-13] Deployed — 162 pages + landing page + Auteurs + SEO fixes


## Section 6 — Greenfield Pipeline ✓

[2026-04-14] Built scripts/prompts/greenfield-stage1.txt — factual extraction
[2026-04-14] Built scripts/prompts/greenfield-stage2.txt — editorial generation
[2026-04-14] Built scripts/pipeline-generate.js — two-stage greenfield generator
             Stage 1: Haiku extracts metadata
             Stage 2: Sonnet/Haiku generates full review JSON
             jsonrepair for robust JSON parsing
             Content validation before write
[2026-04-14] Built scripts/validate-json-schema.js — ajv-based validator
             Supports --schema extracted | greenfield | revised
[2026-04-14] Created data/schemas/schema-extracted.json
[2026-04-14] Created data/schemas/schema-greenfield.json
[2026-04-14] Created data/schemas/schema-revised.json
[2026-04-14] Installed jsonrepair, ajv npm packages
[2026-04-14] Built scripts/generate-review.js — end-to-end orchestrator
             Steps 1-10: validate → image check → stage1 → review pause
             → stage2 → titles → pass2 → schema validate → render → copy
[2026-04-14] Created docs/greenfield-happy-path.txt
[2026-04-14] Tested full greenfield pipeline on The Godfather ✓
[2026-04-14] Tested generate-review.js end-to-end on Ghost World ✓
             Both pages live at booksversusmovies.com
[2026-04-14] Section 6 complete ✓


## Documentation

[2026-04-11] docs/action-plan.txt
[2026-04-11] docs/pipeline-notes.md
[2026-04-11] docs/project-objectives.md
[2026-04-11] docs/business-strategy.md — updated with business action roadmap
[2026-04-11] docs/review-schema.md
[2026-04-13] docs/SEO-STRATEGY.md
[2026-04-13] docs/POLICIES.md — updated with output directory policy
[2026-04-13] docs/pipeline-init.md
[2026-04-13] docs/ROADMAP-TECHNICAL.md
[2026-04-13] docs/ROADMAP-PRODUCT.md
[2026-04-14] docs/greenfield-happy-path.txt
[2026-04-14] README.md


---
## Current State

DEPLOYED ✓ — April 14 2026
164 pages live (162 revised + The Godfather + Ghost World)
Full greenfield pipeline operational
generate-review.js — single command end-to-end generation


## Next Steps — Highest Priority

  1. Build llm-client.js — shared LLM client before Film Wins batch
     (see new-ideas.md for full spec)
  2. Film Wins batch — 10 new greenfield pages:
     Godfather (done), Jaws, Blade Runner, Shawshank Redemption,
     Arrival, Children of Men, Stand By Me, The Departed,
     No Country for Old Men, Apocalypse Now
  3. Add oneLineReason to browse rows
  4. Request indexing for top 20 GSC impression pages
  5. Email capture — ConvertKit setup + opt-in form
  6. Genre hub pages (/thriller, /romance, /literary-fiction)
  7. Author hub pages (Colleen Hoover, Gillian Flynn, Stephen King)
  8. WebP conversion for book cover images
  9. Priority/hype field in JSON schema
