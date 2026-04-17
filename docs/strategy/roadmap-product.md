[//]: # (Destination: docs/strategy/roadmap-product.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, dates YYYY-MM-DD, status: not-started|in-progress|done|blocked, priority: high|medium|low, effort in plain text, no escaped chars)

# BooksVersusMovies.com — Product Roadmap
Last updated: 2026-04-17

User-facing feature backlog — content, discovery, conversion, engagement.
For raw ideas see docs/strategy/new-ideas.md.
For business actions see docs/strategy/business-strategy.md.

---

## High Priority

### /how-we-judge page
Status: not-started
Priority: high
Effort: half day

Short editorial standards page explaining how verdicts are reached. Links to pillar pages. Builds trust signal and ranks for "how are book vs movie adaptations judged" queries.

### Recently added section on browse page
Status: not-started
Priority: high
Effort: 2 hours

Surfaces newly published pages (Film Wins batch, new greenfields) at top of browse/index page. Signals freshness to Google and gives returning visitors something new.

### Beehiiv newsletter — DNS + welcome email
Status: in-progress
Priority: high
Effort: 1 hour

- [ ] Set up custom domain DNS for Beehiiv publication
- [ ] Write and configure welcome email for new subscribers
- Reference: https://www.beehiiv.com/support/article/14492990172823-how-to-use-a-custom-domain-for-your-publication

### Email capture — ConvertKit opt-in form
Status: not-started
Priority: high
Effort: 2-3 hours
Depends on: deployment complete

Weekly email recommending one book/film pair. Every field already exists in the JSON — zero new content needed.

### Author hub pages
Status: not-started
Priority: high
Effort: half day

Auto-generated pages for authors with multiple comparisons.
e.g. /author/stephen-king — all King adaptations ranked.
Drives internal linking, ranks for "[author] adaptations" queries.

### Genre hub pages
Status: not-started
Priority: high
Effort: half day
Depends on: author hub pages pattern established

e.g. /genre/literary-fiction, /genre/thriller, /genre/romance

---

## Medium Priority

### Spoiler-free mode
Status: not-started
Priority: medium
Effort: 1 hour

Toggle that hides verdict badge and verdict box until reader clicks "Show verdict". CSS/JS only, no backend.

### Reader verdict poll
Status: not-started
Priority: medium
Effort: half day

"Do you agree with our verdict?" — thumbs up/down below verdict box. Requires simple backend or third-party poll service.

### What to read next quiz
Status: not-started
Priority: medium
Effort: half day

5-question taste quiz recommending 3 comparisons. High engagement, shareable, pure JS.

### Social meta tags
Status: not-started
Priority: medium
Effort: 30 minutes

Add og:title, og:description, og:image, og:type to every rendered page. Easy addition to pipeline-render.js renderHead().

### Print-friendly CSS
Status: not-started
Priority: medium
Effort: 1 hour

@media print styles that hide nav, CTAs, trailer thumbnails.

---

## Low Priority

### Director filmography pages
Status: not-started
Priority: low
Depends on: author hub pages

/director/joe-wright — all Wright adaptations on the site.

### "vs" comparison pages
Status: not-started
Priority: low
Effort: 1 day

/gone-girl-vs-girl-on-the-train — which thriller book/film is better? New content type, new schema fields.

### Reading progress tracker
Status: not-started
Priority: low
Effort: 2 hours

"You've read 12 of 163 books on this site" — localStorage tracker.

### Goodreads integration
Status: not-started
Priority: low
Effort: half day

Show average Goodreads rating alongside site verdict. Requires Goodreads API.

### Price tracking
Status: not-started
Priority: low
Effort: 2 days
Depends on: email capture established

Notify subscribers when a book drops below a target price on Amazon.

---

## Done

- [2026-04-13] Browse page filters — All / Book Wins / Film Wins / Too Close to Call
- [2026-04-13] Canonical tags on all pages
- [2026-04-14] Upcoming adaptations page — /upcoming-adaptations
- [2026-04-14] Spotlight pages — 6 live including Reminders of Him
- [2026-04-17] Pillar pages — 10 live, indexed
- [2026-04-17] Featured hub page — /featured
- [2026-04-17] Dashboard — /dashboard with GSC analytics
