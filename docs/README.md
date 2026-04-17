[//]: # (Destination: docs/README.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, dates YYYY-MM-DD, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Developer README
Last updated: 2026-04-17

Project conventions, architecture decisions, and best practices.
Read this before making changes to any pipeline script or configuration.

---

## Project Structure

```
movies/
├── config/
│   ├── models.json         — LLM model assignments (edit here, not in scripts)
│   ├── nav.json            — single source of truth for site navigation
│   └── pillars.json        — pillar page definitions
├── css/
│   └── style.css
├── dashboard/
│   ├── index.html          — GSC analytics dashboard (/dashboard)
│   └── latest.json         — GSC data (update manually from exports)
├── data/
│   ├── greenfield/         — input JSONs for new pages (5 fields each)
│   ├── guides/             — upcoming adaptations data
│   ├── pillars/            — generated pillar page JSON
│   ├── reports/            — GSC exports, audit reports
│   ├── reviews/            — canonical JSON source of truth (post-pipeline)
│   └── schemas/            — ajv validation schemas
├── docs/
│   ├── data/               — machine-readable JSON (project-status.json etc.)
│   ├── pipeline/           — pipeline history and notes
│   ├── reference/          — policies, schema docs, architecture decisions
│   ├── strategy/           — kanban, roadmaps, business strategy
│   └── team/               — onboarding, tasks, job descriptions
├── images/                 — book cover images (slug.jpg format)
├── logs/                   — one log file per pipeline run (auto-generated)
├── newsletter/             — Beehiiv embed code and assets
├── pipeline/
│   ├── 2-revised/          — LLM-revised JSON (source for renderer)
│   └── 3-rendered/         — final rendered HTML
├── scripts/
│   ├── content/            — consolidate-docs.js, seo-metadata scripts
│   ├── ops/                — check-nav.js, sitemap-generate.js
│   ├── reporting/          — dashboard.js, get-advice.js
│   ├── prompts/            — LLM prompt files (.txt)
│   └── utils/              — logger.js, tree.js, consistency-audit.js, quality-gate.js
└── *.html                  — live rendered pages in project root
```

---

## Naming Conventions

### Scripts

`pipeline-*.js` — production workflow scripts run regularly:
- `pipeline-extract.js` — HTML to JSON
- `pipeline-revise.js` — LLM revision passes
- `pipeline-render.js` — JSON to HTML
- `pipeline-generate.js` — greenfield new reviews
- `pipeline-greenfield.js` — full greenfield orchestrator
- `pipeline-spotlight.js` — spotlight page generator
- `pipeline-pillar.js` — pillar page JSON generator
- `pipeline-pillar-render.js` — pillar page HTML renderer
- `pipeline-guide.js` — upcoming adaptations guide
- `pipeline-browse.js` — browse/index page generator
- `pipeline-auteurs.js` — The Auteurs page generator

Utility scripts in scripts/utils/ — run occasionally for maintenance.

### Files
- Log files: `YYYY-MM-DD_HH-MM-SS_scriptname.log`
- GSC reports: `YYYY-MM-DD-description.csv`
- Review JSON: `slug.json` (e.g. `atonement.json`)
- Pillar JSON: `slug.json` in data/pillars/

### Git commits
Format: `scope: what changed`
Examples:
- `pipeline-render: add Beehiiv newsletter embed`
- `pillars: 10 pages live, sitemap updated`
- `docs: standardize markdown format`

---

## Configuration

### LLM Models — config/models.json
Never hardcode model names in scripts. All model assignments live in config/models.json. Scripts read this file at startup.

Temperature guidance:
- 0.3 — structural passes where consistency matters most
- 0.4-0.5 — generation passes with some creative latitude
- Never above 0.7 — consistency required

### API Keys — .env
All secrets in .env at project root. Never commit this file.
```
OPENROUTER_API_KEY=your-key-here
```

### Nav — config/nav.json
Single source of truth for site navigation. All pipeline scripts read from here. Run check-nav.js after any nav change to verify consistency across all pages.

---

## Pipeline Architecture

### Core principle
The LLM never touches HTML. Non-negotiable.

- LLM reads and writes JSON only
- pipeline-render.js converts JSON to HTML deterministically
- HTML in project root is always renderer output — never hand-edit it

### Pipeline flow
```
data/reviews/*.json
    ↓ pipeline-revise.js (LLM passes)
pipeline/2-revised/*.json
    ↓ pipeline-render.js
pipeline/3-rendered/*.html
    ↓ (auto-copied to project root)
*.html (live pages)
```

### Greenfield flow
```
data/greenfield/slug.json (5 fields: bookTitle, slug, affiliateLink, youtubeId, videoAffiliateLink)
    ↓ pipeline-greenfield.js (Stage 1: factual, Stage 2: editorial)
data/reviews/slug.json
    ↓ pipeline-render.js
slug.html (live page)
```

### What each pass does
- Pass 1 (structural): adds quickAnswer block, improves pageTitle for CTR
- Titles pass: rewrites pageTitle and metaDesc for CTR
- Pass 2 (conversion): adds ctaBlocks — mid-article CTA placements

---

## Prompts

Prompts in scripts/prompts/ as plain .txt files. Edit prompts without touching code. Version independently in git.

When making significant prompt changes:
1. Copy existing: `pass1-structural.txt` → `pass1-structural-v2.txt`
2. Edit new version
3. Test on 3-5 pages before committing
4. Log the change in docs/pipeline/pipeline-notes.md

---

## Logging

Every pipeline script produces a timestamped log in logs/. Logs capture every file processed, warnings, errors, checkpoint results, elapsed time. Never overwritten — each run produces a new file.

---

## Checkpoints

Every pipeline script ends with CHECKPOINT PASSED or CHECKPOINT FAILED.
Do not proceed to the next step if the checkpoint fails.

---

## Deployment

Before deploying:
1. Run consistency-audit.js — check for broken links, missing images, placeholder affiliate links
2. Run check-nav.js — verify nav consistency across all pages
3. Confirm CHECKPOINT PASSED on pipeline-render.js
4. Spot-check 5-10 rendered pages in browser
5. Commit to dev branch, merge to main, push — Netlify deploys automatically

Batch commits before pushing to minimise Netlify build charges.

---

## API Resilience

### Socket timeout
All HTTP requests include a 90-second socket timeout. Without this, a dropped connection causes the process to hang indefinitely.

### Retry logic
Three attempts with exponential backoff: 10s, 20s.

Do NOT retry on: expired API key (401), bad request (400)
DO retry on: ECONNRESET, ETIMEDOUT, rate limit (429), server errors (500/503)

### Resume capability
All pipeline scripts skip files that already exist in the output directory without --force. Smart skip checks whether required fields are populated rather than just whether the file exists.

---

## Key Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-11 | LLM never touches HTML | Prevents broken markup, enables model swap |
| 2026-04-11 | Model config in config/models.json | Change models without touching code |
| 2026-04-11 | OpenRouter as API provider | Model flexibility, cost comparison |
| 2026-04-11 | pipeline-* prefix for production scripts | Clear distinction from utility scripts |
| 2026-04-11 | data/reviews/ is canonical source post-pipeline | pipeline/ folders are scratch space |
| 2026-04-14 | config/nav.json as single source of truth | Prevents nav drift across pages |
| 2026-04-17 | Pillar pages separate from review pages | Different content type, different pipeline |
| 2026-04-17 | Dashboard as self-contained microservice in dashboard/ | Easy to move, wire up to GSC API on Vercel |
| 2026-04-17 | Beehiiv for newsletter over Mailchimp/ConvertKit | Free plan sufficient, embed works cleanly |
