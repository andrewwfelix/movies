[//]: # (Destination: docs/kanban.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, - [ ] checkboxes, dates YYYY-MM-DD, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Kanban
Last updated: 2026-04-18

---

## In Progress

- Homepage redesign — compact hero, covers above fold, verdict badge overlays
- Intent-aware spotlight prompt — emotional engine section, Sonnet model
- Vercel Phase 1 planning — schema designed, SQL ready, credentials pending

---

## Today / Next Session

- [ ] Verify consistency audit passes after all spotlight regenerations
- [ ] Run node scripts/pipeline-browse.js — regenerate index.html with new featured order
- [ ] Check spotlight pages in browser — verify no markdown asterisks rendering
- [ ] Check mobile centering on spotlight pages
- [ ] Fix FAQ bold rendering — renderFAQ needs same markdown-to-HTML conversion as renderParagraphs
- [ ] Commit and push all today's changes to main

---

## High Priority

- [ ] Add hyperlinks from pillar pages to individual review pages
- [ ] Beehiiv DNS / custom domain setup
- [ ] Beehiiv welcome email for new subscribers
- [ ] Fill affiliate links for Blade Runner, Shawshank, Arrival greenfield JSONs
- [ ] GSC indexing — submit 10 pillar page URLs in GSC
- [ ] Check GA4 Demographics — Gender breakdown to validate 70-80% female hypothesis
- [ ] /how-we-judge page — short editorial standards page
- [ ] Author hub pages — Colleen Hoover, Gillian Flynn (high-value given audience signal)
- [ ] llm-client.js — shared LLM client module before next big batch

---

## Vercel Phase 1 Epic (start next)

- [ ] 0.1 Google Cloud project + service account (GSC + GA4 same project)
- [ ] 0.2 Supabase project setup — run scripts/supabase/setup-phase1.sql
- [ ] 0.3 Beehiiv API key
- [ ] 0.4 Vercel project setup + environment variables
- [ ] Run migration scripts — seed Supabase from existing JSON files
- [ ] Build /api/gsc first — wire to Tab 1 Analytics
- [ ] Build /api/tasks — wire to Tab 2 Project + Tab 5 Daily write-back
- [ ] Build /api/docs — wire to Tab 3 Decisions
- [ ] Build /api/docs-sync cron — weekly markdown sync
- [ ] Update dashboard fetch paths one tab at a time
- [ ] Verify each tab before moving to next

---

## Medium Priority

- [ ] Genre hub pages — /thriller, /romance, /literary-fiction
- [ ] WebP conversion for book cover images
- [ ] Social meta tags — Open Graph / Twitter Card on all pages
- [ ] Reader verdict poll below verdict box
- [ ] Multi-LLM code review — review pipeline scripts with Grok/Gemini/Sonnet
- [ ] Recently added section on browse/index page
- [ ] Spotlight pages — migrate buy button CSS to style.css

---

## Pipeline Robustness

- [ ] Fix FAQ bold rendering in pipeline-spotlight.js renderFAQ function
- [ ] Fix mobile centering on spotlight layout CSS
- [ ] pipeline-greenfield.js — fix double output lines
- [ ] pipeline-greenfield.js — unified log not capturing all output
- [ ] Add --pass conversion alias to pipeline-revise.js
- [ ] quality-gate.js — review after Film Wins batch
- [ ] Script version metadata in all pipeline HTML outputs

---

## Business / Operations

- [ ] Transfer site accounts to RavensEdge AI LLC — Amazon Associates, GSC, GA, Netlify, Beehiiv, domain
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
- [ ] Director filmography pages
- [ ] Author profile pages
- [ ] Print-friendly CSS
- [ ] Centralize model config files for admin console management (see brainstorming)
- [ ] AI daily review of full analytics data dump (see brainstorming)
- [ ] Site config table in Supabase for dashboard-editable nav/featured (Phase 1.5)

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
