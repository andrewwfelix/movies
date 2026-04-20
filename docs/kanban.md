[//]: # (Destination: docs/kanban.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, - [ ] checkboxes, dates YYYY-MM-DD, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Kanban
Last updated: 2026-04-20

---

## In Progress

- v3.1 migration complete — schema-v31-migration-2 merged to main and pushed

---

## Next Session

### Priority 1 — Morning analysis script deployment

- [ ] Deploy analyze-gsc-morning.js revised version — 90-day + 7-day, deltas, dynamic protection, greenfield slugs, LLM timeout
- [ ] Deploy gsc-prompt.txt revised version — site context, protection rules, external signals, publish opportunities, delta field guide
- [ ] Test run — node scripts/analyze-gsc-morning.js
- [ ] Verify JSON report + markdown brief both save correctly
- [ ] Verify protected pages auto-detected from live data
- [ ] Add to daily cron or morning workflow

### Priority 2 — Investigate impression spike

- [ ] Run morning script — pull fresh GSC data
- [ ] Cross-reference impression spike against 2026-04-19 title/meta deployment
- [ ] Check if spike correlates with specific pages or query patterns
- [ ] Document findings in docs/morning-analysis/

### Priority 3 — Pipeline robustness: normalizeTable()

- [ ] Add normalizeTable() to seo-llm-fullpage.js Call 3 — auto-reconciles N/A values
      - if book = N/A and film has content: book = "Not emphasized in the novel"
      - if film = N/A and book has content: film = "Not shown in the film"
      - Prevents call 3 verification failures without prompt changes
      - Grok feedback confirmed this is the right fix

---

## High Priority

- [ ] Affiliate links — "Watch on Amazon" for top pages
      - APPROACH: semi-automated hybrid — manual lookup once per title, stored in JSON
      - Step 1: run morning script, check topPagesByImpressions, identify top 10
      - Step 2: manually find Prime Video / rental link for each movie on Amazon (5-10 min/title)
      - Step 3: store in videoAffiliateLink field — already exists in review JSON schema
      - Step 4: re-render those pages — pipeline-render.js already outputs buy-video-btn if field populated
      - Fallback link pattern if no direct ASIN: https://www.amazon.com/s?k=Movie+Title+movie&tag=readingtheill-20
      - Future: Node.js script using PA API to search Movies and TV by title, return direct Prime Video link
      - Track separately from book affiliate clicks — UTM or separate tracking ID
      - Morning script: flag pages where videoAffiliateLink is null as a data gap
      - Andrew doing manual lookups in downtime — not blocking pipeline work
      - Note: swap tracking ID from readingtheill-20 to LLC ID after W-9 confirmed
- [ ] Replace manual .env parser with dotenv package across all scripts
- [ ] Transfer movies repo from andrewwfelix to Andrew-RavensEdge on GitHub
- [ ] Fix orphaned schema-v31-migration branch worktree issue
- [ ] DMARC DNS record — _dmarc TXT v=DMARC1; p=none; rua=mailto:andrew@ravensedge.ai
- [ ] Add GSC performance data to seo-llm-apply.js adjudicator prompt — conservative on performers, aggressive on zero-traffic
- [ ] Fix review schema bleeding — homepage inheriting review stars
- [ ] Homepage title/meta update — 0 clicks, 52 impressions, needs optimization
- [ ] Add hyperlinks from pillar pages to individual review pages
- [ ] Beehiiv DNS / custom domain setup
- [ ] Check pillar page GSC performance — target date 2026-05-15 (may rank faster)
- [ ] Fill affiliate links for Blade Runner, Shawshank, Arrival greenfield JSONs

---

## Vercel Phase 1 Epic

- [ ] Transfer movies repo to Andrew-RavensEdge GitHub account first
- [ ] Reconnect Netlify to new repo location after transfer
- [ ] Supabase project setup under LLC email — run scripts/supabase/setup-phase1.sql
- [ ] Beehiiv API key — Settings → API in Beehiiv account
- [ ] Vercel project setup ravens-api + environment variables
- [ ] Google Cloud credentials → env var approach (GOOGLE_APPLICATION_CREDENTIALS)
- [ ] Build /api/gsc — wire to Tab 1 Analytics
- [ ] Build /api/analytics — GA4 data
- [ ] Build /api/beehiiv — subscriber count, growth rate
- [ ] Build /api/tasks — wire to Tab 2 Project + Tab 5 Daily write-back
- [ ] Build /api/docs — wire to Tab 3 Decisions
- [ ] Update dashboard fetch paths one tab at a time
- [ ] Netlify, GoDaddy, Beehiiv billing → LLC card
- [ ] Amazon Associates W-9 update (confirm entity type with accountant first — pass-through)
- [ ] Amazon tracking ID swap from readingtheill-20 to LLC tracking ID
- [ ] Discontinue legacy personal Vercel account after ravens-api live

---

## Future Scripts

- [ ] seo-llm-fullpage-review.js — independent 3-model review of generated v3.1 structural fields (snippetParagraph, atAGlanceTable, keyDifferencesList, optimizedH2s)
- [ ] seo-gsc-compare.js — cross-reference SEO review scores against live GSC CTR/impressions. Surfaces fix priority by actual traffic opportunity.
- [ ] gsc-analysis.js — historical GSC trend analysis across all dated imports. Outlier detection, CTR drops, position threshold crossings.
- [ ] seo-llm-apply.js — pass live GSC CTR and position data into adjudicator prompt. Conservative on performers (CTR > 5% or position < 10), aggressive on zero-traffic.
- [ ] analyze-trends.js — weekly script, crosses trending adaptations against catalog and greenfield backlog, outputs prioritized publish list and pages likely to spike soon
- [ ] Auto-implement pipeline — GSC detects low CTR → auto-queue SEO fix → Claude adjudicates → re-renders overnight. No human involvement.
- [ ] Task router — structured task objects dispatched to right model by type/cost
- [ ] PA API script — Node.js search for movie title in Movies and TV category, returns direct Prime Video affiliate link for videoAffiliateLink field population
- [ ] Smart retry with corrective prompt — on verification failure, re-call with specific error context instead of blind retry. Grok feedback: cuts failures significantly.

---

## Partner Meeting Prep (14 days)

- [ ] docs/strategy/seo-greenfield.md is the client pitch doc — review before meeting
- [ ] docs/business-pitch-ideas/ — Grok ContentForge pitch deck saved here for reference
      - Lead with retainer model not done-for-you — positions as system not content agency
      - Traction slide: update to 171 pages, full pipeline, GSC intelligence, multi-model review
      - "ContentForge" brand name worth considering for the system
- [ ] Have Vercel backend live with dashboard showing real data for demo
- [ ] Prepare content taxonomy example for her domain
- [ ] Prepare timeline slide — week 1 through month 6 realistic traffic expectations

---

## Medium Priority

- [ ] Performance goals dashboard — track progress toward traffic and affiliate milestones
      - performance-goals.json designed (docs/performance-goals/) — baseline: 400 impressions/day, 10 clicks/day
      - update-performance-goals.js drafted — reads latest GSC report, updates baseline, appends history
      - Wire into admin dashboard as new tab — milestone progress bars, daily vs target
      - Auto-run after morning analysis script
      - First sale target: 1200 daily impressions, 30 daily clicks by 2026-05-25
- [ ] Genre hub pages — /thriller, /romance, /literary-fiction
- [ ] WebP conversion for book cover images
- [ ] Reader verdict poll below verdict box
- [ ] Recently added section on browse/index page
- [ ] Multi-LLM code review — review pipeline scripts with Grok/Gemini/Sonnet
- [ ] Beehiiv welcome email for new subscribers
- [ ] Check GA4 Demographics — Gender breakdown to validate 70-80% female hypothesis
- [ ] /how-we-judge page — short editorial standards page
- [ ] Author hub pages — Colleen Hoover, Gillian Flynn (high-value given audience signal)

---

## Pipeline Robustness

- [ ] Fix FAQ bold rendering in pipeline-spotlight.js renderFAQ function
- [ ] Fix mobile centering on spotlight layout CSS
- [ ] pipeline-greenfield.js — fix double output lines
- [ ] pipeline-greenfield.js — unified log not capturing all output
- [ ] Add --pass conversion alias to pipeline-revise.js
- [ ] quality-gate.js — review after Film Wins batch
- [ ] Script version metadata in all pipeline HTML outputs
- [ ] llm-client.js — shared LLM client module before next big batch

---

## Architecture Decisions (Enforced Rules)

- NEVER hardcode a model into a script — all model references read from config files
- Separate input/output directories — input never touched during generation runs
- Generate with one model (voice consistency), review with many (independent perspectives), adjudicate with one
- 0 tolerance verification — stop on any failure, fix the rule not the threshold
- Protect high-performing pages — never auto-apply changes to pages with CTR > 5% or position < 10
- Never stop a pipeline run on individual page failures — log to content-issues/, continue
- normalizeTable() before verification — fix N/A structurally, not via prompt retry

---

## Business / Operations

- [ ] Develop business model ideas — reduce affiliate dependency, leverage pipeline as product
      - CONTEXT: AI search (Google AI Overviews, Perplexity, ChatGPT) is already summarizing
        book vs movie comparisons in results. Affiliate-driven comparison sites face 2-4 year
        traffic decline risk. The pipeline itself is the asset, not the affiliate revenue.
      - CORE VALUE PROPOSITION: "High-signal, SEO-optimized, structured media comparison
        content at scale — with built-in trend detection and performance intelligence."
      - BRAND: "ContentForge" — The Operating System for High-Performance Media Comparison Content
      - TARGET COMPANY TYPES (priority order):
        1. Major book publishers — backlist + new release promotion, direct-to-retailer traffic
        2. Streaming services (Netflix, Prime, Hulu, Disney+) — adaptation comparison hubs
        3. Movie studios — pre-emptive comparison content before a film drops
        4. Education / study guide platforms — modern SparkNotes replacement
        5. Large media/entertainment sites — white-label comparison vertical
        6. AI companies — structured human-curated comparison data for training/citation
      - POSSIBLE REVENUE MODELS (lead with retainer):
        - Retainer + performance — positions as system not agency
        - White-label / SaaS pipeline (license prompts, scripts, GSC workflow)
        - Done-for-you content service ($X/month, 8-15 articles + ongoing optimization)
        - Consulting + training (help internal teams adopt the system)
      - KEY PITCH ANGLE: "AI search is summarizing your content for free. We create owned
        comparison content that ranks, gets cited by AI, and drives direct traffic back to
        you — while giving you full control over the narrative."
      - Grok pitch deck saved to docs/business-pitch-ideas/ — 10-slide ContentForge deck
      - NEXT STEPS WHEN READY: pick 2-3 dream clients (one publisher + one streaming service),
        build one-page case study from booksversusmovies.com data, outreach via LinkedIn
      - NOTE: partner meeting in ~14 days is a live test of this pitch model
- [ ] About page rewrite — real person, real story, why this site exists
- [ ] Voice pass on top 10 traffic pages — sharpen opinions, remove hedging
- [ ] Hire Content Researcher (Person 1)

---

## TheApiaryGuide.com (Future Project)

Domain owned: TheApiaryGuide.com
Status: gated on LLC setup

- [ ] Set up SiteGround hosting + WordPress
- [ ] Install AAWP + Rank Math + chosen theme
- [ ] Map first 12 articles
- [ ] Abstract BooksVersusMovies pipeline for reuse

---

## Low Priority / Later

- [ ] Spoiler-free mode toggle
- [ ] What to read next quiz
- [ ] Goodreads rating integration
- [ ] Director filmography pages (suggested by LLM analysis — defer until after v3.1)
- [ ] Author profile pages
- [ ] Print-friendly CSS
- [ ] Centralize model config files for admin console management
- [ ] Site config table in Supabase for dashboard-editable nav/featured (Phase 1.5)

---

## Done — 2026-04-20

- [x] seo-llm-fullpage.js — removed hard stop on failures, writes slug+issue to pipeline/content-issues/, run continues under all circumstances
- [x] pipeline/content-issues/ directory established for failure logging
- [x] seo-llm-fullpage.js — Call 5 prompt tightened: EVERY question must include exact book/film title by name
- [x] seo-llm-fullpage.js dev run completed clean (haiku, 171 pages)
- [x] seo-llm-fullpage.js prod run completed — Sonnet, 171 pages in pipeline/2-revised-v31-sonnet/
- [x] Content issues resolved — hamnet retried (timeouts), it-muschietti + one-day call 5 retried, call 6 og.title minor overages accepted (61-65 chars)
- [x] pipeline-render.js — desktop layout: page-layout wrapper, renderRightRail(), difference anchor IDs, removed second CTA block
- [x] style.css — desktop two-column grid, right rail styles, quick answer horizontal strip, meta badge prominence, FAQ questions bold + ink color
- [x] Gone Girl test render reviewed — right rail, jump links, quick answer strip all confirmed working
- [x] All 171 pages re-rendered with new desktop layout
- [x] trim-index.js — utility script to extract fold-relevant HTML for LLM layout review
- [x] analyze-gsc-morning.js — major revision: 90-day + 7-day deltas, dynamic protection, greenfield slugs, LLM timeout, content scope fix, markdown brief, delta CTR field
- [x] gsc-prompt.txt — revised: site context, protection rules, external signal confidence guide, greenfield publish opportunities, April 19 deployment context, delta field guide
- [x] brainstorm.js + brainstorm.json + brainstorm-prompt.txt — two-model iterative brainstorm utility built and configured
- [x] Desktop layout reviewed by multiple LLMs — consensus on right rail priority, quick answer strip, meta badge. Hero redesign, character table, alternating layouts deferred.
- [x] Impression spike on older pages noted for investigation
- [x] Grok migration script feedback reviewed — normalizeTable() added to future scripts + architecture rules
- [x] Grok ContentForge pitch deck reviewed — saved to docs/business-pitch-ideas/, retainer model to lead
- [x] Performance goals JSON + update script reviewed — added to medium priority
- [x] docs/ restructured — auto-improvement-thoughts/, business-pitch-ideas/, morning-analysis/, new-desktop-ui-fixes/, performance-goals/ created
- [x] schema-v31-migration-2 merged to main and pushed

---

## Done — 2026-04-19

- [x] seo-llm-review.js — 171 pages scored by Sonnet, Gemini, Grok. 28 high, 135 medium, 8 low.
- [x] seo-llm-apply.js — null guard fix for missing Gemini data. 162 pages adjudicated.
- [x] seo-llm-import.js — 162 pages updated. Reminders of Him protected.
- [x] 162 pages re-rendered and deployed with new titles/metas
- [x] Google Cloud project ravensedge-bvm created under andrew@ravensedge.ai
- [x] GSC API + GA4 API enabled. Service account ravens-api created. Credentials configured.
- [x] scripts/analyze-gsc-morning.js — working, pulls 28-day/7-day/24-hour + sitemap + LLM analysis
- [x] gsc-prompt.txt — site context block added, prevents redundant recommendations
- [x] config/gsc-analysis.json — periods updated to 28days/7days/24hours
- [x] admin/index.html — SEO Review Tab added, chart fixed to 3-month, graceful errors for missing JSON
- [x] GSC URL Inspection — canonicalization confirmed clean, reminders-of-him.html not indexed
- [x] Schema v3.1 designed — multi-model review complete
- [x] data/schemas/schema-revised-v3.1.json — complete schema document
- [x] docs/strategy/seo-lessons-learned.md — three-phase lessons learned
- [x] docs/strategy/seo-greenfield.md — client-facing greenfield guide
- [x] docs/strategy/seo-pipeline-gameplan.md — multi-model pipeline philosophy
- [x] scripts/utils/schema-migrate.js — built and run, 171 pages in pipeline/2-revised-v31/
- [x] scripts/utils/seo-llm-fullpage.js — 7-call generator with inline verification, separate dirs, dev/prod modes
- [x] config/seo-review.json — updated with fullpage.calls per-call model config
- [x] pipeline/2-revised/ added to git tracking (removed from .gitignore)
- [x] Branch schema-v31-migration-2 created for migration work
- [x] Three verification bugs caught and fixed during dev run

---

## Done — 2026-04-18

- [x] Homepage restructured — compact hero, stats strip, covers above fold
- [x] style.css updated — Grok card improvements, verdict badge overlays, bigger CTA
- [x] pipeline-browse.js — Grok structure, DEFAULT_FEATURED data-driven order
- [x] featured.html — rebuilt with emotional spotlights first, prestige second, data-driven
- [x] Spotlight prompt upgraded — intent-aware, emotional-engine required section
- [x] pipeline-spotlight.js — Sonnet model, slug injection fix, relatedSlugs truncation
- [x] pipeline-spotlight.js — renderParagraphs markdown-to-HTML conversion
- [x] pipeline-spotlight.js — renderRelated reads from REVISED_DIR, links to spotlight URLs
- [x] 5 new spotlight pages — it-ends-with-us, normal-people, the-fault-in-our-stars, where-the-crawdads-sing, a-little-life
- [x] 6 spotlight pages regenerated with new intent-aware prompt
- [x] admin/import-gsc.js — handles hourly Time column, aggregates by date
- [x] dashboard-data/ restructured — gsc-24-hour.json, gsc-03-month.json
- [x] Public /dashboard and full /admin split
- [x] intent-aware-spotlights branch merged and deleted
- [x] render-spotlights.js and related-graph.json deleted (over-engineered)
- [x] scripts/supabase/setup-phase1.sql — complete Phase 1 schema ready to run
- [x] docs/brainstorming/vercel/vercel-phase1-plan.md — updated with Grok review notes
- [x] GA4 data analyzed — Reminders of Him #1 by views+engagement score
- [x] GSC 24-hour data — 18 clicks, 417 impressions, Reminders of Him 9.76% CTR
- [x] git cleanup — all branches deleted, main is clean

---

## Done — 2026-04-17

- [x] Reminders of Him spotlight page live
- [x] 10 pillar pages live and indexed
- [x] pipeline-pillar.js + pipeline-pillar-render.js built
- [x] sitemap-generate.js — 191 URLs total
- [x] SEO titles, meta, oneLineReasons updated — Sonnet pass 171 pages
- [x] consistency-audit.js — 8-check site audit
- [x] fix-related-cards.js — fixed 55 broken related card slugs
- [x] featured.html hub page live
- [x] Beehiiv newsletter embed on all review pages
- [x] First subscriber confirmed
- [x] docs/team/ created — onboarding pack
- [x] Greenfield JSONs ready — Blade Runner, Shawshank, Arrival
- [x] Dashboard live at /dashboard
