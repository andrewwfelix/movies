[//]: # (Destination: docs/strategy/new-ideas.md)
# BooksVersusMovies.com — New Ideas / Inbox
==========================================
Raw capture. Review periodically and promote to ROADMAP-TECHNICAL.md,
ROADMAP-PRODUCT.md, or business-strategy.md as appropriate.


****************************************************
priority next step !
****************************************************
1. Create an upcoming attractions page, sign up for full PDF (date) upcoming attractions. email address: how often would you like to receive upcoming movie updates?
2. upcoming attractions page should be the top 5, Sign up for information about all 50 upcoming attractionsimplement this email thing with survey monkey or whatever
update the index page toshow the now link
set up the tech stuff to implement the mailing list (mail chimp?)




## LLM Editor side project
Build a demo page for a friend showing multi-pass AI content generation.

Sections:
  1. Top 20 writing models and what they do best
  2. UI with 6 elements:
     - Prompt input
     - LLM 1 Writer output
     - LLM 2 Writer output
     - LLM Editor (reviews both writers)
     - LLM Reviews of writer 1, writer 2 and final comments
     - Final synthesised result

Demo mode: responses under 1 paragraph
Prod mode: full length for stage 3
Status: separate project, not BooksVersusMovies


## LLM client module (llm-client.js)
Extract all API call logic into a single shared module.
See ROADMAP-TECHNICAL.md for full spec.
Priority: high — do before Film Wins batch
Status: pending


## GSC export protocol
Establish exactly what to export from GSC, with what filters,
at what interval, and in what format.

WEEKLY (every Monday):
  Report: Performance > Search results
  Date range: Last 7 days
  Dimensions: Query + Page
  Filename: data/reports/gsc/YYYY-MM-DD-weekly-performance.csv

MONTHLY (1st of each month):
  Date range: Last 28 days
  Filename: data/reports/gsc/YYYY-MM-DD-monthly-performance.csv

POST-DEPLOYMENT (within 48 hours):
  Date range: Last 7 days, Page dimension
  Filename: data/reports/gsc/YYYY-MM-DD-post-deploy.csv

INDEXING STATUS (monthly):
  Report: Indexing > Pages — export each status group
Priority: medium
Status: pending


## GSC API automation
Automate GSC exports via Search Console API.
scripts/gsc-report.js --weekly / --post-deploy / --indexing
Also: URL inspection API to request indexing after deploy
Prerequisite: establish manual protocol first
Priority: low
Status: pending


## pipeline-browse.js improvements (from LLM advice review)
- Search bar above filters for direct title lookup
- "Hot Takes" section — Too Close to Call titles only (controversial)
- "Upcoming adaptations" rail sorted by release date
- Genre filter buttons (in addition to verdict filters)
Priority: medium
Status: pending


## Redirect the-maze-runner to the-maze-runner-film
the-maze-runner.html quarantined April 2026 (duplicate).
If /the-maze-runner indexed in GSC, add Netlify redirect:

  [[redirects]]
  from = "/the-maze-runner"
  to   = "/the-maze-runner-film"
  status = 301

Priority: low
Status: pending


## Read Before You Watch — email capture
Weekly email recommending one book/film pair.
Implementation: ConvertKit or Mailchimp (free tier)
Opt-in placement: after verdict box, bottom of browse page
pipeline-email.js generates weekly copy from JSON
featuredEmail: "YYYY-MM-DD" field in JSON schema
Priority: high
Status: pending


## pipeline-generate.js improvements
- Add --batch flag to process all inputs/ files in sequence
- Add cost estimation before running (token count × model price)
- Add --model flag to override config for single run
Priority: medium
Status: pending


## Serve from /reviews/ subdirectory
Move rendered HTML to reviews/, set Netlify publish to reviews/.
Cleaner separation of source and output.
Requires: updating renderer output path, moving assets, Netlify config
Priority: low
Status: pending


## Priority/hype field in JSON schema
Add priority: 1|2|3 to all JSON files.
Controls: browse order, spotlight eligibility, model assignment,
greenfield generation order.
Priority: high
Status: pending


## Featured/spotlight config
config/featured.json — ordered list of slugs for spotlight section.
Currently hardcoded in pipeline-browse.js DEFAULT_FEATURED.
Priority: medium
Status: pending


## Author hub pages
Auto-generated pages for authors with 2+ comparisons.
/author/stephen-king, /author/colleen-hoover etc.
Same pattern as pipeline-auteurs.js.
Priority: medium
Status: pending


## Genre hub pages
/genre/literary-fiction, /genre/thriller, /genre/romance
Auto-generated from existing JSON genre fields.
Priority: medium
Status: pending


## Social meta tags (Open Graph / Twitter Card)
Add og:title, og:description, og:image, og:type to every page.
Easy addition to pipeline-render.js renderHead().
Priority: medium
Status: pending


## WebP conversion
Batch convert images/*.jpg to .webp.
Update renderer to output <img src="images/slug.webp">.
Priority: medium — LCP improvement
Status: pending


## oneLineReason in browse rows
Add quickAnswer.oneLineReason as italic hook below row blurb.
One CSS + renderer change, high editorial impact.
Priority: high
Status: pending


## llm-client.js — shared LLM client
See ROADMAP-TECHNICAL.md for full spec.
Exports: callModel(), callModelSafe(), parseJSON(), loadEnv()
callModelSafe() = API call + jsonrepair + ajv validation + retry
Priority: high — before Film Wins batch
Status: pending
