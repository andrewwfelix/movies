[//]: # (Destination: docs/team/onboarding.md)

# BooksVersusMovies.com — Helper Onboarding
==========================================
Last updated: April 17 2026


## What This Site Is

BooksVersusMovies.com publishes honest book vs movie comparisons. Every page
picks a winner — Book Wins, Film Wins, or Too Close to Call — and explains why.
The site has ~180 pages live, is indexed by Google, and earns affiliate revenue
when readers buy books through Amazon links on the site.

The site is built as static HTML — no CMS, no WordPress. Pages are generated
by Node.js pipeline scripts from JSON data files, then deployed to Netlify.


## Folder Structure (What Matters)

```
movies/
├── data/
│   ├── reviews/          ← One JSON file per review (the source of truth)
│   ├── greenfield/       ← Input JSONs for new pages not yet generated
│   ├── pillars/          ← JSON files for pillar/guide pages
│   └── reports/          ← Audit and export reports
├── images/               ← Book cover images (slug.jpg format)
├── scripts/              ← All pipeline and utility scripts
├── config/               ← Site config (nav, models, pillars)
├── docs/                 ← Documentation (you are here)
└── *.html                ← Live rendered pages in project root
```

The most important folder for content work is `data/reviews/` — this is where
all review data lives. Every page on the site has a corresponding JSON here.


## Key Concepts

**Slug** — the URL-friendly name for a page. e.g. `reminders-of-him` is the
slug for booksversusmovies.com/reminders-of-him. It's also the filename for
the JSON (`data/reviews/reminders-of-him.json`) and the image (`images/reminders-of-him.jpg`).

**Greenfield JSON** — a minimal input file for a new page that hasn't been
generated yet. Lives in `data/greenfield/`. Contains 5 fields: bookTitle,
slug, affiliateLink, youtubeId, videoAffiliateLink.

**Affiliate link** — an Amazon link with the site's tracking ID appended.
Format: `https://www.amazon.com/dp/ASIN/?tag=readingtheill-20`
The tracking ID is always `readingtheill-20`.

**Pipeline** — the set of Node.js scripts that generate HTML from JSON data.
You don't need to run the pipeline. Your job is to prepare the input data.


## What You Don't Need to Know

- How to write or run Node.js scripts
- How the pipeline works internally
- How to deploy to Netlify
- How to edit HTML directly

All of that is handled by the site owner. Your tasks are data preparation
and content research — no code required.


## Tools You'll Need

- A text editor (VS Code, Notepad++, or similar)
- A web browser
- Access to Amazon.com
- Access to YouTube
- The slug list provided in tasks.md


## How to Ask Questions

If something is unclear, check `docs/team/` first. If the answer isn't there,
ask the site owner before guessing. It's faster to ask than to fix a mistake
after the pipeline has run.
