[//]: # (Destination: docs/strategy/seo-greenfield.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Last updated: 2026-04-19)
[//]: # (Author: RavensEdge AI)

# SEO Greenfield Guide — RavensEdge AI

## How We Build Search-Optimized Content Systems From Scratch

---

## Introduction

This document explains how RavensEdge AI approaches SEO for new content sites. It covers our philosophy, our technical pipeline, how we structure content data, and why each decision was made. It is written for a client who wants to understand not just what we do, but why — and what outcomes to expect.

We built and validated this approach on BooksVersusMovies.com, a book-versus-movie comparison site that achieved first-page Google rankings within days of launch on a new domain. The methods described here are the distilled result of that build, informed by analysis from multiple AI models and live GSC performance data.

---

## Part 1 — Philosophy

### We build systems, not pages

The fundamental difference between our approach and a traditional SEO agency is that we do not write individual pages. We design a content system — a structured data schema, a generation pipeline, and a rendering engine — that produces pages programmatically. Every page follows the same structural rules, the same schema, and the same SEO principles. The result is a site that is internally consistent at scale in a way that manual content production cannot achieve.

This matters for SEO because Google rewards topical authority — the sense that a site is the definitive resource for a specific subject. Topical authority comes from covering a topic comprehensively with consistent, high-quality content. Our system is designed to produce that coverage at speed without sacrificing quality.

### We write for humans and structure for Google

Good content and search-optimized content are not the same thing. Good content is well-argued, specific, and genuinely useful to the reader. Search-optimized content is structured so that Google's extraction systems can identify and surface the key information — direct answers, comparison tables, bullet lists, FAQ responses.

Our approach satisfies both requirements simultaneously. The long-form content is written for human readers. The structural layer — snippet paragraphs, at-a-glance tables, bullet lists, question-format headers — is designed for Google's crawlers and AI systems. These two layers coexist on every page.

### We start with intent, not keywords

Most SEO approaches start by identifying target keywords and building content around them. We start with search intent — what is the user actually trying to accomplish when they type this query? Understanding intent determines page structure, content depth, verdict framing, and CTA placement. Keywords are a downstream output of intent analysis, not the starting point.

For a comparison site, intent is almost always one of three types: "which is better," "what changed," or "should I read/watch first." Every page we build answers all three questions, explicitly, in the first 100 words.

### Data drives every decision

We do not guess about what is working. Every site we build is wired to Google Search Console and Google Analytics from day one. GSC data feeds a daily analysis script that surfaces CTR opportunities, position improvements, and declining pages automatically. Changes are made based on performance data, not intuition.

---

## Part 2 — The Content System

### How a page gets built

Every page starts as a JSON file — a structured data object that contains all the information needed to generate the HTML. The JSON is not a template with placeholders. It is a content specification that defines every element of the page: the verdict, the key differences, the character comparisons, the FAQ questions, the affiliate links, the schema markup.

A pipeline of scripts transforms the JSON into a fully rendered, SEO-optimized HTML page. The pipeline is deterministic — the same JSON always produces the same HTML. This means pages are reproducible, auditable, and correctable at the source data level rather than in the HTML.

### Why JSON as the source of truth

Storing content as structured JSON rather than HTML or prose documents gives us capabilities that are otherwise impossible at scale.

We can audit every page simultaneously — running scripts that check title lengths, meta description completeness, missing fields, and content quality across hundreds of pages in seconds. We can update a field across all pages with a single script run. We can feed the JSON to AI models for review, scoring, and optimization without parsing HTML. We can generate new pages from the same schema with consistent structure every time.

The JSON schema is the intellectual foundation of the entire site. Getting it right at the start is more important than any individual page.

---

## Part 3 — The JSON Schema

### Schema design principles

Every field in our schema serves a specific consumer. Some fields serve human readers — the long-form differences sections, the character analysis, the verdict prose. Some fields serve Google's extraction systems — the snippet paragraph, the at-a-glance table, the bullet differences list. Some fields serve the pipeline itself — boolean flags, validation rules, schema version tracking. We never add a field without knowing which consumer it serves.

### Core identity fields

```json
{
  "slug": "gone-girl",
  "filename": "gone-girl.html",
  "lastUpdated": "2026-04-19",
  "pipelineVersion": "1",
  "generation": "v3",
  "canonicalUrl": "https://yourdomain.com/gone-girl"
}
```

The slug is the source of truth for URL structure. The canonical URL is explicit in the JSON — never generated — to prevent duplicate content issues. The generation field tracks which version of the pipeline produced this page, enabling rollback if a pipeline change degrades quality.

### SEO metadata fields

```json
{
  "pageTitle": "Gone Girl Book vs Movie: Pike's Face vs Flynn's Mind",
  "metaDesc": "Pike owns the screen. Flynn owns Amy's mind in prose. Both manipulate you — but the book reveals what the film can't show.",
  "primaryKeyword": "gone girl book vs movie",
  "secondaryKeywords": [
    "gone girl differences",
    "gone girl movie vs book",
    "gone girl ending explained"
  ],
  "targetQueries": [
    "gone girl book vs movie",
    "how is gone girl movie different from book",
    "should i read gone girl before watching"
  ]
}
```

Title rules: maximum 60 characters, hard limit. Must include the subject name and "Book vs Movie" or equivalent. Must have a specific hook or verdict — never generic. No ellipsis.

Meta description rules: maximum 150 characters, hard limit. Must answer the core search question directly. Must include one specific claim. No passive or academic tone. Should end with a verdict signal.

The keyword fields make intent explicit for the pipeline. When the AI generates the snippet paragraph, H2s, and FAQ questions, it uses these fields to align phrasing with real search queries rather than guessing from context.

### Snippet optimization fields

These are the fields that target Google's featured snippets, AI Overviews, and People Also Ask boxes. They represent the extraction layer of the page.

```json
{
  "winnerStatement": "The Gone Girl book is better than the 2014 film.",
  "hook": "Gone Girl's Amy is a literary creation. Rosamund Pike's Amy is a film icon. Both versions of Amazing Amy are essential.",
  "snippetParagraph": "The main difference between the Gone Girl book and the 2014 film is Amy's interior access. Gillian Flynn's novel gives you the full architecture of Amazing Amy's psychology — the diary, the childhood books, the constructed persona. David Fincher's film gives you Rosamund Pike's face. Both are masterworks. Read first to understand the mind. Watch to see it embodied.",
  "entities": [
    "Gillian Flynn",
    "Gone Girl",
    "David Fincher",
    "Rosamund Pike",
    "Ben Affleck"
  ]
}
```

The snippet paragraph is the single most important structural addition to any page. It should be under 100 words, written in declarative sentences, and structured as: main difference → verdict → read or watch first. This paragraph targets featured snippets, AI Overviews, and voice search responses simultaneously.

The winner statement is a single declarative sentence used for schema reinforcement and AI summary inclusion. The hook is a one-line emotional entry point for CTR and dwell time. The entities field ensures key people and works are named explicitly early in the content, which strengthens Google Knowledge Graph alignment.

### Structured extraction fields

```json
{
  "atAGlanceTable": [
    { "feature": "Amy's psychology", "book": "Full architecture — diary, backstory, Amazing Amy", "film": "Surface — Pike's performance carries it" },
    { "feature": "Nick's interiority", "book": "Self-pitying unreliable narrator", "film": "Deliberate blankness — Fincher's direction" },
    { "feature": "Amazing Amy", "book": "Central — shapes Amy's entire psychology", "film": "Brief mention — compressed" },
    { "feature": "The ending", "book": "Trap established across 400 pages", "film": "Same trap, less earned" }
  ],
  "keyDifferencesList": [
    { "label": "Amy's backstory", "text": "The Amazing Amy book series is central to the novel. The film compresses this to a few lines." },
    { "label": "Nick's voice", "text": "The novel gives you Nick's full unreliable interior. The film shows only his surface." },
    { "label": "The diary", "text": "Amy's diary is a fabrication revealed halfway through the novel. The film reaches the same twist with less buildup." }
  ]
}
```

The at-a-glance table targets featured snippets for comparison queries. Google's extraction systems favor tables for "X vs Y" queries specifically. Rules: 4-5 rows maximum, parallel structure in every row (both columns must have a non-null, comparable value — never "N/A"), punchy values not prose.

The key differences list targets People Also Ask boxes and AI Overview bullet extraction. Rules: 3-5 items, label is bold and specific, text is one sentence. This is the index layer — it exists alongside the long-form differences sections, not instead of them.

### Header optimization fields

```json
{
  "optimizedH2s": {
    "storyBrief":     "What is Gone Girl about?",
    "keyDifferences": "How is the Gone Girl movie different from the book?",
    "readFirst":      "Should you read Gone Girl before watching the movie?",
    "verdict":        "Is the Gone Girl book or movie better?"
  }
}
```

Generic section headers ("Key Differences", "Should You Read First?") are invisible to search engines. Question-format headers that match real search queries directly target People Also Ask appearances and long-tail ranking. The renderer substitutes these optimized H2s at render time — the source content is unchanged, only the heading text is updated.

### Social and technical fields

```json
{
  "og": {
    "title": "Gone Girl Book vs Movie: Pike's Face vs Flynn's Mind",
    "description": "Both manipulate you — but only the book shows you how Amy's mind actually works.",
    "image": "https://yourdomain.com/images/gone-girl-og.jpg",
    "imageAlt": "Gone Girl book cover and 2014 movie poster side by side"
  },
  "twitter": {
    "card": "summary_large_image",
    "site": "@yoursitehandle"
  },
  "images": {
    "bookCoverAlt": "Cover of Gone Girl by Gillian Flynn",
    "trailerThumbAlt": "Watch the Gone Girl 2014 movie trailer"
  }
}
```

Open Graph and Twitter Card tags control how pages appear when shared on social media. Without them, social shares display as plain URLs with no image, no title, no description. This costs both direct referral traffic and the editorial backlinks that come from writers and bloggers sharing well-formatted content. These fields are low effort and high impact — there is no reason to launch without them.

Image alt text serves both accessibility and SEO. Google uses alt text as an image ranking signal and for Google Images traffic. Every image on every page should have a descriptive, keyword-aligned alt text specified in the source JSON.

### Content fields

```json
{
  "quickAnswer": {
    "winner": "Book",
    "readFirst": "Yes",
    "oneLineReason": "Flynn gives you Amy's full psychology. Fincher gives you Rosamund Pike. Both are essential — but the novel built the trap."
  },
  "characters": [
    {
      "name": "Amy Dunne",
      "actor": "Rosamund Pike",
      "inBook": "Full psychological architecture — the Amazing Amy books, the diary fabrication, the constructed personas.",
      "inFilm": "Pike makes Amy physically terrifying in ways prose cannot — her performance adds a dimension the novel cannot have."
    }
  ],
  "differences": [
    {
      "title": "Amazing Amy's Role in Shaping Amy's Psychology",
      "question": "How does the Amazing Amy backstory differ between the Gone Girl book and movie?",
      "body": "Full long-form analysis..."
    }
  ],
  "faq": [
    {
      "question": "Should I read Gone Girl before watching the movie?",
      "answer": "Reading first gives you more time with Amy's diary voice, which makes the reveal more devastating..."
    }
  ]
}
```

The `differences[]` array is the intellectual core of each page. Each difference object must include a `question` field in question format — this feeds directly into the FAQ schema and PAA targeting. The long-form `body` is written for human readers and is the primary ranking signal for depth and expertise.

The FAQ section generates FAQPage schema markup, which is eligible for expanded rich results in search. Every question should match a real search query — not invented questions, but questions that appear in GSC data or People Also Ask boxes for the topic.

### Pipeline control fields

```json
{
  "hasSpoilerWarning":     true,
  "hasQuickAnswer":        true,
  "hasCharTable":          true,
  "hasAtAGlanceTable":     true,
  "hasSnippetParagraph":   true,
  "hasKeyDifferencesList": true,
  "hasOpenGraph":          true,
  "hasOptimizedH2s":       true,
  "_warnings":             [],
  "_warningCount":         0,
  "_schemaVersion":        "3.1"
}
```

Boolean flags tell the renderer which components to include. This enables per-page customization without changing the renderer code — a page without a trailer simply sets `hasTrailer: false` and the renderer skips that section. The `_warnings` array captures pipeline validation issues that were flagged but not blocking. The schema version enables the pipeline to apply version-specific rendering rules.

---

## Part 4 — The SEO Pipeline

### Step 1 — Content generation

For a new site, we begin by defining the content taxonomy — the complete list of pages the site will eventually cover, organized by topic cluster. For a comparison site this might be 200 specific comparisons organized into 10 pillar topics. For a product review site it might be 150 individual product reviews organized into 15 category hubs.

Each page is generated as a JSON file using a multi-model AI pipeline. The pipeline is structured so that different models handle different aspects of content generation based on their strengths. Editorial quality and voice consistency are handled by Claude Sonnet. Research and factual accuracy are verified by Gemini or Perplexity. The output is a validated JSON file that passes a schema compliance check before proceeding to rendering.

### Step 2 — Schema validation

Before any page is rendered to HTML, the JSON is validated against the schema. Validation rules include: title under 60 characters, meta description under 150 characters, snippet paragraph under 100 words, all required fields present, no cross-page content contamination in the review body, at-a-glance table rows have parallel structure.

Pages that fail validation are flagged and queued for correction rather than rendered with errors. This prevents bad content from reaching the live site.

### Step 3 — HTML rendering

The rendering engine transforms validated JSON into HTML using a deterministic template. The template injects all fields into their designated positions: snippet paragraph immediately after the H1, at-a-glance table before the character table, key differences list before the long-form sections, OG tags in the document head, FAQPage schema in the script block.

The renderer is the only place where JSON becomes HTML. Changes to page structure are made in the renderer and apply to all pages simultaneously. Changes to page content are made in the source JSON and apply only to that page.

### Step 4 — SEO review

After initial render, every page is passed through the multi-model SEO review pipeline. Three models independently score the title (1-10) and meta description (1-10) and suggest improvements. A Claude adjudicator reads all three sets of suggestions and writes the definitive final title and meta. The adjudicator prompt includes live GSC performance data — pages with high CTR or strong position receive conservative treatment, pages with zero traffic receive aggressive optimization.

Accepted changes are written back to the source JSON and the page is re-rendered. The review JSON is saved with timestamps for historical comparison.

### Step 5 — Full-page structural review

A separate full-page review pass evaluates the structural completeness of each page — does it have a snippet paragraph, an at-a-glance table, a key differences list, question-format H2s? Pages missing structural elements are queued for the `seo-llm-fullpage.js` pipeline, which generates the missing fields and writes them to the source JSON.

### Step 6 — Monitoring and iteration

Once live, every page is monitored via the daily GSC analysis script. The script fetches 28-day and 7-day performance data, identifies CTR opportunities and position improvements, and produces a structured JSON report with prioritized recommendations. Pages that gain impressions without clicks are automatically flagged for title and meta review. Pages that lose position week-over-week are flagged for content review.

---

## Part 5 — Content Customization for Different Sites

### How we adapt the schema for different content types

The schema described in this document was designed for a comparison site. The same principles apply to other content types, with field-level customization.

For a product review site, `bookTitle` and `filmTitle` become `productName` and `brand`. The `differences[]` array becomes `prosCons[]`. The `atAGlanceTable` becomes a feature comparison table. The `verdictText` becomes a recommendation rating. The structural principles — snippet paragraph, question H2s, entity reinforcement, OG tags — are identical.

For a travel site, content fields map to destinations, attractions, and itineraries. For a recipe site, they map to ingredients, techniques, and nutritional data. The pipeline architecture is the same. The schema is adapted.

### What we need from a client to start

To build an effective content system for a new site we need:

The complete content taxonomy — the full list of topics, pages, and categories the site will cover. The more specific, the better. "100 specific product comparisons" is actionable. "Product reviews" is not.

The target audience definition — who is searching, what they already know, and what decision they are trying to make. This determines content depth, vocabulary, and verdict framing.

The verdict framework — how does this site pick a winner? What criteria matter? For a comparison site the verdict is editorial. For a product site it might be price-to-value ratio. For a travel site it might be best-for-type. The verdict framework determines the `quickAnswer` and `winnerStatement` fields.

The brand voice — formal or conversational, opinionated or neutral, specialist or general. The AI generation pipeline maintains voice consistency across all pages but needs an initial voice brief to calibrate.

Existing content if applicable — if the client has existing articles, reviews, or data we can extract structured JSON from existing content and run it through the pipeline rather than generating from scratch. This is the fastest path for established sites.

### Expected timeline for a new site

Week 1 — Schema design, taxonomy definition, pipeline setup, first 20 pages generated and reviewed.

Week 2-3 — Full content generation across all planned pages, schema validation, initial render.

Week 4 — SEO review pipeline run across all pages, title and meta optimization applied, full-page structural review.

Month 2 — Site live, GSC monitoring active, first performance data available, iteration cycle begins.

Month 3 — First meaningful GSC data for optimization decisions, second SEO review pass based on real performance signals.

---

## Part 6 — What to Expect

### What this system does well

Coverage at scale — producing 150+ well-structured, consistent pages in weeks rather than months. Internal consistency — every page follows the same structural rules, which builds topical authority. Iteration speed — updating all pages when a structural improvement is identified takes hours, not weeks. Data-driven optimization — every change is based on GSC performance evidence, not intuition.

### What this system does not do

It does not replace editorial judgment. The pipeline generates content but human review is required before any page goes live. It does not guarantee top-3 rankings — search ranking depends on domain authority, competition, and factors outside the content itself. It does not work for every niche — highly competitive, high-authority niches require a different approach. This system is optimized for underserved niches where content quality and structural optimization can overcome domain authority gaps.

### Realistic traffic expectations for a new domain

Weeks 1-4: Crawling and indexing. Some pages may appear in position 30-60 for long-tail queries. No significant traffic.

Months 2-3: First-page appearances for low-competition long-tail queries. Initial clicks. CTR data available for optimization.

Months 4-6: Growing impression volume. Top-10 positions for targeted queries. CTR optimization cycle producing measurable results.

Months 6-12: Topical authority building. Broader head terms beginning to rank. Compounding growth as internal linking strengthens.

The exact timeline depends on niche competition, domain age, and content volume. The BooksVersusMovies.com experience showed first-page results within days for very specific long-tail queries on a new domain — but those results were for queries with minimal competition. More competitive niches take longer.

---

## Summary

We build content systems, not individual pages. Every page is a structured JSON file that feeds a deterministic rendering pipeline. The schema is designed to satisfy both human readers and Google's extraction systems simultaneously. The pipeline includes generation, validation, rendering, SEO review, structural review, and ongoing monitoring. The system is adaptable to any content niche with schema-level customization.

The foundation is always the same: clear intent targeting, extraction-friendly structure, consistent voice, and data-driven iteration. Get those four things right and the compounding begins.

---

*Prepared by RavensEdge AI LLC — andrew@ravensedge.ai*
