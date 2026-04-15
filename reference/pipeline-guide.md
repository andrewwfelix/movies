# BooksVersusMovies.com — Pipeline Guide
==========================================
Last updated: April 15 2026
Destination: docs/reference/pipeline-guide.md

This is the plain-English guide to the scripts folder. What everything does,
and how to generate and deploy a new movie review from scratch.

---

## Scripts Folder Overview

```
scripts/
  pipeline-greenfield.js     ← generates a brand new review (start here for new movies)
  pipeline-revise.js         ← rewrites existing reviews (Pass 1 + Pass 2)
  pipeline-render.js         ← turns JSON into HTML pages
  pipeline-browse.js         ← rebuilds index.html (the browse/home page)
  pipeline-spotlight.js      ← generates a spotlight feature page
  pipeline-guide.js          ← generates the upcoming adaptations guide page
  pipeline-post.js           ← runs browse + sitemap + nav check in one command

  utils/
    logger.js                ← shared logging module (used by other scripts)
    deploy.js                ← copies files from Downloads/files/ to project
    add-destination.js       ← stamps scripts with Destination: comments
    archive-logs.js          ← moves old logs to logs/archive/
    pipeline-clear.js        ← deletes all pipeline files for a given slug
    quality-gate.js          ← validates JSON output quality
    validate-json-schema.js  ← validates JSON against schema
    tree.js                  ← prints project folder structure

  ops/
    check-nav.js             ← verifies nav is consistent across all pages
    fix-nav.js               ← fixes nav on any pages that are out of sync
    sitemap-generate.js      ← generates sitemap.xml
    fix-titles-book-vs-movie.js  ← one-time: added "Book vs Movie" to all titles
    fix-cta-titles.js        ← fixes CTA title formatting
    housekeeping.js          ← general cleanup tasks
    check-fields.js          ← checks required JSON fields across all reviews

  content/
    generate-review.js       ← generates a review JSON (older method)
    html-to-json.js          ← converts old HTML reviews to JSON format
    generate-next-steps.js   ← generates a next steps briefing doc
    consolidate-docs.js      ← consolidates docs into a single file
    log-all-titles.js        ← logs all page titles
    export/ import-titles.js ← imports/exports title data

  reporting/
    dashboard.js             ← prints a summary dashboard of all reviews
    get-advice.js            ← asks an LLM for site improvement advice
    review-pipeline-output.js ← reviews the quality of pipeline output
    get-todays-changes.js    ← summarises what changed today

  prompts/                   ← text prompts used by the pipeline scripts
  archive/                   ← old scripts no longer in use
```

---

## Config Files

```
config/
  nav.json        ← single source of truth for site navigation
  models.json     ← which LLM model to use for each pipeline step
```

`.env` in the project root holds your `OPENROUTER_API_KEY`.

---

## How to Generate and Deploy a New Movie Review

### The complete sequence from zero to live

**Step 1 — Run the greenfield pipeline**

This is the single command that does everything: generates the review JSON,
fixes any long titles, converts to HTML, and copies the file to the project root.

```
node scripts\pipeline-greenfield.js --slug fight-club
```

Replace `fight-club` with the slug for your movie (lowercase, hyphens, no spaces).
The slug becomes the URL: `booksversusmovies.com/fight-club`

What happens internally:
- Pass 1: an LLM reads the prompt in `scripts/prompts/pass1b-titles.txt` and
  generates a structured JSON review saved to `pipeline/2-revised/fight-club.json`
- Titles pass: validates and auto-fixes the page title if it's too long
- Pass 2: a second LLM pass improves the writing quality
- Render: `pipeline-render.js` converts the JSON to `fight-club.html` in the project root

**Step 2 — Review the page**

Open `fight-club.html` in your browser and check:
- Title and meta description look correct
- Book cover image is present (check `images/fight-club.jpg` exists)
- Verdict box shows the correct winner
- Affiliate buy link is present
- Related reviews at the bottom look sensible

**Step 3 — Run post-processing**

```
node scripts\pipeline-post.js
```

This runs three things in order:
1. Rebuilds `index.html` with the new page included (167 → 168 pages)
2. Updates `sitemap.xml` with the new URL
3. Checks nav consistency across all pages

**Step 4 — Commit and deploy**

```
git add .
git commit -m "feat: fight-club book vs movie review"
git checkout main
git merge dev
git push
git checkout dev
```

Netlify auto-deploys on push to main. The page is live within ~30 seconds.

**Step 5 — Request indexing in GSC**

Go to Google Search Console → URL Inspection → paste the URL →
Request Indexing. Do this for new pages to get them indexed faster.

---

## Other Common Tasks

### Re-render a page from existing JSON (no API call, free)
```
node scripts\pipeline-render.js --slug fight-club
```
Use this if you change the HTML template and want to update the page
without regenerating the content.

### Regenerate a review from scratch (overwrites existing)
```
node scripts\pipeline-greenfield.js --slug fight-club --force
```

### Generate a spotlight feature page
```
node scripts\pipeline-spotlight.js --slug fight-club
```
Spotlight pages are the richer feature articles that appear under
"Featured" in the nav. They pull the affiliate link automatically
from the existing review JSON.

### Check that all pages have consistent nav
```
node scripts\ops\check-nav.js
```

### Fix nav on pages that are out of sync
```
node scripts\ops\fix-nav.js
```

### Rebuild just the browse index (index.html)
```
node scripts\pipeline-browse.js
```

### Rebuild just the sitemap
```
node scripts\ops\sitemap-generate.js
```

### See how many reviews exist and their status
```
node scripts\reporting\dashboard.js
```

### Deploy files from Downloads after editing
Put edited files in `Downloads\files\` then:
```
node scripts\utils\deploy.js --write
```
The script reads the `Destination:` comment at the top of each file
and copies it to the correct location in the project.

---

## Pipeline Folder Structure

The `pipeline/` folder holds intermediate files — not deployed to the site.

```
pipeline/
  1-extracted/    ← raw JSON extracted from original HTML (legacy, mostly unused now)
  2-revised/      ← the canonical JSON for every review — this is the source of truth
```

Every review JSON in `pipeline/2-revised/` has this structure:
- `slug` — URL identifier (e.g. fight-club)
- `pageTitle` — the HTML title tag
- `h1` — the display heading on the page
- `metaDesc` — meta description (max 160 chars)
- `verdict` — "book" / "film" / "tie"
- `affiliateLink` — Amazon buy link
- `relatedSlugs` — array of related review slugs
- `lastUpdated` — date last modified

---

## Input JSON for a New Review

When using the greenfield pipeline, you can optionally provide an input JSON
to pre-seed details like the affiliate link. Place it in `pipeline/1-extracted/`
as `fight-club.json` before running the greenfield script.

Minimum required fields:
```json
{
  "slug": "fight-club",
  "title": "Fight Club",
  "year": 1999,
  "director": "David Fincher",
  "author": "Chuck Palahniuk",
  "affiliateLink": "https://amzn.to/xxxxx"
}
```

---

## Troubleshooting

**"Source directory not found"** — a script is looking for a folder that doesn't
exist. Check the path constants at the top of the script. After the scripts
reorganization, paths use `../../` to go up from `scripts/ops/` or `scripts/utils/`
to the project root.

**"Schema validation failed: metaDesc must NOT have more than 160 characters"** —
the pipeline auto-truncates this now. If you see it, just re-run.

**"Could not parse JSON response"** — the LLM returned malformed JSON. Re-run
the command — Haiku occasionally fails on complex pages. A second attempt almost
always succeeds.

**Missing book cover image** — add a JPG to `images/<slug>.jpg`. The pipeline
won't fail without it but the page will have a broken image. File should be
roughly 300×450px.
