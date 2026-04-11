# BooksVersusMovies.com — Review JSON Schema
=============================================
v1 — April 2026

This document defines the canonical JSON schema for review content.
One JSON file per review, stored in data/reviews/<slug>.json.

This is the source of truth for all pipeline operations:
  - html-to-json.js   reads HTML → writes this format
  - revise.js         reads this format → writes this format (revised)
  - render.js         reads this format → writes HTML
  - generate.js       writes this format from scratch (greenfield)

The renderer owns all HTML structure. The JSON owns all content.
No HTML tags should appear in any JSON field except where explicitly noted.


## Field reference

### Identity
  slug          string    URL slug, no extension. e.g. "atonement"
  filename      string    HTML filename. e.g. "atonement.html"
  lastUpdated   string    ISO date. e.g. "2026-04-11"
  pipelineVersion string  Schema version. Always "1" for this schema.

### SEO / head
  pageTitle     string    Full <title> tag content
  metaDesc      string    Meta description, 150 chars max
  reviewBody    string    One punchy sentence for Review JSON-LD schema
  ratingValue   string    "4" or "5" for Review JSON-LD schema

### Book metadata
  bookTitle     string    Title as it appears on the cover
  author        string    Author full name(s). e.g. "Ian McEwan"
  bookYear      string    Publication year. May be non-numeric e.g. "800 BC"
  genre         string    Genre tag text. e.g. "Literary Fiction / Romance"

### Adaptation metadata
  mediaType     string    "film" or "series"
  mediaLabel    string    Display label. e.g. "The Film" or "The Series"
  filmYear      string    Release year or "TBA"
  director      string    Director name(s). Null/omitted for series pages.
  starringLine  string    Starring line for trailer panel.
                          e.g. "Starring Keira Knightley, James McAvoy — Film: 2007"

### Verdict
  verdictText   string    "Book Wins" | "Too Close to Call" | "Movie Wins"
  verdictClass  string    CSS class: "verdict-book" | "verdict-tie" | "verdict-film"

### Affiliate / media
  affiliateLink      string   Primary Amazon affiliate URL (book cover + buy button)
  affiliateLinkAlt   string   Secondary affiliate link if present. Null if not.
  videoAffiliateLink string   Buy/rent video link. Null if not present.
  youtubeId          string   YouTube video ID for trailer thumbnail
  trailerUrl         string   Full YouTube URL
  bookCoverImage     string   Image filename only. e.g. "atonement.jpg"
                              Renderer prepends the correct path.

### Page content

  storyBrief    string    2-3 paragraph plot and context summary.
                          Plain text, paragraphs separated by \n\n.
                          No HTML tags.

  quickAnswer   object    NEW — added by revision pipeline Pass 1.
                          Null in extracted JSON, populated after revision.
    winner        string  "Book" | "Film" | "Series" | "Too Close to Call"
    readFirst     string  "Yes" | "No" | "Either order works"
    oneLineReason string  Single sentence. e.g. "The prose is irreplaceable."

  characters    array     Character comparison table rows.
    name          string  Character name. e.g. "Briony Tallis"
    actor         string  Actor name(s). e.g. "Saoirse Ronan / Romola Garai / Vanessa Redgrave"
    inBook        string  Character description in the book.
    inFilm        string  Character description in the adaptation.

  differences   array     Key difference sections. 4-5 items expected.
    title         string  Section heading. e.g. "Briony's interiority is the novel's greatest achievement"
    body          string  2-paragraph analysis. Paragraphs separated by \n\n. No HTML.

  readFirst     string    "Should You Read First?" section.
                          2 paragraphs separated by \n\n.

  verdictBox    string    Verdict box body text. 1 paragraph. No HTML.

  faq           array     FAQ items. 4-5 items expected.
    question      string  Question text.
    answer        string  Answer text. Plain text, no HTML.

  ctaBlocks     array     NEW — added by revision pipeline Pass 2.
                          Null in extracted JSON, populated after revision.
                          Defines additional CTA placements beyond the default buy button.
    location      string  "after-quick-answer" | "after-read-first" | "after-verdict"
    text          string  CTA link text. e.g. "Read the book first →"
    href          string  Affiliate URL. Copied from affiliateLink by default.

### Related content
  relatedSectionTitle  string  e.g. "More Literary Fiction Comparisons"
  related              array   Exactly 3 items.
    slug                 string  e.g. "gone-girl"
    title                string  Display title. e.g. "Gone Girl"

### Flags (set by extractor, not edited manually)
  hasSpoilerWarning   boolean  Whether spoiler warning block is present
  hasQuickAnswer      boolean  Whether quick-answer block is present
  hasCharTable        boolean  Whether character table is present
  generation          string   "v2" for all current pages


## Complete example (atonement.json, abbreviated)

{
  "slug": "atonement",
  "filename": "atonement.html",
  "lastUpdated": "2026-04-11",
  "pipelineVersion": "1",

  "pageTitle": "Atonement Book vs Movie: McEwan vs Joe Wright",
  "metaDesc": "Ian McEwan's 2001 novel versus Joe Wright's 2007 film starring Keira Knightley and James McAvoy. The Dunkirk sequence is cinema perfection, but the book's metafictional ending changes everything.",
  "reviewBody": "Joe Wright made one of the most beautiful films of the 2000s and it still cannot do what McEwan does. Read the book — the film will haunt you, but the novel haunts you longer.",
  "ratingValue": "5",

  "bookTitle": "Atonement",
  "author": "Ian McEwan",
  "bookYear": "2001",
  "genre": "Literary Fiction / Romance",

  "mediaType": "film",
  "mediaLabel": "The Film",
  "filmYear": "2007",
  "director": "Joe Wright",
  "starringLine": "Starring Keira Knightley, James McAvoy, Saoirse Ronan — Film: 2007",

  "verdictText": "Book Wins",
  "verdictClass": "verdict-book",

  "affiliateLink": "https://amzn.to/4bY9ZQs",
  "affiliateLinkAlt": null,
  "videoAffiliateLink": null,
  "youtubeId": "fiv8Gy5CJ0Y",
  "trailerUrl": "https://www.youtube.com/watch?v=fiv8Gy5CJ0Y",
  "bookCoverImage": "atonement.jpg",

  "storyBrief": "In the summer of 1935, thirteen-year-old Briony Tallis witnesses a series of events she doesn't fully understand and makes an accusation that destroys two lives...\n\nIan McEwan's novel, published in 2001, was shortlisted for the Booker Prize...\n\nBut the novel is a meditation on storytelling itself...",

  "quickAnswer": null,

  "characters": [
    {
      "name": "Briony Tallis",
      "actor": "Saoirse Ronan / Romola Garai / Vanessa Redgrave",
      "inBook": "A precocious thirteen-year-old writer whose overactive imagination...",
      "inFilm": "Ronan captures Briony's intensity and self-importance brilliantly..."
    }
  ],

  "differences": [
    {
      "title": "Briony's interiority is the novel's greatest achievement and the film's necessary sacrifice",
      "body": "The novel's first section is one of the great feats of literary ventriloquism...\n\nSaoirse Ronan is extraordinary in the film..."
    }
  ],

  "readFirst": "Yes — emphatically. The film is beautiful and the ending will move you...\n\nRead it first and the film becomes a meditation on what even a masterful adaptation must sacrifice...",

  "verdictBox": "Joe Wright made one of the most beautiful films of the 2000s and it still can't do what McEwan does...",

  "faq": [
    {
      "question": "Is the Atonement movie faithful to the book?",
      "answer": "The film follows the novel's plot closely through the first three sections..."
    }
  ],

  "ctaBlocks": null,

  "relatedSectionTitle": "More Literary Fiction Comparisons",
  "related": [
    { "slug": "gone-girl",        "title": "Gone Girl" },
    { "slug": "wuthering-heights","title": "Wuthering Heights" },
    { "slug": "hamnet",           "title": "Hamnet" }
  ],

  "hasSpoilerWarning": true,
  "hasQuickAnswer": false,
  "hasCharTable": true,
  "generation": "v2"
}


## Design decisions

1. No HTML in content fields
   All text fields contain plain text only. Paragraph breaks use \n\n.
   The renderer handles all markup. This makes content safe for any model
   to read or write without risk of malformed HTML.

2. quickAnswer and ctaBlocks are null until pipeline adds them
   Extracted JSON preserves the original page state exactly.
   Pass 1 sets quickAnswer. Pass 2 sets ctaBlocks.
   The renderer handles both null (omit the block) and populated states.

3. bookCoverImage is filename only
   The renderer constructs the full path. This makes the JSON portable
   and independent of the deployment directory structure.

4. differences.body uses \n\n for paragraph breaks
   Each difference section contains exactly 2 paragraphs in current pages.
   The renderer splits on \n\n and wraps each in <p> tags.

5. director is omitted (null) for series pages
   Series legitimately have no single director. The renderer omits the
   Director meta strip item when this field is null.

6. related is always exactly 3 items
   The renderer expects exactly 3. The extractor warns if fewer are found.
   The revision pipeline should fix missing related cards before rendering.

7. pipelineVersion is always "1" for this schema
   Increment if breaking schema changes are made in future.
   Allows the renderer to detect and reject incompatible files.
