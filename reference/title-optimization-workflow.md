Title \& Metadata Optimization Workflow - BooksVersusMovies.com



1\. Export current metadata

&#x20;  Run: node scripts/utils/export-seo-metadata.js

&#x20;  Output: data/reports/seo-metadata-for-review.csv



2\. Review and improve titles with LLM

&#x20;  Upload the exported CSV to Claude Sonnet (recommended) or your preferred model

&#x20;  Use the prompt saved at: scripts/prompts/review-titles.txt

&#x20;  Ask LLM to score each title/meta, suggest improvements, and explain changes

&#x20;  Save the LLM output as: data/reports/seo-metadata-reviewed.csv



3\. Import the improved titles and metas

&#x20;  Run: node scripts/utils/import-titles.js --csv data/reports/seo-metadata-reviewed.csv

&#x20;  First test safely with dry run:

&#x20;  node scripts/utils/import-titles.js --csv data/reports/seo-metadata-reviewed.csv --dry



4\. Re-render all HTML pages

&#x20;  Run: node scripts/pipeline/pipeline-render.js --all --force

&#x20;  (or whatever your main render command is)



5\. Verify changes

&#x20;  Spot-check several important pages (especially high-impression ones like verity.html, reminders-of-him.html, animal-farm.html)

&#x20;  Confirm <title> and <meta name="description"> tags are updated correctly



6\. Deploy the site

&#x20;  Push changes and deploy



7\. Monitor performance

&#x20;  Wait 7–14 days, then check Google Search Console for CTR and impression changes on updated pages



Notes:

\- Always run the import in --dry mode first to review changes

\- Keep the original exported CSV as backup

\- Update sitemap if needed after render

\- This process is ad-hoc (run when you want to improve titles in bulk)

