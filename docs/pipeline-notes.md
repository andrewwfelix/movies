BooksVersusMovies.com — Pipeline Notes
=======================================

OVERVIEW
--------
The pipeline converts review content through three stages before deployment.
Each stage has a dedicated folder under pipeline/ for inspection and debugging.

  pipeline/1-extracted/   Raw JSON extracted from existing HTML pages
  pipeline/2-revised/     JSON after LLM revision passes (Pass 1 + Pass 2)
  pipeline/3-rendered/    Final HTML ready for deployment to reviews/

The canonical source of truth for all review content is data/reviews/.
Once the pipeline is running, HTML files in reviews/ should never be
hand-edited — all changes go through the pipeline.


PIPELINE STAGES
---------------

Stage 1 — Extraction (html-to-json.js)
  Input:  reviews/*.html
  Output: pipeline/1-extracted/*.json
  Notes:  One-time operation to bootstrap the JSON layer from existing HTML.
          Subsequent new reviews enter at data/reviews/ directly via the
          greenfield pipeline (generate.js).

Stage 2 — Revision (revise.js)
  Input:  pipeline/1-extracted/*.json  (or data/reviews/*.json for re-runs)
  Output: pipeline/2-revised/*.json
  Passes:
    Pass 1 — Structural overlay
      - Generates quick-answer block
      - Verifies FAQ quality and coverage
      - Checks CTA placement against decision moments
    Pass 2 — Conversion layer
      - Improves CTA wording (intent-driven language)
      - Adds mid-article CTAs after answer, recommendation, and verdict sections
  Notes:  Run Pass 1 on a single page and review JSON output before scaling.
          Adjust prompt before running Pass 2 or processing more pages.

Stage 3 — Render (render.js)
  Input:  pipeline/2-revised/*.json
  Output: pipeline/3-rendered/*.html
  Notes:  Deterministic — no LLM involvement. Structure, CSS classes, affiliate
          link injection, and schema markup are all controlled here.
          Validate against three known-good pages before full run.


DEPLOYMENT
----------
When pipeline/3-rendered/ output is approved:
  - Copy files to reviews/
  - Re-run extract-metadata.js as final QA pass
  - Confirm no missing fields in metadata.csv before publishing


PROMPT VERSIONING
-----------------
Prompts are stored as plain text in scripts/prompts/ so they can be edited
independently of the pipeline code.

  pass1-structural.txt    — Pass 1 system + user prompt
  pass2-conversion.txt    — Pass 2 system + user prompt
  greenfield.txt          — New review generation prompt

When modifying prompts, note the version, date, and reason for change below.

Prompt Change Log
-----------------
  [date] [file] [version] — [reason for change]


MODEL ROUTING
-------------
Current assignments (update as testing informs decisions):

  Extraction (html-to-json.js)  — not LLM-dependent
  Pass 1 structural              — TBD
  Pass 2 conversion              — TBD
  Greenfield generation          — TBD

Notes on model evaluation:
  - Test Pass 1 and Pass 2 with at least two models before committing
  - Evaluate on: voice preservation, structural consistency, CTA quality
  - Cheaper models are acceptable for Pass 2 (CTA/FAQ) if voice holds


KNOWN ISSUES AND DECISIONS
---------------------------
  - director field is optional for TV series pages (series have no single director)
  - book year "800 BC" and similar non-standard dates require special handling
    in extract-metadata.js
  - wild.html moved to reviews-to-review — related cards contained placeholder slugs
  - spotlight.html deleted — was index page spotlight feature, not a review
  - twilight.html and unbroken.html moved to reviews-to-review — v1 generation,
    missing FAQ and character table, will be regenerated via greenfield pipeline
  - dune.html / dune-improved.html and similar duplicate slugs deferred to
    reviews-to-review for manual resolution
