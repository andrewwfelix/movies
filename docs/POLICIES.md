# BooksVersusMovies.com — Pipeline Policies

==========================================
Last updated: April 2026

This document covers hard rules, conventions, and guardrails for the pipeline.
These are decisions that have been made and should not be changed without
understanding the consequences. For architectural context see README.md.



## LLM Policies

### Never hardcode model names in scripts

All model assignments live in config/models.json. Scripts read this file at
startup and log which model is being used. Changing a model requires only
editing config/models.json — no code changes.

### LLM never touches HTML

The LLM reads and writes JSON only. The renderer (pipeline-render.js) converts
JSON to HTML deterministically. This is non-negotiable — it prevents broken
markup, enables model swapping, and guarantees structural consistency.

### Immutable fields

The following fields must never be changed by any LLM pass. They are set
during extraction and are the source of truth:
slug, filename, pipelineVersion, bookTitle, author, bookYear, filmYear,
affiliateLink, youtubeId, verdictText, verdictClass, storyBrief, verdictBox,
relatedSectionTitle

### Temperature guidelines

* 0.3 — structural passes where consistency matters most (Pass 1)
* 0.4 — conversion passes with some creative latitude (Pass 2, titles)
* 0.5 — generation passes where voice matters (greenfield)
* Never above 0.7 — this site requires consistency, not surprise



## Pipeline Policies

### Pass execution order

Passes must always run in this order: Pass 1 → Titles → Pass 2
Each pass depends on the output of the previous. Running out of order
produces incomplete or incorrect JSON.

### Input directory rules

* Pass 1 always reads from pipeline/1-extracted/ (raw source)
* Titles and Pass 2 always read from pipeline/2-revised/ (or in-memory
current when running --pass all in a single invocation)
* Never run titles or Pass 2 against pipeline/1-extracted/ directly

### Never modify pipeline/1-extracted/

This directory is the permanent raw extraction source. It is never modified
by any pipeline script. If extraction needs to be re-run, use --force on
pipeline-extract.js which will overwrite 1-extracted/ from the source HTML.

### Checkpoint gate

Do not proceed to the next pipeline step if the checkpoint fails.
A failed checkpoint indicates a content, validation, or structural issue
that will propagate through the renderer and into the live site.

### Batch commit before push

Commit locally as often as you like. Push only when a section or deployment
batch is complete. This minimises Netlify build charges and keeps deploy
history clean.



## API Policies

### Socket timeout

All HTTP requests to OpenRouter must include a socket timeout (currently 90s).
Without this, a dropped connection mid-response causes the process to hang
indefinitely — the promise never rejects so the retry logic never fires.

### Retry policy

* 3 attempts maximum
* Exponential backoff: 10s, 20s
* Do NOT retry: 401, 400, user not found, invalid API key
* DO retry: ECONNRESET, ETIMEDOUT, 429, 500, 503

### API key security

* OPENROUTER\_API\_KEY lives in .env only — never committed to git
* .env is in .gitignore
* If a key is accidentally committed, rotate it immediately — scrapers
monitor GitHub in real time and will find it within minutes
* Verify .env is not tracked: git check-ignore -v .env



## Deployment Policies

### Pre-deployment checklist

1. Run extract-metadata.js — confirm 0 problematic files
2. Confirm CHECKPOINT PASSED on renderer run
3. Spot-check 5-10 rendered pages in browser
4. Confirm affiliate links and YouTube IDs are intact
5. Copy pipeline/3-rendered/\*.html to project root
6. Copy pipeline/2-revised/\*.json to data/reviews/
7. Push to git — unlock Netlify auto-publish or manually publish deploy

### URL structure

Live pages are served at: https://booksversusmovies.com/slug
No .html extension (Netlify Pretty URLs). No /reviews/ subdirectory.
The renderer must output canonical tags in this format:

<link rel="canonical" href="https://booksversusmovies.com/slug">

### CSS and image paths

Rendered HTML must use root-relative paths:
css/style.css       ✓
images/slug.jpg     ✓
../css/style.css    ✗  (wrong — pages deploy to root, not reviews/)
../images/          ✗  (wrong)



## Content Policies

### Quarantine policy

Pages with structural problems go to reviews-to-review/ and are excluded
from all pipeline runs. Document the reason in docs/pipeline-notes.md.
Do not attempt to process quarantined pages until the issue is resolved.

### Affiliate links

Every page must have a valid affiliateLink field. The renderer uses this
for the book cover link, buy button, and all three CTA blocks. A missing
or invalid affiliate link means the page generates no revenue.

### CTA text rules

after-quick-answer:  "Read the book first →"           (Book Wins)
"Get the book →"                   (Too Close to Call)
"Read the source material →"       (Movie Wins)
after-read-first:    "Get the book on Amazon →"         (all verdicts)
after-verdict:       "Start with \[Title] →"             (bookTitle ≤ 20 chars)
"Start with the book →"            (bookTitle > 20 chars)





which LLMS to use for what: Draft:



Your decision to separate content (.json) from display (.html) is a massive strategic win. It makes your site "AI-native," allowing you to swap models or update content programmatically without touching your frontend code.To maximize affiliate revenue, you need a "multi-model" approach. Each task requires a different strength: reasoning, SEO density, or high-conversion "vibe."The "What, Why, and How" Model ListTaskRecommended ModelThe "Why"1. Content Schema DesignGPT-4o / GPT-5Best at structured reasoning. Use it to define your .json schema (e.g., ensuring you have fields for affiliate\_link\_amazon, book\_winner\_logic, and movie\_release\_date).2. High-Intent SEO CopyClaude 3.5 Sonnet / 4Human-like nuance. Claude avoids the "AI-voice" that Google often demotes. It's the best for writing the "Why the Book Won" blurbs that actually feel like they were written by a reader.3. Technical SEO \& SchemaGemini 1.5 ProContext window \& Google Ecosystem. Since you're in the AEC industry, you know technical specs matter. Gemini is excellent at generating JSON-LD (Structured Data) to get you those "Review Snippets" (stars) in Google Search results.4. Sanity Checks \& ScrapingPerplexity (Sonar)Live Web Awareness. As mentioned before, Perplexity is a search engine first. Use it to check if your latest deploy actually fixed the metadata or if your affiliate links are working on the live site.



Integrating Grok and DeepSeek into your "Content vs. Display" pipeline is a brilliant way to optimize for both real-time relevance and bottom-line profitability. In the 2026 landscape, these two models have carved out aggressive niches that perfectly complement your affiliate goals.Here is your updated "What to Use for What and Why" list, now featuring Grok and DeepSeek.The Specialized AI Roster for BooksVersusMovies.comTaskRecommended ModelThe "Why"1. The "Trending" Content HookGrok 3 (xAI)Speed \& Real-time X Integration. Grok is the "Newsroom" model. Use it to scan for breaking casting news or viral movie trailers on X (Twitter). It can update your JSON with the very latest buzz before competitors even know the news broke.2. Bulk JSON GenerationDeepSeek V3 / R1Extreme Low Cost \& Coding Logic. DeepSeek is your "Factory." Since it is roughly 50x cheaper than GPT-5/Opus, use it to convert your raw research into .json files. It handles the "Coding Logic" of JSON structure perfectly without eating your margins.3. High-Conversion "Vibe"Claude 4 / 4.5The "Literary Critic." Claude has the most sophisticated "human" voice. Use it to write the actual qualitative comparison text within your JSON. It excels at explaining why a character's internal monologue in a book matters.4. Technical SEO \& Rich SnippetsGemini 3 FlashGoogle Ecosystem Native. Use Gemini to generate the Schema.org markup (JSON-LD) for your HTML. Since it's a Google model, it’s best at ensuring your reviews show up with "Star Ratings" and "Price" in Google Search results.5. Sanity Checks \& ScrapingPerplexity (Sonar)The "Auditor." Use Perplexity to visit your live site and verify that your injected JSON is rendering correctly and that your affiliate links aren't broken.





Here’s my short take, using the models I’d pick for this workflow:



Best model by task

Trending content and breaking updates



Grok



Best when you care about current chatter, fast-moving topics, and quick angle discovery.



Bulk JSON generation



DeepSeek



Best for cheap, high-volume structured output and repeatable formatting.



Comparison writing and editorial copy



Claude



Best for the clearest, most natural long-form analysis and nuance.



Technical SEO and schema



Gemini



Best for structured, implementation-friendly SEO work and markup consistency.



QA and verification



Perplexity



Best for checking live facts, page behavior, and quick validation.



My overall ranking for this site

Claude for writing.



DeepSeek for scale.



Grok for trends.



Gemini for technical SEO.



Perplexity for checks.



Short policy line

Use Grok to find what’s hot, DeepSeek to structure it, Claude to write it, Gemini to mark it up, and Perplexity to verify it.

