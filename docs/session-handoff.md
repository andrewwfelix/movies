# Session Handoff — BooksVersusMovies.com
**Date:** 2026-04-19  
**Branch:** schema-v31-migration-2  
**Status:** v3.1 fullpage generation in progress — stopped at page 52/171

---

## What Was Completed This Session

### SEO Pipeline — Title/Meta Pass
- `seo-llm-review.js` — 171 pages scored by Sonnet, Gemini, Grok. 28 high, 135 medium, 8 low priority. Gemini missing 41 pages (batch failures).
- `seo-llm-apply.js` — Claude adjudicated all 163 non-low-priority pages. Null guard fix applied for missing Gemini data.
- `seo-llm-import.js` — 162 pages updated in `pipeline/2-revised/`. Reminders of Him intentionally skipped (top performer, 8.84% CTR).
- All 162 pages re-rendered and deployed to production.
- New titles and metas live at booksversusmovies.com.

### Google Cloud + GSC API
- Google Cloud project `ravensedge-bvm` created under `andrew@ravensedge.ai`
- Service account `ravens-api` created
- GSC API and GA4 API enabled
- Credentials saved to `config/ravensedge-bvm.json` (gitignored)
- `.env` updated: `GOOGLE_APPLICATION_CREDENTIALS=./config/ravensedge-bvm.json`
- `scripts/analyze-gsc-morning.js` running successfully — pulls 28-day, 7-day, 24-hour GSC data + sitemap index + LLM analysis
- Config at `config/gsc-analysis.json` — model: claude-sonnet-4-5, periods: 28days/7days/24hours

### Admin Dashboard
- SEO Review Tab (Tab 6) added to `admin/index.html`
- Chart now pulls from `gsc-03-month.json` (was incorrectly using 24-hour)
- Stats strip still uses `gsc-24-hour.json`
- Project and Decisions tabs show graceful error message when JSON files missing
- Arrow removed from Best Suggestion column

### Schema v3.1 Design
- Full multi-model review conducted: Claude, ChatGPT, Gemini, Perplexity, DeepSeek
- New fields added to schema:
  - `snippetParagraph` — under 100 words, Google extraction target
  - `atAGlanceTable` — 4-5 rows, parallel structure, snippet-optimized
  - `keyDifferencesList` — 3-5 bullet items, index layer for Google
  - `optimizedH2s` — question-format H2 overrides for PAA targeting
  - `primaryKeyword`, `secondaryKeywords`, `targetQueries` — explicit keyword targeting
  - `winnerStatement`, `hook`, `entities` — entity reinforcement and AI summary targeting
  - `og`, `twitter`, `images` — Open Graph and social meta
  - `canonicalUrl` — explicit in JSON
  - `differences[].question` — question-format for each difference section
- Schema document: `data/schemas/schema-revised-v3.1.json`

### Migration Pipeline Scripts
- `scripts/utils/schema-migrate.js` — reads `pipeline/2-revised/`, writes to `pipeline/2-revised-v31/` with null v3.1 fields. Run complete (171 pages).
- `scripts/utils/seo-llm-fullpage.js` — 7 focused Claude calls per page:
  - Call 1: identity/keywords
  - Call 2: snippetParagraph
  - Call 3: atAGlanceTable
  - Call 4: keyDifferencesList
  - Call 5: optimizedH2s
  - Call 6: og/images
  - Call 7: differences[].question
  - Separate input/output dirs (never overwrites source)
  - Per-call model config in `config/seo-review.json`
  - `--dev` flag uses Haiku, `--force` reruns populated fields
  - Inline verification after every call — stops on any failure
  - 0 tolerance failure threshold
- `config/seo-review.json` — updated with `fullpage.calls` section, per-call model config for prod (Sonnet) and dev (Haiku)

### Git + Repo
- `pipeline/2-revised/` and `pipeline/1-extracted/` added to git tracking (removed from .gitignore)
- `pipeline/3-rendered/` stays gitignored (generated output)
- Branch: `schema-v31-migration-2` (schema-v31-migration branch has worktree issue, leave it)
- All scripts committed

### Strategy Documents
- `docs/strategy/seo-lessons-learned.md` — three-phase SEO lessons
- `docs/strategy/seo-greenfield.md` — client-facing guide for new site pitches
- `docs/strategy/seo-pipeline-gameplan.md` — multi-model philosophy: generate with one, review with many, adjudicate with one

---

## Current State — Migration In Progress

### Directory Status
```
pipeline/2-revised/              ← originals, committed, protected
pipeline/2-revised-v31/          ← schema-migrated with null fields (input)
pipeline/2-revised-v31-haiku/    ← dev run output (IN PROGRESS — stopped at page 52)
pipeline/2-revised-v31-sonnet/   ← prod run output (not started)
```

### Fullpage Dev Run Status
- **Stopped at:** page 52/171 — hannibal-series (call 5 verification failure)
- **Pages complete:** 1-51 in `pipeline/2-revised-v31-haiku/`
- **Last fix applied:** H2 title check updated to word-level matching (more lenient)
- **Resume command:** `node scripts/utils/seo-llm-fullpage.js --dev`

### Verification Fixes Applied This Session
Three verification bugs caught and fixed during the dev run:
1. N/A table check — now conditional (only fails if asymmetric, not absolute)
2. H2 book title check — now uses word-level matching from slug + book title
3. `callNums` array — was missing Call 7 (fixed)

---

## Immediate Next Steps (Next Session)

### Step 1 — Complete dev run
```
node scripts/utils/seo-llm-fullpage.js --dev
```
Resume from page 52. May hit more verification failures — fix rules as needed before continuing. Goal: complete all 171 pages in haiku output dir with 0 failures.

### Step 2 — Review dev output sample
Spot check 10-15 pages from `pipeline/2-revised-v31-haiku/`:
```
node -e "const d=require('./pipeline/2-revised-v31-haiku/reminders-of-him.json'); console.log('snippet:', d.snippetParagraph); console.log('table:', d.atAGlanceTable?.length, 'rows'); console.log('h2s:', JSON.stringify(d.optimizedH2s));"
```

### Step 3 — Run prod pass (Sonnet)
Once dev run completes and output looks good:
```
node scripts/utils/seo-llm-fullpage.js
```
Writes to `pipeline/2-revised-v31-sonnet/`. This is the definitive output.

### Step 4 — Update pipeline-render.js for v3.1
The renderer needs new injection points:
- `snippetParagraph` → inject after H1, before Quick Answer
- `atAGlanceTable` → inject before character table
- `keyDifferencesList` → inject before long-form differences
- `optimizedH2s` → substitute H2 text at section headings
- `og` / `twitter` → inject into `<head>`
- `images.bookCoverAlt` / `images.trailerThumbAlt` → img alt attributes
- `canonicalUrl` → use explicit value
- `differences[].question` → render as styled question above difference title

### Step 5 — Re-render all pages
```
node scripts/pipeline-render.js --all --force
```
Input: `pipeline/2-revised-v31-sonnet/` (update renderer to read from here)
Output: `pipeline/3-rendered/`

### Step 6 — Review and deploy
Spot check rendered HTML, verify new structural elements appear correctly, deploy.

### Step 7 — Vercel Phase 1
After migration complete:
- Transfer movies repo from `andrewwfelix` to `Andrew-RavensEdge` on GitHub
- Create Supabase project under LLC email
- Set up ravens-api with `/api/gsc`, `/api/analytics`, `/api/beehiiv`, `/api/tasks`
- Beehiiv API key from Settings → API in Beehiiv account

---

## Pending Kanban Items

### Technical
- [ ] Complete schema v3.1 fullpage dev run (resume from page 52)
- [ ] Run prod fullpage pass (Sonnet) after dev validates
- [ ] Update pipeline-render.js for v3.1 fields
- [ ] Re-render all pages from v31-sonnet output
- [ ] Deploy v3.1 pages
- [ ] Replace manual .env parser with dotenv package across all scripts (after migration)
- [ ] Transfer movies repo to Andrew-RavensEdge GitHub account
- [ ] Fix orphaned schema-v31-migration branch worktree issue
- [ ] DMARC DNS record: `_dmarc TXT v=DMARC1; p=none; rua=mailto:andrew@ravensedge.ai`
- [ ] Add GSC performance data to seo-llm-apply.js adjudicator prompt
- [ ] Fix review schema bleeding — homepage inheriting review stars

### Vercel Phase 1
- [ ] Supabase project under LLC email — run `scripts/supabase/setup-phase1.sql`
- [ ] ravens-api: `/api/gsc`, `/api/analytics`, `/api/beehiiv`, `/api/tasks`
- [ ] Beehiiv API key
- [ ] Google Cloud credentials → env var (GOOGLE_APPLICATION_CREDENTIALS)
- [ ] Netlify, GoDaddy, Beehiiv billing → LLC card
- [ ] Amazon Associates W-9 update (confirm entity type with accountant first)
- [ ] Supabase project under LLC email
- [ ] Amazon tracking ID swap from readingtheill-20 to LLC tracking ID

### SEO / Content
- [ ] Check pillar page GSC performance — target 2026-05-15
- [ ] Homepage title/meta update (0 clicks, 52 impressions)
- [ ] Add hyperlinks from pillar pages to individual review pages
- [ ] Fix FAQ bold rendering in pipeline-spotlight.js renderFAQ
- [ ] Fix mobile centering on spotlight layout CSS
- [ ] Beehiiv DNS / custom domain setup

### Future Scripts
- [ ] `seo-llm-fullpage-review.js` — independent review of generated structural fields
- [ ] `seo-gsc-compare.js` — cross-reference SEO scores vs live GSC data
- [ ] `gsc-analysis.js` — historical GSC trend analysis, outlier detection
- [ ] `seo-llm-apply.js` — pass GSC performance data into adjudicator prompt
- [ ] Auto-implement pipeline — GSC detects low CTR → auto-queue SEO fix → overnight

### Partner Meeting Prep (14 days)
- [ ] `docs/strategy/seo-greenfield.md` is the client pitch doc — review before meeting
- [ ] Have Vercel backend live with dashboard showing real data
- [ ] Prepare content taxonomy example for her domain

---

## Key File Paths

### Scripts
```
scripts/utils/seo-llm-review.js       — 3-model title/meta scoring
scripts/utils/seo-llm-apply.js        — Claude adjudicates title/meta
scripts/utils/seo-llm-import.js       — writes accepted to source JSONs
scripts/utils/seo-llm-fullpage.js     — 7-call v3.1 field generation
scripts/utils/schema-migrate.js       — migrates pipeline/2-revised → v31
scripts/analyze-gsc-morning.js        — daily GSC analysis with LLM
scripts/pipeline-render.js            — renders JSON → HTML (needs v3.1 update)
```

### Config
```
config/seo-review.json        — all model config including fullpage.calls
config/gsc-analysis.json      — GSC analysis periods and model
config/ravensedge-bvm.json    — Google Cloud credentials (gitignored)
```

### Data
```
data/reports/seo-review-latest.json   — 171 pages scored, 162 applied
data/reports/gsc-insights-*.json      — daily GSC analysis reports
data/schemas/schema-revised-v3.1.json — complete v3.1 schema reference
```

### Strategy Docs
```
docs/strategy/seo-lessons-learned.md   — three-phase SEO lessons
docs/strategy/seo-greenfield.md        — client pitch guide
docs/strategy/seo-pipeline-gameplan.md — multi-model philosophy
```

### Pipeline Directories
```
pipeline/2-revised/              — source JSONs (tracked in git)
pipeline/2-revised-v31/          — v3.1 migrated with null fields (input)
pipeline/2-revised-v31-haiku/    — dev run output
pipeline/2-revised-v31-sonnet/   — prod run output
pipeline/3-rendered/             — HTML output (gitignored)
```

---

## Important Decisions Made This Session

- **Never hardcode a model into a script** — all model references read from `config/seo-review.json`
- **Separate input/output dirs** — input never touched during generation runs
- **0 tolerance verification** — stop on any failure, fix the rule not the threshold
- **Generate with one, review with many, adjudicate with one** — pipeline philosophy
- **Reminders of Him never touched** — top performer (8.84% CTR), protected permanently
- **pipeline/2-revised/ now tracked in git** — source of truth, version controlled
- **dotenv migration deferred** — manual .env parser works for now, replace after migration

---

## Environment
```
Node.js v24.14.1
Branch: schema-v31-migration-2
Site: https://booksversusmovies.com
Affiliate: readingtheill-20 (personal, W-9 TBD)
LLC: RavensEdge AI LLC
Google Workspace: andrew@ravensedge.ai
Google Cloud: ravensedge-bvm
```
