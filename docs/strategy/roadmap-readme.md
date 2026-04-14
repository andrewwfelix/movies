[//]: # (Destination: docs/strategy/roadmap-readme.md)
# BooksVersusMovies.com — Feature Roadmap Reference
=====================================================
Last updated: April 2026

A plain-language description of each planned feature. Two paragraphs each:
what it is, and why it matters for the site.

---

## 1. Dashboard (data/dashboard/)

The dashboard is a Node.js script that pulls live data from Google Search Console and Google Analytics 4 via their APIs and writes a structured JSON snapshot to `data/dashboard/latest.json`. It captures your top queries, impressions, clicks, CTR, positions, and page-level traffic — everything you currently have to log into Google manually to see. A dated history file is also saved alongside the latest snapshot so you can track trends over time without relying on Google's UI.

The value is that every other intelligent feature on this list depends on this data. The overlord, the automation spec, content prioritization — none of them can make good decisions without knowing what Google is currently doing with your pages. Once the dashboard runs on a schedule, you have a local, queryable record of your site's performance that you own and can pipe into anything.

---

## 2. Overlord (scripts/overlord.js)

The overlord is an LLM-powered script that reads the dashboard snapshot, the product roadmap, the business strategy, and the current site data, then synthesizes a prioritized set of next-step recommendations. Think of it as a weekly briefing: given everything we know about performance, strategy, and what's in the pipeline, what should you actually work on next? It surfaces things like "Lonesome Dove has 12 queries between positions 40-80 — a hub page would consolidate these" or "Verity CTR is 0.8% at position 4 — the title tag needs work."

The reason this is worth building is that the site is now large enough that manual prioritization becomes unreliable. With 164 pages, dozens of queries in striking distance, and multiple pipeline features running, it's easy to work on the wrong thing. The overlord replaces gut feel with a structured, data-driven brief that takes maybe 30 seconds to generate and gives you a clear list of highest-ROI actions for the week.

---

## 3. Hub Pages (pipeline-hubs.js)

Hub pages are broad topic landing pages that sit above your individual review pages in the site hierarchy. A hub like `/literary-fiction/` or `/stephen-king-adaptations/` doesn't have its own detailed content — it aggregates and links to all your relevant individual reviews, gives Google a clear signal about topical authority, and gives readers a curated entry point into a cluster of related titles. Each hub is auto-generated from your existing JSON data, so it costs almost no writing time and stays current as you add new reviews.

The SEO case is clear from your GSC data. Queries like "lonesome dove book vs movie," "lonesome dove universe," and "is lonesome dove based on a true story" are all ranking between positions 39 and 86 because there's no central authority page pulling them together. One well-structured hub consolidates those signals. The same pattern applies to Colleen Hoover adaptations, Stephen King, and genre clusters like literary fiction and thriller. Hubs are the fastest structural improvement you can make right now.

---

## 4. Pillar Pages

A pillar page is a single comprehensive page for one important entity — typically a title that generates a lot of fragmented search demand. Where a regular review page covers book vs. movie, a pillar page goes deeper: synopsis, timeline, character breakdown, adaptation differences, FAQ, and related titles, all on one URL. It becomes the definitive resource for that title on your site and a natural target for internal links from the hub layer above it.

The priority candidates from your GSC data are Lonesome Dove, Gone Girl, Dune, and Animal Farm — all titles with multiple overlapping queries ranking in the 20-80 range that would consolidate into top-10 positions with a single authoritative page. Pillar pages are generated via the pipeline like regular reviews but with an expanded template and more sections. The key discipline is one pillar per entity — no splitting the same title across multiple URLs.

---

## 5. Automation Spec (config/automation-spec.json)

The automation spec is a formal rule file that defines how queries, topics, and entities map to page types. It answers questions like: when does a topic get its own pillar page vs. a section inside an existing page? When does a cluster of titles earn a hub? What sections are required on each page type? Right now these decisions are made intuitively — the spec makes them explicit and consistent so the pipeline can apply them automatically as the site scales.

The practical payoff is that once the spec is in place, adding a new title to the site becomes a deterministic process. The pipeline reads the spec, classifies the input, selects the right template, and generates the correct page structure without you having to make architecture decisions each time. It also prevents the kind of intent fragmentation your GSC data shows — where multiple pages accidentally compete for the same query because there was no rule saying they shouldn't.

---

## 6. Upcoming Adaptations Guide (scripts/pipeline-guide.js)

The upcoming adaptations guide is a scheduled pipeline that queries Grok, Perplexity, and Gemini in parallel for all confirmed upcoming book-to-screen adaptations, merges and deduplicates the results, runs each entry through a Claude editorial pass to bring the notes up to site voice, and renders a polished `upcoming-adaptations.html` page. It runs fresh every time, filters out already-released titles automatically, and groups what remains by release window. The JSON output also doubles as a content backlog — every title without a review is a direct candidate for `generate-review.js`.

The strategic value is threefold. It positions the site as the go-to resource before adaptations drop, which is when search intent is highest and affiliate conversion is most natural. It creates a lead magnet for email capture — readers who want to know what to read before they watch are exactly the audience you want on a list. And it keeps the site fresh with time-sensitive content, which is a positive signal for Google crawl frequency.

---

## 7. Email Capture & Newsletter (pipeline-email.js)

The email capture feature adds an opt-in form to the site — primarily on the upcoming adaptations page and below the verdict box on individual reviews — connected to Mailchimp or ConvertKit. The weekly email format is simple: one book-film pair, the verdict, the one-line reason, a short excerpt from the verdict box, and an affiliate link. Every field already exists in the JSON so the email content can be generated automatically from the pipeline.

The newsletter is the most important long-term asset the site can build. Organic search traffic is increasingly fragile — Google AI Overviews compress click-through, algorithm updates shift rankings overnight. An email list is traffic you own. A reader who signs up for "Read Before You Watch" is signaling genuine intent to buy books, which means higher affiliate conversion than cold search traffic. Even at 500 subscribers the list is worth more per reader than equivalent organic traffic.

---

## 8. Kanban / Weekly Planning (docs/kanban.md)

The Kanban is a plain text file in the project that tracks work in progress across the pipeline — what's queued, what's active, and what's done — organized by category: technical roadmap, product roadmap, content backlog, and SEO actions. It's deliberately low-tech: no external tool, no account required, just a markdown file you update at the start of each week and commit alongside your code changes. The goal is a 30-second weekly planning ritual rather than a heavyweight project management system.

The reason to keep this in the repo rather than Notion or Trello is context. When you're working in the codebase and you want to know what to do next, the answer is one `cat docs/kanban.md` away. It also means the overlord script can read it — when the overlord synthesizes its weekly brief, it knows what's already in progress and won't suggest work you've already started.
