# BooksVersusMovies.com — Completed Tasks

==========================================
Format: \[YYYY-MM-DD] Description

## Project Setup

\[2026-04-11] Created docs/ directory in movies project
\[2026-04-11] Created data/reports/gsc/ and data/reports/analytics/ folders
\[2026-04-11] Created pipeline/ folder with 1-extracted/, 2-revised/, 3-rendered/ subfolders
\[2026-04-11] Created scripts/prompts/ folder for prompt versioning
\[2026-04-11] Moved wild.html to reviews-to-review (placeholder related card slugs)
\[2026-04-11] Moved twilight.html and unbroken.html to reviews-to-review (v1 generation)
\[2026-04-11] Deleted spotlight.html (index page feature, not a review)
\[2026-04-11] Renamed failures-to-reprocess/ to reviews-to-review/
\[2026-04-11] Archived legacy scripts to scripts/archive/ (audit-reviews, fix-all,
rebuild-metadata, site-survey, script-fix-paths)
\[2026-04-11] Deleted old data/extracted\_metadata.csv and data/spotlight.zip
\[2026-04-11] Deleted old metadata.csv (superseded by new extractor output)

## Scripts

\[2026-04-11] Created scripts/extract-metadata.js (v1 — needs update per step 1.2)
\[2026-04-11] Created scripts/tree.js
\[2026-04-11] Created scripts/generate-next-steps.js (v1)
\[2026-04-11] Updated scripts/generate-next-steps.js (v2 — corrected naming conventions,
dynamic header parsing, next action moved to top of report)

## Documentation

\[2026-04-11] Created docs/action-plan.txt
\[2026-04-11] Created docs/pipeline-notes.md
\[2026-04-11] Created docs/project-objectives.md
\[2026-04-11] Created docs/business-strategy.md
\[2026-04-11] Created docs/llm-strategy.md (shelved — superseded by business-strategy.md)
\[2026-04-11] Created docs/completed-tasks.md

## Data

\[2026-04-11] Generated data/extracted\_metadata.csv and data/metadata-issues.csv
(first full extraction run with new extractor)

## Version Control

\[2026-04-11] Committed and pushed full project restructure to git





\[2026-04-11] Updated extract-metadata.js to v2 — series pages, non-standard

&#x20;            years, TBA handling, placeholder card detection, checkpoint block

\[2026-04-11] Moved no-country-for-old-men, the-goldfinch, ugly-love to reviews-to-review

\[2026-04-11] Re-ran extractor — clean baseline: 163 pages, checkpoint passed

\[2026-04-11] Step 1 complete



\[2026-04-11] Created docs/review-schema.md — canonical JSON schema v1

\[2026-04-11] Created scripts/logger.js — shared pipeline logger

\[2026-04-11] Created scripts/html-to-json.js — HTML to JSON extractor

\[2026-04-11] Ran html-to-json.js — 163 files extracted, 0 warnings, checkpoint passed

\[2026-04-11] Fixed extractVerdictBox regex (nested div boundary)

\[2026-04-11] Steps 2.1 and 2.2 complete





\[2026-04-11] Step 2.3 complete — quick-answer, comparison-table, cta-block added to style.css

\[2026-04-11] Section 2 complete



1:30 PM New naming convention:

scripts/

&#x20; pipeline-extract.js      ← rename of html-to-json.js

&#x20; pipeline-revise.js       ← rename of revise.js  

&#x20; pipeline-render.js       ← step 4 (to build)

&#x20; pipeline-generate.js     ← step 5 (to build)

&#x20; extract-metadata.js      ← utility, keep as-is

&#x20; generate-next-steps.js   ← utility, keep as-is

&#x20; tree.js                  ← utility, keep as-is

&#x20; logger.js                ← shared module, keep as-is

