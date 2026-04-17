[//]: # (Destination: docs/strategy/roadmap-technical.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, dates YYYY-MM-DD, status: not-started|in-progress|done|blocked, priority: high|medium|low, effort in plain text, no escaped chars)

# BooksVersusMovies.com — Technical Roadmap
Last updated: 2026-04-17

Engineering backlog. Done items kept for reference.
For raw ideas see docs/strategy/new-ideas.md.

---

## In Progress

### llm-client.js — shared LLM client module
Status: not-started
Priority: high
Effort: 2-3 hours

Extract all API call logic into a single shared module. Currently every script duplicates callModel(), parseJSON(), and .env loading.

Exports:
- `callModel(model, systemPrompt, userContent, maxTokens)` — raw API call, no validation
- `callModelSafe(model, prompt, userContent, schema, maxRetries=3)` — API + jsonrepair + ajv + retry
- `parseJSON(text)` — strips markdown fences + runs jsonrepair
- `loadEnv()` — loads .env into process.env

Scripts to update: pipeline-revise.js, pipeline-generate.js, pipeline-auteurs.js, get-advice.js, compare-models.js

Dependencies: jsonrepair, ajv (both installed)

---

## High Priority

### Environment-based model config
Status: not-started
Priority: high
Effort: 30 minutes

Add --env flag resolving config/models.${env}.json:
- config/models.json — prod (Haiku + Sonnet)
- config/models.test.json — test (DeepSeek, all passes)
- config/models.dev.json — dev (cheapest, single page)

Falls back to config/models.json if env file missing.

### Abbreviated payloads for dev/test runs
Status: not-started
Priority: high
Effort: 2 hours
Depends on: environment-based model config

Send only required fields in dev/test mode. Cuts token count 60-70%, eliminates truncation on large pages.

### Pillar pages — internal links to review pages
Status: not-started
Priority: high
Effort: 1 hour

Pillar page prose mentions titles (Gone Girl, Atonement, etc.) but doesn't link to review pages. Add hyperlinks in pipeline-pillar-render.js by matching slugs from data/reviews/.

---

## Medium Priority

### Per-pass subdirectories
Status: not-started
Priority: medium
Effort: 3 hours
Depends on: pipeline stable

Refactor pipeline to use:
- pipeline/2a-pass1/
- pipeline/2b-titles/
- pipeline/2c-pass2/
- pipeline/2-revised/ (final merged)

Each pass reads from previous folder — nothing ever overwritten.

### GSC API automation
Status: not-started
Priority: medium
Effort: 1 day
Depends on: manual GSC protocol established

Automate GSC exports and URL indexing requests via Search Console API.
- scripts/gsc-report.js --weekly
- scripts/gsc-report.js --post-deploy
- scripts/gsc-report.js --indexing

### Sitemap auto-submission
Status: not-started
Priority: medium
Effort: 30 minutes
Depends on: GSC API automation

Programmatically submit sitemap to GSC after deployment.

### Auto-retry on generic oneLineReason
Status: not-started
Priority: medium
Effort: 1 hour
Depends on: quality gate stable

Single retry with stricter prompt before hard-stopping batch.

### pipeline-init.js — project template bootstrapper
Status: not-started
Priority: medium
Effort: half day
Depends on: pipeline fully stable and documented

Initialises a new affiliate review site from this project structure.

---

## Low Priority

### Structured logging — Pino + OpenTelemetry
Status: not-started
Priority: low
Effort: 1 day

Transition from custom logger.js to Pino. Worth doing if pipeline runs become frequent or team grows.

### Priority tiers for content generation
Status: not-started
Priority: low
Effort: 2 hours
Depends on: pipeline-generate.js

Add priority field (1-3) to JSON schema. Controls model assignment, article length, greenfield generation order.

### Affiliate link management UI
Status: not-started
Priority: low
Effort: half day

Local web UI for managing Amazon affiliate links. Reads/writes JSON files directly.

### Vercel migration + Postgres database
Status: not-started
Priority: low
Effort: 1 week
Depends on: revenue milestone

Move from Netlify to Vercel. Build structured Postgres database for books, films, directors, actors.

---

## Done

- [2026-04-11] Pass 1 — structural overlay (quickAnswer)
- [2026-04-12] Titles pass — CTR-optimised titles
- [2026-04-12] Pass 2 — conversion layer (ctaBlocks)
- [2026-04-13] pipeline-render.js — deterministic HTML renderer
- [2026-04-13] pipeline-browse.js — browse page generator
- [2026-04-13] sitemap-generate.js — sitemap.xml generator
- [2026-04-13] quality-gate.js — batch quality checks
- [2026-04-14] pipeline-generate.js — greenfield new review generator
- [2026-04-14] Full deployment of rendered pages
