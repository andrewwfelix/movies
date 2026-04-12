# BooksVersusMovies.com — Completed Tasks

==========================================
Format: \[YYYY-MM-DD] Description



## Section 1 — Housekeeping ✓

\[2026-04-11] Established project folder structure — docs/, data/reports/, pipeline/,
scripts/prompts/, reviews-to-review/
\[2026-04-11] Renamed failures-to-reprocess/ to reviews-to-review/ (quarantine folder)
\[2026-04-11] Moved to reviews-to-review/: wild.html (placeholder related card slugs),
twilight.html and unbroken.html (v1 generation, missing FAQ and char table),
no-country-for-old-men.html and the-goldfinch.html (placeholder related
card slugs), ugly-love.html (missing related cards)
\[2026-04-11] Deleted spotlight.html (was index page feature, not a review page),
old metadata.csv (superseded), data/spotlight.zip
\[2026-04-11] Archived legacy scripts to scripts/archive/: audit-reviews.js, fix-all.js,
rebuild-metadata.js, site-survey.js, script-fix-paths.js
\[2026-04-11] Created scripts/extract-metadata.js v1 — initial metadata extractor
\[2026-04-11] Updated to v2 — added: series page detection (director optional for series),
non-standard book year handling (e.g. "800 BC"), TBA film year support,
placeholder related card detection, checkpoint validation block,
quarantine candidate mv commands in console output
\[2026-04-11] Ran extractor — clean baseline: 163 pages, all v2, checkpoint passed,
0 problematic files
\[2026-04-11] Step 1 complete ✓



## Section 2 — Content/Structure Divorce ✓

\[2026-04-11] Designed canonical JSON schema — docs/review-schema.md defines all fields,
null conventions for quickAnswer/ctaBlocks, paragraph separator rules,
bookCoverImage filename-only convention, pipelineVersion field
\[2026-04-11] Created scripts/logger.js — shared pipeline logging module used by all
pipeline scripts; writes timestamped log files to logs/, captures warnings,
errors, checkpoint results, elapsed time
\[2026-04-11] Created scripts/pipeline-extract.js (step 2.2) — extracts all content from
HTML into canonical JSON; handles char tables, differences, FAQ, story brief,
read first, verdict box, related cards, affiliate links, YouTube IDs;
includes checkpoint validation and per-file warning system
\[2026-04-11] Fixed extractVerdictBox regex — original matched first </div> (inner
verdict-title div), not outer verdict-box; fixed to search for <p> directly
\[2026-04-11] Ran pipeline-extract.js — 163 files, 0 warnings, checkpoint passed clean
\[2026-04-11] Added three new CSS components to style.css:
.quick-answer — three-column grid (winner, read first, one-line reason)
with gold left border, Playfair Display values, mobile collapse
.comparison-table — ink header, alternating rows, for feature comparisons
.cta-block — flex row with italic context text + gold button, stacks mobile
\[2026-04-11] Steps 2.1, 2.2, 2.3 complete
\[2026-04-11] Section 2 complete ✓



## Section 3 — Revision Pipeline (in progress)

\[2026-04-11] Adopted pipeline-\* naming convention for all production scripts:
pipeline-extract.js, pipeline-revise.js, pipeline-render.js (to build),
pipeline-generate.js (to build); utility scripts keep existing names
\[2026-04-11] Created config/models.json — LLM model assignments, temperatures, and
max tokens factored out of scripts; all pipeline scripts read this file;
supports env var overrides (PASS1\_MODEL, PASS2\_MODEL) for testing
\[2026-04-11] Created scripts/prompts/pass1-structural.txt — Pass 1 system prompt;
derives quickAnswer from existing verdict/readFirst prose; constrains
oneLineReason to 12 words extracted from existing content; explicitly
lists all immutable fields; optional pageTitle and FAQ improvements
\[2026-04-11] Created scripts/pipeline-revise.js — OpenRouter API integration, reads
config/models.json, loads prompts from scripts/prompts/, validates
immutable fields post-revision, logs via logger.js, checkpoint block,
supports --slug, --all, --pass, --force, --dry, --delay flags
\[2026-04-11] Created README.md at project root — project conventions, naming rules,
pipeline architecture, config documentation, prompt versioning workflow,
checkpoint policy, deployment checklist, Netlify batching note,
key decisions log
\[2026-04-11] Single-page evaluation loop (step 3.3) — tested Pass 1 on atonement.json,
big-fish.json, normal-people.json; output quality confirmed good across
Book Wins, Too Close to Call, and series page verdict types
\[2026-04-11] Full batch run started — 163 pages through Pass 1 via OpenRouter
using anthropic/claude-haiku-4-5 at temp 0.3



## Documentation Created Today

\[2026-04-11] docs/action-plan.txt — numbered pipeline build plan (6 sections, 24 steps)
\[2026-04-11] docs/pipeline-notes.md — architecture notes, prompt change log,
model routing, known issues and decisions
\[2026-04-11] docs/project-objectives.md — site purpose, revenue model, content
philosophy, SEO targets, pipeline objective, success metrics
\[2026-04-11] docs/business-strategy.md — revenue phases, content expansion priorities,
SEO strategy, brand positioning, milestone targets
\[2026-04-11] docs/review-schema.md — canonical JSON schema with field reference,
complete example, and design decisions
\[2026-04-11] docs/completed-tasks.md — this file
\[2026-04-11] README.md — developer best practices and project conventions



## Utility Scripts Created Today

\[2026-04-11] scripts/tree.js — project structure viewer; summarises high-volume
directories (reviews/, images/); excludes node\_modules, .git;
supports --depth and --dir flags
\[2026-04-11] scripts/generate-next-steps.js — project briefing script; reads
action-plan, completed-tasks, new-ideas, metadata CSV, pipeline state,
prompt inventory, quarantine folder, GSC reports; produces prioritised
next action at top; supports --out and --clipboard flags
\[2026-04-11] scripts/logger.js — shared logging module; timestamped log files in
logs/; methods: info, pass, warn, error, skip, section, summary,
checkpoint, close



## Version Control

\[2026-04-11] Committed and pushed full project restructure
\[2026-04-11] Committed README, models config, pipeline-revise with OpenRouter



\---

## Current Step

Step 3.4 — Full batch revision run in progress
163 pages → Pass 1 → pipeline/2-revised/
Model: anthropic/claude-haiku-4-5 via OpenRouter
Next: review checkpoint result, then step 3.5 (write pass2-conversion.txt)





\[2026-04-12] Pass 1 complete — 163 pages revised, quickAnswer populated

&#x20;            7 truncation errors resolved by increasing maxTokens to 6000

&#x20;            2 minor oneLineReason length warnings (a-beautiful-mind, the-client)

\[2026-04-12] Step 3.4 complete ✓

