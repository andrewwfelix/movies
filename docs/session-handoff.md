# Session Handoff — BooksVersusMovies.com
**Date:** 2026-04-20
**Branch:** main (clean)
**Status:** v3.1 migration complete, merged and pushed. Next focus: Vercel Phase 1.

---

## What Was Completed This Session

### v3.1 Fullpage Migration — Complete
- seo-llm-fullpage.js — hard stop removed, failures log to pipeline/content-issues/ and run continues
- Call 5 prompt tightened — EVERY H2 must include exact book/film title by name
- Dev run complete — haiku, 171 pages in pipeline/2-revised-v31-haiku/
- Prod run complete — Sonnet, 171 pages in pipeline/2-revised-v31-sonnet/
- Content issues resolved — hamnet timeouts retried, it-muschietti + one-day call 5 fixed, call 6 og.title overages (61-65 chars) accepted as non-blocking

### Desktop Layout
- pipeline-render.js — page-layout grid wrapper, renderRightRail(), difference anchor IDs, second CTA removed
- style.css — desktop two-column layout, right rail, quick answer horizontal strip, meta badge prominence, FAQ bold
- All 171 pages re-rendered and deployed

### GSC Morning Analysis Script
- analyze-gsc-morning.js — major revision: 90-day + 7-day deltas, dynamic protection, greenfield slugs, LLM 90s timeout, markdown brief
- gsc-prompt.txt — revised: site context, protection rules, external signals, greenfield publish opportunities, delta field guide
- Script deployed and tested — working

### New Utilities
- scripts/utils/brainstorm.js — two-model iterative brainstorm, full conversation history per turn
- config/brainstorm.json + scripts/prompts/brainstorm-prompt.txt
- scripts/utils/trim-index.js — extracts fold-relevant HTML for LLM layout review

### Docs + Strategy
- docs/ restructured — auto-improvement-thoughts/, business-pitch-ideas/, morning-analysis/, new-desktop-ui-fixes/, performance-goals/
- Grok ContentForge pitch deck saved to docs/business-pitch-ideas/
- Performance goals JSON + update script saved to docs/performance-goals/
- schema-v31-migration-2 merged to main and pushed

---

## Current State

```
Branch:                    main (clean)
Site:                      https://booksversusmovies.com
Pages live:                171 reviews + 10 pillars + 10 static = 191 URLs
pipeline/2-revised-v31-sonnet/   ← 171 pages, all v3.1 fields populated
pipeline/3-rendered/             ← 171 pages rendered with desktop layout
GSC top performer:         reminders-of-him — protected permanently
Impression spike:          noted on older pages 2026-04-20 — investigate next session
```

---

## Immediate Next Steps

### Priority 1 — Vercel Phase 1
Full plan at: docs/brainstorming/vercel/vercel-phase1-plan.md

Task order:
1. Transfer movies repo from andrewwfelix to Andrew-RavensEdge on GitHub
2. Reconnect Netlify to new repo location
3. Supabase project under LLC email — run scripts/supabase/setup-phase1.sql
4. Beehiiv API key — Settings → API in Beehiiv
5. Vercel project ravens-api + environment variables
6. Build /api/gsc, /api/analytics, /api/beehiiv, /api/tasks, /api/docs
7. Update admin dashboard fetch paths one tab at a time

### Priority 2 — Morning analysis
- Test analyze-gsc-morning.js fully — verify JSON + markdown brief save correctly
- Verify protected pages auto-detected from live data
- Add to daily cron or morning workflow

### Priority 3 — normalizeTable() in seo-llm-fullpage.js
- Add auto-reconciliation for N/A values in Call 3 output
- if book = N/A and film has content: book = "Not emphasized in the novel"
- if film = N/A and book has content: film = "Not shown in the film"

---

## Key File Paths

### Scripts
```
scripts/analyze-gsc-morning.js        — daily GSC analysis (revised)
scripts/prompts/gsc-prompt.txt        — GSC analysis prompt (revised)
scripts/utils/seo-llm-fullpage.js     — 7-call v3.1 field generator
scripts/utils/brainstorm.js           — two-model brainstorm utility
scripts/pipeline-render.js            — HTML renderer (desktop layout added)
css/style.css                         — desktop layout styles added
```

### Config
```
config/seo-review.json        — all model config including fullpage.calls
config/gsc-analysis.json      — GSC analysis periods and model
config/brainstorm.json        — brainstorm model config
config/ravensedge-bvm.json    — Google Cloud credentials (gitignored)
```

### Pipeline Directories
```
pipeline/2-revised/              — source JSONs (tracked in git, protected)
pipeline/2-revised-v31/          — v3.1 migrated with null fields
pipeline/2-revised-v31-sonnet/   — prod run output (definitive)
pipeline/content-issues/         — failure logs from fullpage runs
pipeline/3-rendered/             — HTML output (gitignored)
```

### Strategy Docs
```
docs/strategy/seo-greenfield.md        — client pitch guide (partner meeting)
docs/brainstorming/vercel/vercel-phase1-plan.md — Vercel Phase 1 full plan
docs/business-pitch-ideas/             — ContentForge pitch deck (Grok)
docs/performance-goals/                — performance goals JSON + update script
```

---

## Architecture Rules (enforced)

- NEVER hardcode a model — all model references read from config files
- Separate input/output directories — input never touched during generation runs
- Generate with one model, review with many, adjudicate with one
- Never stop a pipeline run on failures — log to content-issues/, continue
- Protect high-performing pages — never auto-apply changes to CTR > 5% or position < 10
- normalizeTable() before verification — fix N/A structurally not via prompt retry (pending)

---

## Environment
```
Node.js v24.14.1
Branch: main
Site: https://booksversusmovies.com
Affiliate: readingtheill-20 (personal, W-9 TBD — confirm entity type with accountant)
LLC: RavensEdge AI LLC
Google Workspace: andrew@ravensedge.ai
Google Cloud project: ravensedge-bvm
.env: OPENROUTER_API_KEY and GOOGLE_CREDENTIALS_JSON set (single-line JSON)
```
