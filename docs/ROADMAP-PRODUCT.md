# BooksVersusMovies.com — Product Roadmap
==========================================
Last updated: April 2026

Prioritised feature backlog for the site itself — user-facing improvements
to content, discovery, conversion, and engagement.
For raw ideas see docs/new-ideas.md.
For business actions see docs/business-strategy.md.


## High Priority — Pre-deployment

### Fix internal links to extensionless URLs
All internal links on the site must use /slug not /slug.html format.
Affects: browse page row links, related cards, header nav links.
pipeline-render.js and pipeline-browse.js already output correct format.
Action: verify all links in rendered output before deployment.

### Browse page filters
Client-side verdict filter already built into pipeline-browse.js:
  All / Book Wins / Film Wins / Too Close to Call
Verify it works correctly in browser before deployment.

### Canonical tags on all pages
Already implemented in pipeline-render.js.
Verify all rendered pages have correct canonical before deployment.


## High Priority — Post-deployment

### Read Before You Watch — email capture
Weekly email recommending one book/film pair. Clear verdict, one-line
reason, affiliate link. Builds audience independent of Google.

Implementation:
- Mailchimp or ConvertKit (both free up to 500-1000 subscribers)
- Opt-in form placed: after verdict box on review pages, bottom of
  browse page, dismissible top banner
- pipeline-email.js script generates weekly email copy from JSON
- Add featuredEmail: "YYYY-MM-DD" field to JSON schema

Email format:
  Subject: Read [Title] before you watch it
  Body: verdict, oneLineReason, 2-3 sentences from verdictBox,
        readFirst recommendation, affiliate link, link to full review

Every field already exists in the JSON — zero new content needed.
This is potentially the highest-converting traffic source.
Effort: ~2-3 hours for form + Mailchimp integration
Depends on: deployment complete

### Author hub pages
Auto-generated pages for authors with multiple comparisons on the site.
e.g. /author/stephen-king — all King adaptations ranked.
Drives internal linking, ranks for "[author] adaptations" queries.
Effort: ~half day (new pipeline script)
Depends on: pipeline-generate.js or standalone script

### Genre hub pages
Auto-generated pages for each genre.
e.g. /genre/literary-fiction, /genre/thriller, /genre/romance
Aggregate pages rank for broader queries, accumulate internal link equity.
Effort: ~half day
Depends on: author hub pages pattern established


## Medium Priority

### Spoiler-free mode
Toggle that hides the verdict badge and verdict box until reader clicks
"Show verdict". Useful for readers who want to form their own opinion first.
Simple CSS/JS toggle — no backend needed.
Effort: ~1 hour

### Reader verdict poll
"Do you agree with our verdict?" — thumbs up/down below the verdict box.
Shows community consensus. Builds engagement and return visits.
Requires: simple backend or third-party poll service (Typeform, etc.)
Effort: ~half day

### "What to read next" quiz
5-question taste quiz recommending 3 comparisons.
High engagement, shareable, drives discovery of less-visited pages.
Effort: ~half day (pure JS, no backend)
Depends on: nothing

### Upcoming adaptations page
/coming-soon — books being adapted with release dates.
Add upcomingAdaptation field to JSON schema for TBA pages.
Drives repeat visits as release dates approach.
Effort: ~2 hours

### Social meta tags
Add Open Graph and Twitter Card tags to every rendered page:
  og:title, og:description, og:image (book cover), og:type: article
Improves appearance when pages are shared on social media.
Already easy to add to pipeline-render.js renderHead() function.
Effort: ~30 minutes

### Print-friendly version
CSS @media print styles that hide nav, CTAs, trailer thumbnails.
Clean printable version of each review.
Effort: ~1 hour (CSS only)


## Low Priority

### Director filmography pages
/director/joe-wright — all Wright adaptations on the site.
Same pattern as author hub pages.
Depends on: author hub pages

### "vs" comparison pages
/gone-girl-vs-girl-on-the-train — which thriller book/film is better?
Cross-links two existing pages, ranks for comparison queries.
Effort: ~1 day (new content type, new schema fields)

### Reading progress tracker
"You've read 12 of 163 books on this site" — localStorage tracker.
Gamification, encourages return visits.
Effort: ~2 hours (pure JS)

### Goodreads integration
Show average Goodreads rating alongside site verdict.
Adds third-party credibility signal.
Requires: Goodreads API (or scraping — fragile)
Effort: ~half day

### Price tracking
Notify subscribers when a book drops below a target price on Amazon.
Requires: Amazon PA API, email infrastructure.
High effort, medium reward.
Effort: ~2 days
Depends on: email capture established
