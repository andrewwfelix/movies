# BooksVersusMovies.com — New Ideas
====================================
Format: ## Title, Priority: high/medium/low, Status: pending/in-progress/done/deferred
Ideas marked done or deferred are excluded from generate-next-steps.js output.


## Affiliate link management interface
Build a simple interface to manage affiliate links — similar to what WordPress
affiliate plugins provide. Reduce friction when adding or updating Amazon links
across pages. Could be a simple local web UI that reads/writes the JSON files.
Priority: medium
Status: pending

## Template this project for other affiliate niches
The pipeline architecture (extract → revise → render) is generic enough to
template for other book/product review niches. Could be a meaningful side
project or productised offering.
Priority: low
Status: pending

## Overnight batch processes
Consider scheduled tasks that run automatically:
  a. Update lastUpdated dates on HTML files / JSON records
  b. Broken link checker — scan all internal and affiliate links for 404s
Priority: medium
Status: pending

## Fix-all / sync script
A script that detects when new movies have been added or existing pages
updated and runs the appropriate pipeline passes automatically. Something
like: compare pipeline/2-revised/ timestamps against reviews/ and flag
anything out of sync.
Priority: medium
Status: pending

## Log all pipeline output to logs directory
Ensure every pipeline script writes to logs/ consistently. Currently
pipeline-revise does this via logger.js but worth auditing all scripts
including future ones follow the same convention.
Priority: low
Status: pending

## Retry logic for API calls
Add 2-3 automatic retries with exponential backoff to OpenRouter API calls
in pipeline-revise.js. Handles brief internet disconnections and latency
spikes gracefully without failing a full batch run.
Also added 90-second socket timeout to prevent indefinite hangs on
dropped connections — retry logic only fires if the promise rejects,
which requires a timeout when the socket silently drops mid-response.
Priority: high
Status: done

## Structured logging — Pino + OpenTelemetry
Evaluate transition from current custom logger.js to Pino for structured
JSON logging, with OpenTelemetry for tracing and Datadog or Loki for
aggregation. Worth doing if/when pipeline runs become frequent or team
grows beyond solo.
Priority: low
Status: pending

## Evaluate Vercel migration
Consider moving from Netlify to Vercel. Vercel's edge functions and
database integrations (Postgres via Vercel Storage) could support a
proper movie database — structured data for books, films, directors,
actors — rather than flat JSON files. Would unlock more sophisticated
features and potentially a more maintainable architecture long term.
Priority: low
Status: pending

## Movie database architecture
Related to Vercel migration — think about building and maintaining a
structured movie/book database. Benefits: richer internal linking,
genre pages, author pages, director pages, better search. Significant
scope increase but natural evolution of the project.
Priority: low
Status: pending

## Daily GSC review task
Add a daily or weekly routine: review newly indexed pages in GSC,
request indexing for recently deployed pages, monitor for any
unexpected de-indexing. Could be partially automated with GSC API.
Priority: medium
Status: pending

## Handle series and multi-book scenarios
Several pages cover scenarios that aren't clean one-to-one comparisons:
  - Dune: three books in series, two films + more planned
  - Lord of the Rings: trilogy
  - Heated Rivalry: multiple books in series
  - Hannibal: series of books vs series
Need a content strategy and possibly a schema extension to handle
these well. Currently treated as single comparisons which undersells
the complexity.
Priority: medium
Status: pending

## Environment-based model config
Maintain separate model config files for different environments:
  config/models.json       ← prod (Haiku + Sonnet, current)
  config/models.test.json  ← test/logic check (DeepSeek, all passes)
  config/models.dev.json   ← dev (smallest/cheapest, single page testing)

Add --env flag to pipeline scripts:
  node scripts\pipeline-revise.js --slug atonement --pass all --env test
  node scripts\pipeline-revise.js --all --pass all --env prod

Script resolves config/models.${env}.json and falls back to
config/models.json if the env-specific file doesn't exist.
Clean 30-minute addition once the pipeline is stable.
Priority: medium
Status: pending

## Per-pass subdirectories for pipeline/2-*
Lesson learned from IN_DIR bug — each pass should write to its own folder:
  pipeline/2a-pass1/    ← Pass 1 output
  pipeline/2b-titles/   ← titles pass output
  pipeline/2c-pass2/    ← Pass 2 output
  pipeline/2-revised/   ← final merged output (all passes applied)

Each pass reads from the previous folder, nothing ever gets overwritten.
Enables independent re-runs of any single pass without affecting others.
Currently mitigated by --pass all running in memory, but proper folder
separation would be more robust.
Priority: medium
Status: pending

## Abbreviated payloads for dev/test pipeline runs
Pass 1 and Pass 2 send the full JSON (~4000-6000 tokens) but only need
a small subset of fields to do their job. In dev/test mode, send only
the fields each pass actually needs:

Pass 1 minimal: slug, bookTitle, author, verdictText, verdictClass,
  verdictBox, readFirst, differences, quickAnswer
Pass 2 minimal: slug, bookTitle, verdictText, affiliateLink, ctaBlocks

Cuts token count by 60-70%, eliminates truncation errors on large pages,
reduces cost significantly for test runs. Implement as part of the --env
flag work — dev/test use abbreviated payloads, prod uses full JSON.
Priority: high
Status: pending

## Priority tiers for content generation
Not all pages are equal — some titles have high search volume and strong
affiliate potential, others are lower priority. Consider a priority field
in the JSON schema (1-3) that controls:
  - Which model to use (Sonnet for tier 1, Haiku for tier 2-3)
  - Whether to use full or abbreviated article length
  - Which pages get greenfield regeneration first
  - Which pages get titles re-run with Sonnet vs cheaper model

This is a cost optimisation for scale — not needed now but worth building
in as the site grows beyond 163 pages.
Priority: low
Status: pending

## Model quality comparison process
Before committing to expensive production models, establish a formal process
for evaluating whether cheaper models produce "good enough" output:

1. Run a sample of 10-20 pages through each model tier (dev/test/prod)
2. Use review-pipeline-output.js to export a comparison table
3. Evaluate on specific criteria:
   - oneLineReason specificity (is it grounded in the content?)
   - Title emotional resonance (would you click it?)
   - Meta description quality (does it extend the title?)
   - ctaBlocks correctness (right text for verdict type?)
4. Score each model tier 1-5 on each criterion
5. Calculate cost per page for each tier
6. Make an explicit ROI decision: is the quality delta worth the cost delta?

This process should be run:
- When considering a new model (e.g. DeepSeek vs Haiku vs Sonnet)
- When a cheaper model releases that might match current quality
- When scaling to significantly more pages where cost matters more

The goal is not to always use the cheapest model but to make the
cost/quality tradeoff explicit and data-driven rather than assumed.
Priority: medium
Status: pending

## Periodic quality sanity checks during batch runs
During batch pipeline runs, execute a quality check every N pages and
hard-stop if the check fails. This catches prompt drift, model degradation,
or API issues early rather than discovering problems after 163 pages.

Implementation:
  - Add --quality-check-interval N flag to pipeline-revise.js (default: off)
  - Every N pages, run a lightweight quality check on the last N processed files
  - Hard-stop (process.exit(1)) if check fails, log which page triggered it

Quality checks to run every N pages:
  1. quickAnswer.winner is a valid value (Book/Film/Series/Too Close to Call)
  2. quickAnswer.oneLineReason is under 15 words and non-generic
     (flag if it contains "both versions" or "offers more depth")
  3. pageTitle is under 65 chars and doesn't match the generic pattern
  4. metaDesc is under 155 chars
  5. ctaBlocks has exactly 3 items with valid locations
  6. No immutable fields changed from 1-extracted source

Generic oneLineReason detector — flag if contains any of:
  "both versions", "offers more depth", "has its strengths",
  "each version", "depending on", "both have"

Usage:
  node scripts\pipeline-revise.js --all --pass all --quality-check-interval 5

If check fails at page 25:
  QUALITY CHECK FAILED at iteration 5 (pages 21-25)
  Triggered by: the-firm.json
  Issue: oneLineReason too generic: "Both versions have their strengths."
  Stopping batch. Fix prompt or re-run from --slug the-firm.

This prevents wasting API spend on a degraded run and catches prompt
issues before they affect the full batch.
Priority: high
Status: pending

## GSC export protocol — define and standardise
Establish exactly what to export from Google Search Console, with what
filters, at what interval, and in what format. Without this, data is
inconsistent and hard to compare over time.

Proposed protocol:

WEEKLY export (every Monday):
  Report: Performance > Search results
  Date range: Last 7 days
  Dimensions: Query + Page
  Filters: none (full site)
  Format: CSV
  Filename: data/reports/gsc/YYYY-MM-DD-weekly-performance.csv

MONTHLY export (1st of each month):
  Report: Performance > Search results
  Date range: Last 28 days (not calendar month — more consistent)
  Dimensions: Query + Page
  Filters: none
  Format: CSV
  Filename: data/reports/gsc/YYYY-MM-DD-monthly-performance.csv

POST-DEPLOYMENT export (within 48 hours of any deployment):
  Report: Performance > Search results
  Date range: Last 7 days
  Dimensions: Page
  Filters: none
  Format: CSV
  Filename: data/reports/gsc/YYYY-MM-DD-post-deploy.csv
  Purpose: baseline to compare against next week's export

INDEXING STATUS export (monthly):
  Report: Indexing > Pages
  Export each status group separately:
    - Indexed
    - Crawled not indexed
    - Discovered not indexed
  Filename: data/reports/gsc/YYYY-MM-DD-indexing-status.csv

Also consider: automate via GSC API once manual protocol is established
and patterns are understood. Low priority until manual process is stable.
Priority: medium
Status: pending

## GSC API automation
Automate GSC exports using the Search Console API once the manual export
protocol is established and stable.

Auth: service account (preferred over OAuth2 for automated scripts)
Package: googleapis (npm) or raw HTTP to searchconsole.googleapis.com

Planned scripts:
  scripts/gsc-report.js --weekly       ← last 7 days performance
  scripts/gsc-report.js --post-deploy  ← baseline after deployment
  scripts/gsc-report.js --indexing     ← full indexing status

Also worth exploring:
  - URL inspection API to programmatically request indexing after deploy
  - Sitemap submission API to auto-submit after render run
  - Alerting if indexed page count drops unexpectedly

Prerequisite: establish manual protocol first (see GSC export protocol idea)
and confirm what data is actually useful before automating.
Priority: low
Status: pending

## pipeline-browse.js — auto-generate browse/index page
Generate index.html from pipeline/2-revised/ JSON files using a template
approach — same pattern as pipeline-render.js.

Row template is parameterised from JSON fields:
  bookCoverImage, bookTitle, author, genre, starringLine, storyBrief
  (first paragraph only for blurb), verdictClass, verdictText,
  mediaLabel, filmYear, youtubeId, slug

Features to consider:
  - Sort options: alphabetical (default), by genre, by verdict, by date added
  - Filter by genre (client-side JS filter on existing rows)
  - Filter by verdict (Book Wins / Film Wins / Too Close to Call)
  - Featured flag in JSON to pin certain pages to top of browse
  - Quick-answer oneLineReason visible in row without clicking through
  - Canonical tag on index.html pointing to https://booksversusmovies.com/

Script: scripts/pipeline-browse.js
Output: index.html at project root
Run: after pipeline-render.js, before deployment

Links must use extensionless format: href="/slug" not href="slug.html"
Priority: high — needed before deployment
Status: pending

## Redirect the-maze-runner to the-maze-runner-film
the-maze-runner.html was a duplicate of the-maze-runner-film.html.
The duplicate was quarantined April 2026. If /the-maze-runner is indexed
in GSC, add a Netlify redirect before deployment to avoid a 404:

In netlify.toml:
  [[redirects]]
  from = "/the-maze-runner"
  to   = "/the-maze-runner-film"
  status = 301

Check GSC first — if not indexed, no redirect needed.
Priority: low
Status: pending

## Serve from /reviews/ subdirectory instead of root
Currently rendered HTML files deploy to the project root. Consider
restructuring to serve from /reviews/ with Netlify publish directory set
to reviews/:

  - Set Netlify publish directory to reviews/
  - Move css/ and images/ inside reviews/
  - Renderer writes directly to reviews/
  - index.html and sitemap.xml also go in reviews/
  - reviews/ becomes fully self-contained

Benefits: cleaner project root, clear separation of source and output,
easier to reason about what gets deployed.
Requires: updating renderer output path, moving assets, updating Netlify config.
Priority: low
Status: pending

## TOMORROW — HIGH PRIORITY: Featured/spotlight section on browse page
Add a hero spotlight section at the top of index.html featuring 3-5
hand-picked titles in larger cards before the full listing begins.

Implementation:
  config/featured.json — ordered list of slugs to feature
  pipeline-browse.js reads featured.json and renders spotlight cards
  at top, then full listing below

Spotlight card is larger than row cards — book cover, title, hook,
verdict badge, CTA button. Like the old index page but integrated
into the browse page rather than separate.

This gives editorial control over the first impression without
losing the full browse list.
Priority: high
Status: pending — do first tomorrow

## TOMORROW — HIGH PRIORITY: Priority/hype field in JSON schema
Add priority: 1|2|3 field to review-schema.md and all JSON files.

Priority 1 — high hype, high search volume, flagship titles
  e.g. Gone Girl, Dune, The Shining, The Handmaid's Tale
Priority 2 — solid catalog, good search volume
  e.g. most of the current 162 pages
Priority 3 — lower volume, niche, or older titles

Controls:
  - Browse page order (priority 1 at top, then 2, then 3)
  - Spotlight eligibility (only priority 1 pages featured)
  - Model assignment (Sonnet for tier 1, Haiku for tier 2-3)
  - Greenfield generation order (tier 1 first)
  - Future: different article lengths per tier

Implementation:
  1. Add priority field to review-schema.md
  2. Write a script to bulk-set priority based on a curated list
  3. Update pipeline-browse.js to sort by priority then alpha
  4. Update config/models.json to support per-priority model assignment
Priority: high
Status: pending — do second tomorrow

## llm-client.js — shared LLM client module
Extract all API call logic into a single shared module used by every
pipeline script. Currently every script duplicates the same callModel(),
parseJSON(), and .env loading code.

File: scripts/llm-client.js

Exports:
  callModel(model, systemPrompt, userContent, maxTokens)
    Raw API call via OpenRouter. No validation. Use for free-text
    responses (titles, advice, auteur descriptions).

  callModelSafe(model, prompt, userContent, schema, maxRetries=3)
    API call + jsonrepair + ajv schema validation + auto-retry.
    Feeds specific schema errors back to model on retry.
    Use for all structured JSON generation (Pass 1, Pass 2, greenfield).
    Schema parameter is optional — omit for free-text responses.

  parseJSON(text)
    Strips markdown fences + runs jsonrepair. Used internally by
    callModelSafe but also exportable for one-off parsing.

  loadEnv()
    Loads .env file into process.env. Currently duplicated in every
    script — centralise here.

Scripts to update once llm-client.js is built:
  pipeline-revise.js      (Pass 1, titles, Pass 2)
  pipeline-generate.js    (Stage 1, Stage 2)
  pipeline-auteurs.js     (director descriptions)
  get-advice.js           (advice tool)
  compare-models.js       (eval tool)

Benefits:
  - Single place to update retry logic, timeout, logging
  - Schema validation automatic on every structured call
  - Eliminates ~100 lines of duplicated code across 5 scripts
  - If OpenRouter changes their API, fix in one place

Dependencies: jsonrepair, ajv (both already installed)
Effort: ~2-3 hours to extract + wire into all scripts
Priority: high — do before full Film Wins batch
Status: pending
