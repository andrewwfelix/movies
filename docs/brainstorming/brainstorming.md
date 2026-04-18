[//]: # (Destination: docs/brainstorming/brainstorming.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H3 entries, key: value fields, dates YYYY-MM-DD, no escaped chars)

# BooksVersusMovies.com — Brainstorming Log
Last updated: 2026-04-17

Structured log of LLM feedback and brainstorming sessions.
One entry per topic per model. Parsed by dashboard/docs-to-json.js into dashboard/data/brainstorming.json.

---

### [chatgpt-seo-internal-linking] SEO — Internal linking as highest ROI lever
Date: 2026-04-17
LLM: chatgpt
Category: seo
Sentiment: agree
Signal: high
Actionable: true
Promoted: true
Tags: seo, internal-linking, pillar, review-pages
Summary: Internal linking graph is the single highest ROI SEO action — each page should link to 3 similar tone, 1 genre cluster, 1 controversial verdict page.
Comment: Correct and already partially done — 55 broken related cards fixed, but pillar-to-review links still missing. This is the top actionable item from this session.

---

### [chatgpt-seo-cluster-pages] SEO — Cluster/hub pages as authority aggregators
Date: 2026-04-17
LLM: chatgpt
Category: seo
Sentiment: agree
Signal: high
Actionable: false
Promoted: false
Tags: seo, pillars, hubs, genre
Summary: Genre cluster pages like /horror-book-vs-movies become authority hubs that rank for broader queries.
Comment: Done — 10 pillar pages live. ChatGPT didn't know this was already built. Confirms the pillar strategy was correct.

---

### [chatgpt-seo-title-ctr] SEO — Title CTR hooks
Date: 2026-04-17
LLM: chatgpt
Category: seo
Sentiment: agree
Signal: high
Actionable: false
Promoted: false
Tags: seo, ctr, titles, meta
Summary: Rewriting titles from generic Book vs Film format to opinionated hooks drives significant CTR lift and ranking improvement.
Comment: Done — Sonnet title pass across 171 pages completed this session. Will take 3-7 days to show in GSC data.

---

### [chatgpt-seo-schema] SEO — Schema consistency
Date: 2026-04-17
LLM: chatgpt
Category: seo
Sentiment: agree
Signal: medium
Actionable: false
Promoted: false
Tags: seo, schema, structured-data, faq
Summary: Review schema and FAQ schema should be consistent across all pages with consistent author/org identity.
Comment: Already in place via pipeline-render.js. No action needed.

---

### [perplexity-vercel-supabase] Vercel + Supabase architecture
Date: 2026-04-17
LLM: perplexity
Category: tech
Sentiment: mixed
Signal: high
Actionable: true
Promoted: true
Tags: vercel, supabase, architecture, platform
Summary: Full platform architecture — Supabase for persistence, Vercel Functions for pipeline orchestration, Realtime for dashboard updates, Edge Config for feature flags.
Comment: Direction is right but over-engineered for current stage. Realtime dashboard, audit logs, RBAC, and tasks table are premature. Core value is reviews table, analytics_history, and /api/generate. See vercel-dashboard-ideas.txt for full assessment.

---

### [perplexity-vercel-rls] Supabase Row-Level Security for team permissions
Date: 2026-04-17
LLM: perplexity
Category: tech
Sentiment: agree
Signal: medium
Actionable: true
Promoted: false
Tags: supabase, rls, permissions, team
Summary: RLS policy table with site_id enables granular permissions — researchers can insert reviews but not publish.
Comment: Correct and worth building when Content Researcher is hired. Low effort, high value for team scaling. Not needed now.

---

### [perplexity-vercel-stale-content] Stale content detector cron
Date: 2026-04-17
LLM: perplexity
Category: pipeline
Sentiment: agree
Signal: medium
Actionable: true
Promoted: false
Tags: vercel, cron, content-freshness, pipeline
Summary: Vercel Cron flags reviews older than 90 days with impression drops and queues them for AI refresh.
Comment: Genuinely useful and fits the pipeline naturally. Add to Sprint 3 of Vercel epic. Not needed until site has consistent traffic data.

---

### [perplexity-vercel-auto-social] Auto-posting to X and Reddit on publish
Date: 2026-04-17
LLM: perplexity
Category: biz
Sentiment: disagree
Signal: low
Actionable: false
Promoted: false
Tags: social, reddit, automation, backlinks
Summary: On publish, automatically post to X and Reddit via API to drive traffic and build backlinks.
Comment: Disagree — automated social posting backfires easily and looks spammy. Reddit penalizes obvious automation. Stay manual for social. GSC ping on publish is worth doing, social posting is not.

---

### [perplexity-vercel-ab-testing] A/B meta title testing via Vercel Edge Config
Date: 2026-04-17
LLM: perplexity
Category: seo
Sentiment: disagree
Signal: low
Actionable: false
Promoted: false
Tags: seo, ab-testing, edge-config, ctr
Summary: Use Edge Config feature flags to A/B test meta titles and descriptions, auto-promoting winners based on GSC and vitals data.
Comment: Over-engineered. A Sonnet title rewrite pass on high-impression/low-CTR pages achieves the same result in one afternoon with no infrastructure. Build the CTR optimization script instead.

---

### [perplexity-i18n-onelink] Amazon OneLink for international affiliate revenue
Date: 2026-04-17
LLM: perplexity
Category: i18n
Sentiment: agree
Signal: high
Actionable: true
Promoted: true
Tags: onelink, affiliate, international, revenue
Summary: Set up Amazon OneLink to capture revenue from UK, Canada, Australia and other international markets currently earning zero commission.
Comment: Correct and urgent. GSC shows real traffic from UK, Canada, Australia earning nothing. OneLink setup is 30-60 minutes of work gated only on LLC transfer. Highest ROI per hour on the site right now.

---

### [mixed-i18n-translation] Site content translation — Spanish first
Date: 2026-04-17
LLM: mixed
Category: i18n
Sentiment: agree
Signal: medium
Actionable: true
Promoted: false
Tags: translation, spanish, pipeline, i18n
Summary: Multi-pass AI translation of review content to Spanish, French, German via pipeline-translate.js at ~$7 API cost per language for full site.
Comment: Right direction, wrong timing. Do English-only until revenue is consistent. Spanish is the right first language given Brazil signal. Translation only makes sense after Vercel migration enables subdirectory routing. AI translation is fine for body content — hold human review for CTAs, newsletter, and business-facing strings only.

---

### [mixed-dashboard-tabs] Dashboard as operational command center
Date: 2026-04-17
LLM: mixed
Category: product
Sentiment: agree
Signal: high
Actionable: false
Promoted: false
Tags: dashboard, json, llm-context, project-management
Summary: Dashboard should be a full project command center reading from structured JSON files — Analytics, Project, Decisions, Roadmap, Daily, Notes, Brainstorming.
Comment: Built and live at /dashboard. The JSON layer makes the dashboard useful as LLM context input, not just a visual. Right architecture for a solo operator.
