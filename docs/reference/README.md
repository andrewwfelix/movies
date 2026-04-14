# BooksVersusMovies.com — Developer README
==========================================
Last updated: April 2026

This document covers project conventions, best practices, and architectural
decisions for the BooksVersusMovies pipeline. Read this before making changes
to any pipeline script or configuration.


## Project Structure

```
movies/
├── config/
│   └── models.json          ← LLM model assignments (edit here, not in scripts)
├── css/
│   └── style.css
├── data/
│   ├── extracted_metadata.csv
│   ├── metadata-issues.csv
│   ├── reports/
│   │   ├── gsc/             ← Google Search Console exports
│   │   └── analytics/       ← Google Analytics exports
│   └── reviews/             ← canonical JSON source of truth (post-pipeline)
├── docs/
│   ├── action-plan.txt
│   ├── business-strategy.md
│   ├── completed-tasks.md   ← append here after every completed task
│   ├── new-ideas.md         ← add ideas here for next-steps script to surface
│   ├── pipeline-notes.md
│   ├── project-objectives.md
│   └── review-schema.md     ← canonical JSON schema definition
├── pipeline/
│   ├── 1-extracted/         ← html-to-json output (raw)
│   ├── 2-revised/           ← pipeline-revise output (LLM revised)
│   └── 3-rendered/          ← pipeline-render output (final HTML)
├── reviews/                 ← live deployed HTML pages
├── reviews-to-review/       ← quarantine folder for problem pages
├── scripts/
│   ├── prompts/
│   │   ├── pass1-structural.txt
│   │   ├── pass2-conversion.txt
│   │   └── greenfield.txt
│   ├── extract-metadata.js  ← utility: site audit and QA
│   ├── generate-next-steps.js ← utility: project briefing
│   ├── logger.js            ← shared module (do not run directly)
│   ├── pipeline-extract.js  ← pipeline: HTML → JSON
│   ├── pipeline-generate.js ← pipeline: greenfield new reviews
│   ├── pipeline-render.js   ← pipeline: JSON → HTML
│   ├── pipeline-revise.js   ← pipeline: LLM revision passes
│   └── tree.js              ← utility: project structure viewer
└── logs/                    ← one log file per script run (auto-generated)
```


## Naming Conventions

### Scripts
Two categories — prefix signals which type:

`pipeline-*.js` — production workflow scripts run regularly:
- `pipeline-extract.js` — converts HTML to JSON (bootstrap or re-extraction)
- `pipeline-revise.js`  — runs LLM revision passes (Pass 1 + Pass 2)
- `pipeline-render.js`  — renders JSON to HTML for deployment
- `pipeline-generate.js`— generates new reviews from scratch (greenfield)

Utility scripts (no prefix) — run occasionally for maintenance:
- `extract-metadata.js`    — full site audit, produces metadata CSV
- `generate-next-steps.js` — project briefing, reads all docs and data
- `tree.js`                — prints project structure

### Files
- Log files: `YYYY-MM-DD_HH-MM-SS_<scriptname>.log`
- GSC/Analytics reports: `YYYY-MM-description.csv`
- Review JSON: `<slug>.json` (e.g. `atonement.json`)

### Git commits
Keep commit messages short and specific. Format:
`<scope>: <what changed>`

Examples:
- `pipeline-revise: add OpenRouter support`
- `config: add models.json`
- `step 2 complete: schema, logger, extractor`


## Configuration

### LLM Models — config/models.json
**Never hardcode model names in scripts.** All model assignments live in
`config/models.json`. Scripts read this file at startup.

```json
{
  "pass1": {
    "model": "anthropic/claude-haiku-4-5",
    "maxTokens": 4096,
    "temperature": 0.3
  },
  "pass2": {
    "model": "anthropic/claude-haiku-4-5",
    "maxTokens": 2048,
    "temperature": 0.4
  },
  "greenfield": {
    "model": "anthropic/claude-sonnet-4-5",
    "maxTokens": 6000,
    "temperature": 0.5
  }
}
```

To test a different model: edit `models.json`, run, compare output, revert
if worse. No code changes required.

Temperature guidance:
- 0.3 — structural passes where consistency matters most
- 0.4-0.5 — conversion and generation passes with some creative latitude
- Never above 0.7 — this site requires consistency, not surprise

### API Keys — .env
All secrets live in `.env` in the project root. Never commit this file.
`.env` is in `.gitignore`.

```
OPENROUTER_API_KEY=your-key-here
```

Scripts load `.env` automatically using a lightweight built-in parser.
No `dotenv` package required.

To override a model for a single run without editing `models.json`:
```cmd
set PASS1_MODEL=anthropic/claude-sonnet-4-5 && node scripts\pipeline-revise.js --slug atonement
```


## Pipeline Architecture

### The content/structure divorce
**The LLM never touches HTML.** This is non-negotiable.

- LLM reads and writes JSON only
- The renderer (pipeline-render.js) converts JSON to HTML deterministically
- HTML in `reviews/` is always renderer output — never hand-edit it

This means:
- Any model can safely process the JSON without risk of broken markup
- You can swap models and compare output without touching HTML
- Structure is guaranteed consistent across all 163+ pages

### Pipeline flow
```
reviews/*.html
    ↓ pipeline-extract.js
pipeline/1-extracted/*.json     ← raw extraction, never modified
    ↓ pipeline-revise.js
pipeline/2-revised/*.json       ← LLM revised (Pass 1 → Pass 2)
    ↓ pipeline-render.js
pipeline/3-rendered/*.html      ← final HTML, ready for deployment
    ↓ (manual approval)
reviews/*.html                  ← live pages
data/reviews/*.json             ← canonical JSON, copied from 2-revised/
```

### What each pass does
Pass 1 (structural overlay):
- Adds `quickAnswer` block
- Optionally improves `pageTitle` for CTR
- Optionally tightens FAQ questions
- Does NOT touch: storyBrief, differences, readFirst, verdictBox

Pass 2 (conversion layer):
- Adds `ctaBlocks` — mid-article CTA placements
- Does NOT touch any prose fields

### Source of truth
`data/reviews/*.json` is the canonical source once the pipeline is complete.
`pipeline/` folders are working scratch space — safe to delete and regenerate.
`reviews/*.html` is renderer output — safe to regenerate from `data/reviews/`.


## Prompts

Prompts live in `scripts/prompts/` as plain `.txt` files. This separation means:
- Edit prompts without touching code
- Version prompts independently in git
- Test prompt variants by duplicating the file and pointing to it

### Prompt versioning
When making significant prompt changes:
1. Copy the existing prompt: `pass1-structural.txt` → `pass1-structural-v2.txt`
2. Edit the new version
3. Test on 3-5 pages before committing
4. If better, rename to replace the original
5. Log the change in `docs/pipeline-notes.md` under "Prompt Change Log"

### Prompt writing rules
- Lead with voice and tone before structure requirements
- Use concrete good/bad examples for subjective judgements
- List immutable fields explicitly — models occasionally drift
- Require JSON-only output with no preamble or markdown fences
- Keep system prompts under 2,000 tokens where possible


## Logging

Every pipeline script produces a timestamped log file in `logs/`.
Logs capture: every file processed, warnings, errors, checkpoint results,
elapsed time.

Log files are never overwritten — each run produces a new file.
Use logs to:
- Debug unexpected output from LLM passes
- Compare runs across different models
- Audit what ran and when before deployment

`logs/` is committed to git so you have a permanent record.
Consider adding a periodic cleanup task once logs accumulate.


## Checkpoints

Every pipeline script ends with a checkpoint block that prints
`CHECKPOINT PASSED` or `CHECKPOINT FAILED`.

**Do not proceed to the next pipeline step if the checkpoint fails.**

Checkpoint failures indicate either:
- A content extraction problem (fix in pipeline-extract.js)
- An LLM validation failure (inspect the specific file, adjust prompt)
- A structural issue in the source HTML (move to reviews-to-review/)

Add `--strict` flag to any script to exit with code 1 on checkpoint failure,
which is useful if you ever automate the pipeline.


## Reviews to Review

`reviews-to-review/` is the quarantine folder for pages that need manual
attention before they can go through the pipeline.

Current contents and reasons are tracked in `docs/pipeline-notes.md`
under "Known Issues and Decisions".

Do not run pipeline scripts against files in `reviews-to-review/` — they
are excluded from all pipeline runs by default.


## Adding a New Review

New reviews enter the pipeline via `pipeline-generate.js` (greenfield),
not via hand-written HTML. This ensures every new page is born with the
full structure the pipeline expects.

Until `pipeline-generate.js` is built (Step 5), new reviews can be
hand-written and then run through `pipeline-extract.js` to produce JSON,
followed by the revision passes.


## Deployment

Before deploying:
1. Run `extract-metadata.js` as a final QA pass
2. Confirm `CHECKPOINT PASSED` with 0 problematic files
3. Confirm affiliate links and YouTube IDs are intact
4. Spot-check 5-10 rendered pages in a browser
5. Copy `pipeline/3-rendered/*.html` to `reviews/`
6. Copy `pipeline/2-revised/*.json` to `data/reviews/`
7. Push to git — Netlify deploys automatically

**Batch commits before pushing to minimise Netlify build charges.**
Commit locally as often as you like. Push only when a section or
deployment batch is complete.


## API Resilience Best Practices

### Socket timeout
All HTTP requests to OpenRouter include a 90-second socket timeout. Without
this, a dropped connection mid-response causes the process to hang indefinitely
— the retry logic never fires because the promise never rejects.

If you see a pipeline run that appears frozen with no output for several
minutes, the socket timeout wasn't firing. Check that the timeout is set in
callOpenRouterOnce() in pipeline-revise.js.

### Retry logic
Three attempts with exponential backoff: 10s, 20s. Total retry window is
~30 seconds per attempt set. Auth errors (401, user not found) are not
retried since they require manual intervention.

Do NOT retry on:
- OPENROUTER_API_KEY expired or invalid
- 400 bad request (prompt or payload issue)
- 401 unauthorized

DO retry on:
- ECONNRESET (connection dropped)
- ETIMEDOUT (request timed out)
- 429 rate limit (back off and retry)
- 500/503 server errors

### Environment-based model config (planned)
Currently all model assignments live in config/models.json. The plan is to
support config/models.test.json and config/models.dev.json with a --env flag:

  node scripts\pipeline-revise.js --all --pass all --env test   ← DeepSeek
  node scripts\pipeline-revise.js --all --pass all --env prod   ← Haiku/Sonnet

Script falls back to config/models.json if env-specific file doesn't exist.
See docs/new-ideas.md for implementation notes.

### Resume capability
All pipeline scripts support resume after interruption. Without --force,
scripts skip files that already exist in the output directory. For pipeline-
revise.js, the smart skip logic checks whether required fields are populated
rather than just whether the file exists — so a file missing ctaBlocks will
be re-processed even without --force.


## Key Decisions Log

| Date       | Decision                                              | Reason                                      |
|------------|-------------------------------------------------------|---------------------------------------------|
| 2026-04-11 | LLM never touches HTML                                | Prevents broken markup, enables model swap  |
| 2026-04-11 | Model config in config/models.json                    | Change models without touching code         |
| 2026-04-11 | OpenRouter as API provider                            | Model flexibility, cost comparison          |
| 2026-04-11 | pipeline-* prefix for production scripts              | Clear distinction from utility scripts      |
| 2026-04-11 | director field optional for series pages              | Series have no single director              |
| 2026-04-11 | bookCoverImage stores filename only                   | Renderer constructs path — portable JSON    |
| 2026-04-11 | quickAnswer/ctaBlocks null until pipeline sets them   | Extracted JSON reflects current page state  |
| 2026-04-11 | Batch git commits before push                         | Minimise Netlify build charges              |
| 2026-04-11 | data/reviews/ is canonical source post-pipeline       | pipeline/ folders are scratch space         |
