# BooksVersusMovies.com — Completed Tasks
==========================================
Format: [YYYY-MM-DD] Description


## Section 1 — Housekeeping ✓

[2026-04-11] Established project folder structure — docs/, data/reports/, pipeline/,
             scripts/prompts/, reviews-to-review/
[2026-04-11] Renamed failures-to-reprocess/ to reviews-to-review/ (quarantine folder)
[2026-04-11] Moved to reviews-to-review/: wild.html (placeholder related card slugs),
             twilight.html and unbroken.html (v1 generation, missing FAQ and char table),
             no-country-for-old-men.html and the-goldfinch.html (placeholder related
             card slugs), ugly-love.html (missing related cards)
[2026-04-11] Deleted spotlight.html (was index page feature, not a review page),
             old metadata.csv (superseded), data/spotlight.zip
[2026-04-11] Archived legacy scripts to scripts/archive/: audit-reviews.js, fix-all.js,
             rebuild-metadata.js, site-survey.js, script-fix-paths.js
[2026-04-11] Created scripts/extract-metadata.js v1 — initial metadata extractor
[2026-04-11] Updated to v2 — added: series page detection (director optional for series),
             non-standard book year handling (e.g. "800 BC"), TBA film year support,
             placeholder related card detection, checkpoint validation block,
             quarantine candidate mv commands in console output
[2026-04-11] Ran extractor — clean baseline: 163 pages, all v2, checkpoint passed,
             0 problematic files
[2026-04-11] Step 1 complete ✓


## Section 2 — Content/Structure Divorce ✓

[2026-04-11] Designed canonical JSON schema — docs/review-schema.md defines all fields,
             null conventions for quickAnswer/ctaBlocks, paragraph separator rules,
             bookCoverImage filename-only convention, pipelineVersion field
[2026-04-11] Created scripts/logger.js — shared pipeline logging module used by all
             pipeline scripts; writes timestamped log files to logs/, captures warnings,
             errors, checkpoint results, elapsed time
[2026-04-11] Created scripts/pipeline-extract.js — extracts all content from HTML into
             canonical JSON; handles char tables, differences, FAQ, story brief,
             read first, verdict box, related cards, affiliate links, YouTube IDs;
             includes checkpoint validation and per-file warning system
[2026-04-11] Fixed extractVerdictBox regex — original matched first </div> (inner
             verdict-title div), not outer verdict-box; fixed to search for <p> directly
[2026-04-11] Ran pipeline-extract.js — 163 files, 0 warnings, checkpoint passed clean
[2026-04-11] Added three new CSS components to style.css:
             .quick-answer — three-column grid (winner, read first, one-line reason)
             .comparison-table — ink header, alternating rows, for feature comparisons
             .cta-block — flex row with italic context text + gold button, stacks mobile
[2026-04-11] Section 2 complete ✓


## Section 3 — Revision Pipeline ✓

[2026-04-11] Adopted pipeline-* naming convention for all production scripts
[2026-04-11] Created config/models.json — LLM model assignments, temperatures, and
             max tokens factored out of scripts; supports env var overrides
[2026-04-11] Created scripts/prompts/pass1-structural.txt — derives quickAnswer from
             existing verdict/readFirst prose; constrains oneLineReason to 12 words;
             explicitly lists all immutable fields
[2026-04-11] Created scripts/pipeline-revise.js — OpenRouter API integration, reads
             config/models.json, loads prompts, validates immutable fields post-revision,
             logs via logger.js, checkpoint block
[2026-04-11] Created README.md — project conventions, naming rules, pipeline
             architecture, config documentation, prompt versioning workflow,
             checkpoint policy, deployment checklist, key decisions log
[2026-04-11] Single-page evaluation loop — tested Pass 1 on atonement, big-fish,
             normal-people; output quality confirmed across all verdict types
[2026-04-11] Ran full batch Pass 1 — 163 pages, 7 truncation errors resolved by
             increasing maxTokens to 6000 in config/models.json
[2026-04-11] Step 3.4 complete ✓

[2026-04-12] Created scripts/prompts/pass1b-titles.txt — title and meta description
             optimisation prompt; anchors to oneLineReason field; emotional resonance
             and provocation guidance; gold standard examples; verdict-specific tone
[2026-04-12] Updated pipeline-revise.js — added titles pass (pass1b), buildTitlesPayload
             sends small focused payload to reduce truncation risk, TITLE_ANCHOR field
             prominently surfaces oneLineReason, before/after logging in console and log,
             dedicated titles-review-YYYY-MM-DD.txt written to logs/ after titles runs,
             validateTitles warns vs errors on length (65 target, 75 hard limit)
[2026-04-12] Iterated pass1b-titles.txt through 4 prompt versions — added provocative
             tone guidance for clear verdicts, emotionally specific guidance for ties,
             TITLE_ANCHOR emphasis, gold standard examples specific to Atonement
[2026-04-12] Ran full batch titles pass — 163 pages via claude-sonnet-4-5, ~$0.85
             6 pages over 65 char target re-run, 2 manually trimmed:
             the-pillars-of-the-earth and water-for-elephants edited directly in JSON
[2026-04-12] Created scripts/log-all-titles.js — sanity check utility; prints slug:
             title for all 163 pages; flags titles over target/hard limit; --warn-only
             and --out flags
[2026-04-12] Titles pass complete across all 163 pages ✓
[2026-04-12] Step 3.5 in progress — Pass 2 conversion prompt next


## Documentation

[2026-04-11] Created docs/action-plan.txt
[2026-04-11] Created docs/pipeline-notes.md
[2026-04-11] Created docs/project-objectives.md
[2026-04-11] Created docs/business-strategy.md
[2026-04-11] Created docs/llm-strategy.md (shelved — superseded by business-strategy.md)
[2026-04-11] Created docs/completed-tasks.md
[2026-04-11] Created docs/review-schema.md


## Utility Scripts

[2026-04-11] Created scripts/tree.js
[2026-04-11] Created scripts/generate-next-steps.js v2
[2026-04-12] Created scripts/log-all-titles.js


## Version Control

[2026-04-11] Committed and pushed full project restructure
[2026-04-11] Committed README, models config, pipeline-revise with OpenRouter
[2026-04-12] Committed titles pass — pipeline-revise, pass1b-titles, models, log-all-titles


---
## Current Step

Step 3.5 — Write pass2-conversion.txt (Pass 2 prompt)
Next: extend pipeline-revise.js for Pass 2, test on single page, run full batch


## Post-Revision Run 2 — April 13 2026

[2026-04-13] Completed full pipeline run — all 163 pages through Pass 1 + titles + Pass 2
             Models: claude-haiku-4-5 (Pass 1/2), claude-sonnet-4-5 (titles)
             Quality gate fired at pages 10, 125, 150 — all resolved
             Hard stops: about-a-boy (generic oneLineReason), the-glass-castle
             (title over limit — stale data), the-sisterhood (title over limit)
[2026-04-13] Added tie verdict guidance to pass1-structural.txt — prevents
             generic hedging on Too Close to Call verdicts
[2026-04-13] Added socket timeout (90s) to callOpenRouter — prevents indefinite
             hang when connection drops mid-response
[2026-04-13] Added per-pass progress logging (↻ prefix) to pipeline-revise.js
[2026-04-13] Fixed IN_DIR bug — titles/Pass 2 now read from 2-revised not 1-extracted
[2026-04-13] Fixed const ordering (EXTRACTED_DIR defined before IN_DIR)
[2026-04-13] Updated metaDesc validation limit from 160 to 155 chars
[2026-04-13] Built quality-gate.js — standalone quality checker with generic
             phrase detector, hard failure vs warning distinction, --fail-fast,
             --warn-only, --last N, --strict flags
[2026-04-13] Integrated quality gate into pipeline-revise.js via
             --quality-check-interval N flag — hard-stops batch on failure
[2026-04-13] Built review-pipeline-output.js — tabular QA summary with
             flags for generic reasons, long titles, short metas, wrong CTA counts
[2026-04-13] Built sitemap-generate.js — generates sitemap.xml from 2-revised/
[2026-04-13] Built pipeline-browse.js — generates index.html from 2-revised/
             with client-side verdict filter, stats, extensionless links
[2026-04-13] Built export-titles.js — exports slug/title/meta/reason to CSV
[2026-04-13] Built import-titles.js — imports revised titles from CSV back to JSON
[2026-04-13] Created ROADMAP-TECHNICAL.md — prioritised engineering backlog
[2026-04-13] Created ROADMAP-PRODUCT.md — prioritised feature backlog
[2026-04-13] Updated business-strategy.md — added business action roadmap
[2026-04-13] Created POLICIES.md — hard rules for pipeline and deployment
[2026-04-13] Created SEO-STRATEGY.md — implemented SEO and go-forward strategy
[2026-04-13] Created docs/pipeline-init.md — algorithm design for project
             template bootstrapper
[2026-04-13] Updated README.md — added API resilience best practices section

---
## Current Step

Post-Revision Run 2 complete ✓
Pipeline/2-revised/ has 163 pages with Pass 1 + titles + Pass 2 applied.
Outstanding: 7 pages with SHORT_META need titles re-run.

Next steps:
  1. Re-run titles on 7 SHORT_META pages
  2. Run fix-cta-titles.js
  3. Run quality-gate.js — confirm clean
  4. Run export-titles.js — review title warnings in CSV
  5. Run pipeline-render.js --all
  6. Run pipeline-browse.js
  7. Run sitemap-generate.js
  8. Visual check in browser
  9. Deploy
