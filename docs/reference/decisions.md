[//]: # (Destination: docs/reference/decisions.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, dates YYYY-MM-DD, no escaped chars, no asterisk bullets)

# BooksVersusMovies.com — Decisions Log
Last updated: 2026-04-17

Architectural and strategic decisions with rationale. Append new entries — never delete old ones.
Format: date, decision, alternatives considered, rationale.

---

## Architecture

### LLM never touches HTML
Date: 2026-04-11
Decision: All LLM input and output is JSON only. pipeline-render.js converts JSON to HTML deterministically.
Alternatives: LLM writes HTML directly
Rationale: Prevents broken markup. Enables model swapping without touching HTML. Guarantees structural consistency across all pages.

### Model config in config/models.json
Date: 2026-04-11
Decision: All LLM model assignments live in config/models.json. Scripts read at startup.
Alternatives: Hardcode model names in scripts
Rationale: Change models without touching code. Enables environment-based overrides (prod/test/dev).

### OpenRouter as API provider
Date: 2026-04-11
Decision: Route all LLM calls through OpenRouter rather than direct provider APIs.
Alternatives: Direct Anthropic API, direct OpenAI API
Rationale: Model flexibility — can compare Haiku vs Sonnet vs Grok without changing auth. Cost comparison across providers. Single API key.

### pipeline-* prefix for production scripts
Date: 2026-04-11
Decision: All scripts that run regularly in production use pipeline-* naming. Utility scripts have no prefix or live in scripts/utils/.
Alternatives: No naming convention, folder-only organization
Rationale: Clear distinction between production workflow and maintenance utilities at a glance.

### data/reviews/ as canonical JSON source
Date: 2026-04-11
Decision: After pipeline runs, data/reviews/ is the source of truth. pipeline/ folders are scratch space — safe to delete and regenerate.
Alternatives: pipeline/2-revised/ as canonical
Rationale: Clean separation between working space and final output. Enables safe pipeline reruns.

### config/nav.json as single source of truth for navigation
Date: 2026-04-14
Decision: All pipeline scripts read nav from config/nav.json. check-nav.js audits consistency.
Alternatives: Hardcode nav in each script
Rationale: One change updates all pages. check-nav.js catches drift immediately.

---

## Infrastructure

### Netlify for hosting (current)
Date: 2026-04-11
Decision: Deploy static HTML to Netlify. 301 redirects via netlify.toml for .html URLs.
Alternatives: Vercel, GitHub Pages, S3
Rationale: Free tier sufficient at current scale. Simple static deploy. Planned migration to Vercel when database is needed.

### Vercel migration planned post-revenue
Date: 2026-04-17
Decision: Migrate to Vercel once site reaches consistent revenue. Not before.
Alternatives: Migrate now
Rationale: Vercel enables cron jobs (pipeline-guide.js nightly), serverless functions (GSC API), and Postgres database. Not needed until scale justifies complexity.

### Dashboard as self-contained microservice in dashboard/
Date: 2026-04-17
Decision: dashboard/index.html + dashboard/latest.json as standalone folder. Fetches latest.json relative to itself.
Alternatives: Integrate into main pipeline, use data/dashboard/
Rationale: Easy to move or wire up to GSC API on Vercel. No dependencies on pipeline. Friends can view at /dashboard without understanding the project.

---

## Content Pipeline

### Two-stage greenfield generation
Date: 2026-04-13
Decision: Greenfield pipeline uses two stages — Stage 1 factual (Haiku), Stage 2 editorial (Haiku/Sonnet).
Alternatives: Single-shot generation
Rationale: Stage 1 verifies factual accuracy before spending tokens on editorial content. Allows human review between stages.

### Minimal greenfield input — 5 fields only
Date: 2026-04-13
Decision: Greenfield input JSON requires only: bookTitle, slug, affiliateLink, youtubeId, videoAffiliateLink.
Alternatives: Full brief with author, director, genre etc.
Rationale: LLM researches and generates everything else. Minimises manual data entry. Helper can populate inputs without understanding the pipeline.

### Pillar pages separate from review pages
Date: 2026-04-17
Decision: Pillar pages have their own pipeline (pipeline-pillar.js), config (config/pillars.json), and data store (data/pillars/).
Alternatives: Reuse review pipeline with a different template
Rationale: Different content type, different generation approach, different rendering requirements. Clean separation avoids contaminating review pipeline.

---

## SEO

### Hub-and-pillar architecture
Date: 2026-04-17
Decision: Build topic-level pillar pages above individual review pages. Start with 10 pillars covering broad informational queries.
Alternatives: Review pages only, genre hub pages only
Rationale: GSC data shows query clusters (Lonesome Dove universe, thriller comparisons) with no authority page to consolidate them. Pillar pages capture topic-level traffic and funnel to reviews.

### Featured hub at /featured not SEO hub
Date: 2026-04-17
Decision: /featured is a curated editorial page listing spotlight pages. Not an SEO hub in the hub-and-pillar sense.
Alternatives: Make /featured an SEO hub targeting "best book vs movie" queries
Rationale: Featured serves navigation and editorial positioning. SEO hubs (/book-vs-movie, /thriller) are a separate workstream post-Vercel migration.

---

## Newsletter

### Beehiiv over Mailchimp/ConvertKit
Date: 2026-04-17
Decision: Use Beehiiv for newsletter. Embed form via iframe in pipeline-render.js footer.
Alternatives: Mailchimp (paid after 500 subscribers), ConvertKit/Kit (pricing confusion), custom form
Rationale: Beehiiv free plan sufficient for current stage. Clean embed code. Newsletter brand (Verdict Drop Fridays) already configured.

### Newsletter embed in pipeline-render.js footer
Date: 2026-04-17
Decision: Beehiiv iframe rendered via renderFooter() in pipeline-render.js — appears on all review pages above the footer.
Alternatives: Manual embed on specific pages only, sidebar placement
Rationale: Maximum subscriber capture. Consistent placement. One code change updates all 171 pages on next render.

---

## Business

### RavensEdge AI LLC as operating entity
Date: 2026-04-17
Decision: All site accounts (Amazon Associates, GSC, Netlify, Beehiiv, domain) to be transferred to RavensEdge AI LLC.
Status: pending transfer
Rationale: Business liability separation. Professional affiliate account management.

### Amazon Associates tracking ID: readingtheill-20
Date: 2026-04-11
Decision: Single tracking ID for all Amazon affiliate links across the site.
Rationale: Simplicity. All revenue attributed to one account. ID is public — embedded in all page HTML.
