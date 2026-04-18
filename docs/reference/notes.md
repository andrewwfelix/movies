[//]: # (Destination: docs/reference/notes.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H3 entries, key: value fields, dates YYYY-MM-DD, no escaped chars)

# BooksVersusMovies.com — Project Notes
Last updated: 2026-04-17

Structured project notes and research. Parsed by dashboard/docs-to-json.js into dashboard/data/notes.json.
Add new notes as H3 entries with the standard fields below.

---

### [i18n-overview] Internationalization — Overview
Date: 2026-04-17
Category: i18n
Priority: high
Status: not-started
Tags: onelink, translation, affiliate, llc
Dependencies: llc-setup
Body: Two separate workstreams. Workstream 1 is affiliate internationalization for English markets via OneLink — do after LLC setup. Workstream 2 is content translation for non-English markets — do after Vercel migration and consistent revenue. Translation quality bar: multi-pass AI is fine for site content. Pages are already AI-generated in English so AI translation is consistent with that quality bar. Hold human review for newsletter, CTAs, and business-facing components only.

---

### [i18n-onelink-revenue] OneLink — Current Lost Revenue Signal
Date: 2026-04-17
Category: i18n
Priority: high
Status: not-started
Tags: onelink, affiliate, gsc, revenue
Dependencies: llc-setup
Body: GSC data as of 2026-04-17 shows real international traffic earning nothing. Canada: 102 impressions, 2 clicks. UK: 83 impressions, 0 clicks. Australia: 40 impressions. Ireland: 7 impressions, 1 click. New Zealand: 12 impressions, 1 click. Netherlands: 22 impressions, 1 click. Italy: 11 impressions, 1 click. Every international click currently earns zero commission. OneLink setup is 30-60 minutes of work and captures this revenue immediately.

---

### [i18n-onelink-setup] OneLink — Setup Steps
Date: 2026-04-17
Category: i18n
Priority: high
Status: not-started
Tags: onelink, affiliate, amazon
Dependencies: llc-setup
Body: 1. Sign up for international Associates accounts under RavensEdge AI LLC with EIN — priority markets: CA, UK, AU, DE, FR, IT, ES. 2. Log into US Associates Central → Account Settings → Link Store IDs. Add each international store ID and verify. 3. Get OneTag JavaScript snippet from OneLink page. 4. Add OneTag to renderFooter() in pipeline-render.js — one re-render deploys to all pages. No existing link changes needed — OneLink is backward compatible. Caveat: product-matching algorithm can fall back to search results pages at 1-1.5% commission vs 3-12%. Evaluate Geniuslink post-Vercel for higher commission preservation.

---

### [i18n-tax] OneLink — Tax Implications
Date: 2026-04-17
Category: i18n
Priority: medium
Status: not-started
Tags: tax, llc, amazon, international
Dependencies: llc-setup
Body: Amazon pays all international earnings in USD to US bank account. No foreign bank accounts needed. Foreign earnings are standard US business income on LLC return. Amazon handles VAT/GST — you are an affiliate, not the seller of record. Each international Associates account requires a tax form — fill out as US entity with EIN, not SSN. No foreign tax filing required. All accounts must be registered under RavensEdge AI LLC before setup.

---

### [i18n-translation-pipeline] Translation — Pipeline Architecture
Date: 2026-04-17
Category: i18n
Priority: medium
Status: not-started
Tags: translation, pipeline, vercel, sonnet
Dependencies: vercel-epic
Body: URL structure: subdirectories not subdomains (booksversusmovies.com/es/animal-farm). Keeps domain authority on root. Pipeline flow: data/reviews/slug.json → pipeline-translate.js (Sonnet multi-pass) → data/reviews/es/slug.json → pipeline-render.js --lang es → es/animal-farm.html. Fields to translate: storyBrief, differences[].body, readFirst, verdictBox, quickAnswer.oneLineReason, pageTitle, metaDesc, faq questions and answers. Fields to keep in English: slug, affiliateLink, youtubeId, author, director, bookTitle. Multi-pass AI translation is the right quality bar — pages are already AI-generated.

---

### [i18n-translation-cost] Translation — Cost Estimate
Date: 2026-04-17
Category: i18n
Priority: low
Status: not-started
Tags: translation, cost, sonnet
Dependencies: vercel-epic
Body: Sonnet API cost per page per language: ~2000 tokens input + 2000 tokens output = ~$0.036. Full site (191 pages) per language: ~$7. Five languages (ES, FR, DE, PT, IT): ~$35 total API cost. Human QA if desired: $500-1000 per language for native speaker review of 191 pages. Priority language: Spanish — covers Brazil (61 GSC impressions), Mexico, Spain, Latin America. Amazon.es covers Spain, Amazon.com.br is separate signup for Brazil.

---

### [i18n-human-review] Translation — What Needs Human Review
Date: 2026-04-17
Category: i18n
Priority: medium
Status: not-started
Tags: translation, newsletter, cta, quality
Dependencies: vercel-epic
Body: AI translation is fine for review page body content. Human review required for: email subject lines and preview text, CTA button text (Buy the Book, Get Exceptions, Read the spotlight), nav items, form labels and error messages, Amazon affiliate disclosure language per local requirements. These are short strings but highly visible — a bad CTA translation is worse than a slightly off review paragraph. Strategy: AI translate everything, human QA short strings and CTAs only. Newsletter: Beehiiv has no native multi-language support — separate publications per language means separate subscriber lists and send cadences. Spanish newsletter only after English newsletter has real subscribers.

---

### [vercel-sprint1-generate] Vercel Sprint 1 — /api/generate Endpoint
Date: 2026-04-17
Category: vercel
Priority: high
Status: not-started
Tags: vercel, api, pipeline, fun
Dependencies: vercel-migration
Body: Most satisfying build in the whole Vercel epic. Post a book title from Tab 6 Content in the dashboard, watch the AI chain run, review appears in dashboard. Feels like magic compared to running pipeline from terminal. Even before Supabase is wired up can write to JSON file. Multi-model chain: Perplexity for factual research → Gemini for structure → Claude Sonnet for editorial pass. Same quality as current local pipeline but triggered from a UI.

---

### [vercel-sprint1-gsc] Vercel Sprint 1 — Live GSC API
Date: 2026-04-17
Category: vercel
Priority: high
Status: not-started
Tags: vercel, gsc, dashboard, analytics
Dependencies: vercel-migration
Body: Wire up Google Search Console API so Tab 1 Analytics updates automatically. No more manual CSV exports and latest.json updates. The moment the dashboard shows live data it stops feeling like a dev project and starts feeling like a product. One afternoon of work, visible every single day. GSC API requires OAuth setup and a service account — Vercel environment variables store the credentials.

---

### [vercel-sprint1-beehiiv] Vercel Sprint 1 — Beehiiv Auto-Draft
Date: 2026-04-17
Category: vercel
Priority: high
Status: not-started
Tags: vercel, beehiiv, newsletter, automation
Dependencies: vercel-migration, supabase-schema
Body: When a review is marked Published in Supabase, a Vercel Function hits the Beehiiv API to create a matching newsletter draft. Draft includes verdict, oneLineReason, 2-3 sentences from verdictBox, readFirst recommendation, affiliate link. Every field already exists in the JSON — zero new content needed. Closes the loop between content publishing and newsletter distribution.

---

### [dashboard-notes-panel] Dashboard — Notes and Brainstorming Panels
Date: 2026-04-17
Category: dashboard
Priority: medium
Status: not-started
Tags: dashboard, notes, brainstorming, json
Dependencies:
Body: Add Notes and Brainstorming tabs to the dashboard reading from dashboard/data/notes.json and dashboard/data/brainstorming.json. Filter by category and priority. Each card shows title, category badge, status/sentiment, tags, and expandable body. Allows feeding structured project context to LLMs quickly. Source of truth stays in markdown (docs/reference/notes.md, docs/brainstorming/brainstorming.md), JSON is derived by docs-to-json.js.
