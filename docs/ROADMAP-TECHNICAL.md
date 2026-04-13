# BooksVersusMovies.com — Technical Roadmap





==========================================
Last updated: April 2026

Prioritised engineering backlog. Items marked done are kept for reference.
For raw ideas not yet evaluated see docs/new-ideas.md.



## In Progress

### Pipeline stabilisation (Step 3-4)

Complete the current pipeline build:

* \[x] Pass 1 — structural overlay (quickAnswer)
* \[x] Titles pass — emotional CTR-optimised titles
* \[x] Pass 2 — conversion layer (ctaBlocks)
* \[x] pipeline-render.js — deterministic HTML renderer
* \[x] pipeline-browse.js — browse page generator
* \[x] sitemap-generate.js — sitemap.xml generator
* \[x] quality-gate.js — batch quality checks
* \[ ] pipeline-generate.js — greenfield new review generator (Step 5)
* \[ ] Full deployment of rendered pages



## High Priority

### Environment-based model config

Add --env flag to pipeline scripts resolving config/models.${env}.json:
config/models.json        ← prod (Haiku + Sonnet)
config/models.test.json   ← test (DeepSeek, all passes)
config/models.dev.json    ← dev (cheapest, single page testing)

Usage:
node scripts\\pipeline-revise.js --all --pass all --env test
Falls back to config/models.json if env file doesn't exist.
Effort: \~30 minutes
Depends on: nothing

### Abbreviated payloads for dev/test runs

Pass 1 and Pass 2 send full JSON (\~4000-6000 tokens) but only need
a small subset. In dev/test mode send only required fields:
Pass 1 minimal: slug, bookTitle, author, verdictText, verdictClass,
verdictBox, readFirst, differences, quickAnswer
Pass 2 minimal: slug, bookTitle, verdictText, affiliateLink, ctaBlocks
Cuts token count 60-70%, eliminates truncation on large pages.
Implement as part of --env flag work.
Effort: \~2 hours
Depends on: environment-based model config

### Periodic quality checks during batch runs

\--quality-check-interval N flag already implemented in pipeline-revise.js.
Refine generic phrase detector based on observed failures:
Current list: both versions, equally rewarding, neither diminishes,
complement each other, worth experiencing, illuminate each other etc.
Add auto-retry on generic oneLineReason — single retry with stricter prompt
before hard-stopping the batch.
Effort: \~1 hour
Depends on: nothing



## Medium Priority

### Per-pass subdirectories

Lesson learned from IN\_DIR bug. Refactor pipeline to use:
pipeline/2a-pass1/    ← Pass 1 output
pipeline/2b-titles/   ← titles pass output
pipeline/2c-pass2/    ← Pass 2 output
pipeline/2-revised/   ← final merged output
Each pass reads from previous folder — nothing ever overwritten.
Enables independent re-run of any single pass.
Effort: \~3 hours (refactor + testing)
Depends on: pipeline stabilisation complete

### pipeline-generate.js (Step 5)

Greenfield new review generator. Takes input data (title, author, director,
affiliate link, YouTube ID) and generates a complete review JSON using
claude-sonnet-4-5. Same renderer pipeline as existing pages.
Effort: \~1 day
Depends on: pipeline-render.js stable

### pipeline-init.js — project template bootstrapper

Initialises a new affiliate review site from this project structure.
See docs/pipeline-init.md for full algorithm design.
Effort: \~half day
Depends on: pipeline fully stable and documented

### GSC API automation

Automate GSC exports and URL indexing requests via Search Console API.
scripts/gsc-report.js --weekly
scripts/gsc-report.js --post-deploy
scripts/gsc-report.js --indexing
Prerequisite: establish manual export protocol first.
Effort: \~1 day
Depends on: manual GSC protocol established

### Auto-retry on generic oneLineReason

When Pass 1 produces a generic oneLineReason, automatically retry with
a more targeted prompt before hard-stopping. Max 1 retry.
Effort: \~1 hour
Depends on: quality gate stable

### Sitemap auto-submission

After deployment, programmatically submit sitemap to GSC via API rather
than manual UI step.
Effort: \~30 minutes (once GSC API auth is set up)
Depends on: GSC API automation



## Low Priority

### Structured logging — Pino + OpenTelemetry

Transition from custom logger.js to Pino for structured JSON logging.
Add OpenTelemetry tracing. Worth doing if pipeline runs become frequent
or team grows beyond solo.
Effort: \~1 day
Depends on: nothing

### Vercel migration + movie database

Move from Netlify to Vercel. Build structured Postgres database for books,
films, directors, actors. Enables richer internal linking, genre pages,
author pages. Significant scope — post-revenue decision.
Effort: \~1 week
Depends on: revenue milestone

### Priority tiers for content generation

Add priority field (1-3) to JSON schema. Controls model assignment,
article length, and greenfield generation order.
Effort: \~2 hours
Depends on: pipeline-generate.js

### Affiliate link management UI

Local web UI for managing Amazon affiliate links across pages. Similar
to WordPress affiliate plugins. Reads/writes JSON files directly.
Effort: \~half day
Depends on: nothing







## priority: llm-client.js — shared LLM client module

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

* Single place to update retry logic, timeout, logging
* Schema validation automatic on every structured call
* Eliminates \~100 lines of duplicated code across 5 scripts
* If OpenRouter changes their API, fix in one place

Dependencies: jsonrepair, ajv (both already installed)
Effort: \~2-3 hours to extract + wire into all scripts
Priority: high — do before full Film Wins batch

