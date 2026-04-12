# BooksVersusMovies.com — New Ideas
====================================
Format: ## Title, Priority: high/medium/low, Status: pending/in-progress/done/deferred
Ideas marked done or deferred are excluded from generate-next-steps.js output.


## Affiliate link management interface
Build a simple interface to manage affiliate links — similar to what WordPress
affiliate plugins provide. Reduce friction when adding or updating Amazon links
across pages. Could be a simple local web UI that reads/writes the JSON files.
Priority: medium
Status: pending

## Template this project for other affiliate niches
The pipeline architecture (extract → revise → render) is generic enough to
template for other book/product review niches. Could be a meaningful side
project or productised offering.
Priority: low
Status: pending

## Overnight batch processes
Consider scheduled tasks that run automatically:
  a. Update lastUpdated dates on HTML files / JSON records
  b. Broken link checker — scan all internal and affiliate links for 404s
Priority: medium
Status: pending

## Fix-all / sync script
A script that detects when new movies have been added or existing pages
updated and runs the appropriate pipeline passes automatically. Something
like: compare pipeline/2-revised/ timestamps against reviews/ and flag
anything out of sync.
Priority: medium
Status: pending

## Log all pipeline output to logs directory
Ensure every pipeline script writes to logs/ consistently. Currently
pipeline-revise does this via logger.js but worth auditing all scripts
including future ones follow the same convention.
Priority: low
Status: pending

## Retry logic for API calls
Add 2-3 automatic retries with exponential backoff to OpenRouter API calls
in pipeline-revise.js. Handles brief internet disconnections and latency
spikes gracefully without failing a full batch run.
Also added 90-second socket timeout to prevent indefinite hangs on
dropped connections — retry logic only fires if the promise rejects,
which requires a timeout when the socket silently drops mid-response.
Priority: high
Status: done

## Structured logging — Pino + OpenTelemetry
Evaluate transition from current custom logger.js to Pino for structured
JSON logging, with OpenTelemetry for tracing and Datadog or Loki for
aggregation. Worth doing if/when pipeline runs become frequent or team
grows beyond solo.
Priority: low
Status: pending

## Evaluate Vercel migration
Consider moving from Netlify to Vercel. Vercel's edge functions and
database integrations (Postgres via Vercel Storage) could support a
proper movie database — structured data for books, films, directors,
actors — rather than flat JSON files. Would unlock more sophisticated
features and potentially a more maintainable architecture long term.
Priority: low
Status: pending

## Movie database architecture
Related to Vercel migration — think about building and maintaining a
structured movie/book database. Benefits: richer internal linking,
genre pages, author pages, director pages, better search. Significant
scope increase but natural evolution of the project.
Priority: low
Status: pending

## Daily GSC review task
Add a daily or weekly routine: review newly indexed pages in GSC,
request indexing for recently deployed pages, monitor for any
unexpected de-indexing. Could be partially automated with GSC API.
Priority: medium
Status: pending

## Handle series and multi-book scenarios
Several pages cover scenarios that aren't clean one-to-one comparisons:
  - Dune: three books in series, two films + more planned
  - Lord of the Rings: trilogy
  - Heated Rivalry: multiple books in series
  - Hannibal: series of books vs series
Need a content strategy and possibly a schema extension to handle
these well. Currently treated as single comparisons which undersells
the complexity.
Priority: medium
Status: pending

## Environment-based model config
Maintain separate model config files for different environments:
  config/models.json       ← prod (Haiku + Sonnet, current)
  config/models.test.json  ← test/logic check (DeepSeek, all passes)
  config/models.dev.json   ← dev (smallest/cheapest, single page testing)

Add --env flag to pipeline scripts:
  node scripts\pipeline-revise.js --slug atonement --pass all --env test
  node scripts\pipeline-revise.js --all --pass all --env prod

Script resolves config/models.${env}.json and falls back to
config/models.json if the env-specific file doesn't exist.
Clean 30-minute addition once the pipeline is stable.
Priority: medium
Status: pending

## Per-pass subdirectories for pipeline/2-*
Lesson learned from IN_DIR bug — each pass should write to its own folder:
  pipeline/2a-pass1/    ← Pass 1 output
  pipeline/2b-titles/   ← titles pass output
  pipeline/2c-pass2/    ← Pass 2 output
  pipeline/2-revised/   ← final merged output (all passes applied)

Each pass reads from the previous folder, nothing ever gets overwritten.
Enables independent re-runs of any single pass without affecting others.
Currently mitigated by --pass all running in memory, but proper folder
separation would be more robust.
Priority: medium
Status: pending
