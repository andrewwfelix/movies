File 1: docs/housekeeping-advice.md

Markdown# BooksVersusMovies.com — Housekeeping Advice

===========================================

Date: 2026-04-14



Before starting greenfield generation (pipeline-generate.js), we should clean up the project so the active workspace is focused and future debugging is easier.



\### Why do this now?

\- Reduces cognitive load when building the new greenfield pipeline

\- Prevents accidental use of outdated scripts

\- Makes the repository cleaner and more professional

\- Creates a clear separation between "legacy" and "current" code

\- Makes it easier for you (or anyone else) to understand the project later



\### Recommended Archive Strategy



Create this structure inside `scripts/`:

scripts/

├── archive/

│   ├── legacy/               ← Very early extraction and test scripts

│   ├── v1-pipeline/          ← First version of the full pipeline (Pass 1/2)

│   └── deprecated/           ← Scripts we know we will never use again

├── prompts/                  ← Keep active

├── pipeline-\*.js             ← Current production scripts (do NOT archive)

├── logger.js

├── quality-gate.js

├── pipeline-render.js

├── pipeline-browse.js

├── sitemap-generate.js

└── ... (new greenfield scripts will go here)

text### Rules for Archiving

\- \*\*Move, never delete\*\* — keep history

\- Add a clear comment at the top of every archived file explaining why it was archived and the date

\- Keep the archive folder committed to git

\- Update `completed-tasks.md` with a housekeeping entry



\### Specific Recommendations — What to Archive



\*\*High confidence to archive:\*\*

\- Old versions of `extract-metadata.js`

\- Early `pipeline-extract.js` or `html-to-json.js` versions

\- Very early `pipeline-revise.js` iterations (before quality gate + OpenRouter)

\- Any single-page test scripts

\- `fix-cta-titles.js` (if no longer needed)

\- Any other scripts with "old", "v1", "test", or "legacy" in the name



\*\*Keep active (do not archive):\*\*

\- Current `pipeline-render.js`

\- Current `pipeline-browse.js`

\- Current `pipeline-revise.js`

\- `quality-gate.js`

\- `logger.js`

\- `sitemap-generate.js`

\- All config files (`models.json`, etc.)



\### After Housekeeping

Once finished:

1\. Run `node scripts/tree.js` (or just `tree`) to verify the clean structure

2\. Commit with message: "Housekeeping: archive legacy scripts before greenfield pipeline work"

3\. Update `completed-tasks.md` with today's date and a short note



This cleanup should take 20–40 minutes and will make the next phase much smoother.



Do this on the `housekeeping` branch, then we can merge to main once you're happy.

How to Use

Create a new branch:Bashgit checkout -b housekeeping
Save the two files above:
docs/housekeeping-advice.md
scripts/housekeeping.js

Make the script executable (optional):Bashchmod +x scripts/housekeeping.js
Run it:Bashnode scripts/housekeeping.js
Review the scripts/archive/ folder, then update completed-tasks.md and commit.

Would you like me to adjust anything in either file before you run it? (For example, add more files to the archive list, change folder names, etc.)7.4sFast

