# Feature: Upcoming Guide Email Capture
========================================
Last updated: April 2026
Status: Planned
Priority: High — post Vercel migration


## Overview

The upcoming adaptations guide doubles as a lead magnet. The public page shows
a curated preview of the highest-hype titles. The full guide — all confirmed
upcoming adaptations with release dates, cast, and read-first verdicts — is
delivered as a PDF to email subscribers.

This is the most natural email capture mechanic for the site. Readers who want
to know what to read before upcoming films drop are exactly the audience worth
building a list around.


## User Flow

1. Visitor lands on /upcoming-adaptations
2. Page shows top 10-15 titles (hype level 3 + selected hype 2)
3. Below the preview cards, a teaser section shows the remaining titles
   as a locked list — titles visible, content hidden
4. CTA: "Get the complete 2026 guide — all [N] upcoming adaptations with
   release dates, cast, and our read-first verdict. Free, straight to your inbox."
5. Email capture form (Mailchimp / ConvertKit)
6. Welcome email delivers the full PDF guide as an attachment


## Page Behaviour

### Preview mode (default, public)
- Shows hype-3 titles in full cards
- Shows a selection of hype-2 titles (configurable cutoff, default 5)
- Teaser section below: locked list of remaining titles, title only, no notes
- Prominent email CTA between preview and teaser
- Updated label still visible: "Updated April 2026"

### Full mode (pipeline --render-only, for PDF generation)
- Shows all titles, no teaser, no CTA form
- Used as input for PDF export
- Not deployed publicly — stays local for PDF generation


## Pipeline Changes

### pipeline-guide.js
- Add PREVIEW_CUTOFF config (hype level threshold + max hype-2 count)
- Add --full flag to render complete version for PDF
- Default render is preview mode
- Teaser section lists remaining slugs/titles only
- Email CTA block rendered between preview and teaser

### New: export-guide-pdf.js (or extend pipeline-guide.js)
- Runs pipeline-guide.js --full to generate complete HTML
- Uses PDFKit to render from upcoming-adaptations.json directly
- Output: data/guides/upcoming-guide-YYYY-MM.pdf
- Stored for Mailchimp attachment on welcome email

### config/models.json or config/guide.json
- previewHypeThreshold: 3       (show all hype-3 in full)
- previewHype2Limit: 5          (show this many hype-2 in full)
- previewTitle: "2026 Upcoming Book vs Movie Adaptations"


## Email Integration

Platform: Mailchimp (free up to 500 subscribers) or ConvertKit
List name: "Read Before You Watch"

Welcome email:
  Subject: Your 2026 book vs movie guide is here
  Body: 2-3 sentences, link to site, PDF attached
  PDF: Full upcoming guide for current month

Opt-in placement:
  - Between preview and teaser on /upcoming-adaptations (primary)
  - Below verdict box on individual review pages (secondary)
  - Bottom of browse page (tertiary)

Survey/preference question (optional, SurveyMonkey or native Mailchimp):
  "How often would you like upcoming movie updates?"
  - Monthly full guide
  - Weekly new additions only
  - Just the big releases (hype 3 only)


## Teaser Section Design

After the preview cards, a locked section:

  ┌─────────────────────────────────────────────┐
  │  + 39 more upcoming adaptations             │
  │                                             │
  │  • Circe — HBO / Max                        │
  │  • The Midnight Library — StudioCanal       │
  │  • Recursion — Netflix                      │
  │  • [title] — [streamer]         ...         │
  │                                             │
  │  Get the full guide →  [email input] [Go]   │
  └─────────────────────────────────────────────┘

Titles are visible (good for SEO, creates curiosity).
Notes, cast, release dates are hidden (the value exchange).


## SEO Notes

- Preview page is fully crawlable — titles visible to Google
- Locked content is CSS/JS hidden, not server-gated — not ideal for SEO
  but acceptable for this use case
- Full guide PDF is not publicly linked — only in welcome email
- Consider a /upcoming-adaptations/full page (noindex) for PDF source


## Dependencies

- upcoming-adaptations.json must exist (pipeline-guide.js)
- PDFKit installed (npm install pdfkit)
- Mailchimp or ConvertKit account set up
- export-guide-pdf.js built (see ROADMAP-TECHNICAL.md)
- Vercel migration preferred before implementing email infrastructure
  (Vercel functions handle form submission more cleanly than Netlify)


## Milestones

- [ ] Add --full flag to pipeline-guide.js
- [ ] Build teaser section + email CTA in renderHTML()
- [ ] Build export-guide-pdf.js using PDFKit
- [ ] Set up Mailchimp account + welcome email template
- [ ] Add opt-in form embed to upcoming-adaptations.html
- [ ] Add opt-in form to individual review pages (below verdict box)
- [ ] Test full flow: signup → welcome email → PDF delivery
- [ ] Add to sitemap and request GSC indexing
