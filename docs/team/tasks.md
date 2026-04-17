[//]: # (Destination: docs/team/tasks.md)

# BooksVersusMovies.com — Helper Tasks
==========================================
Last updated: April 17 2026


## Task 1 — Populate Greenfield JSONs

**What it is:** New review pages need affiliate links and YouTube trailer IDs
before the pipeline can generate them. Your job is to find these and fill them in.

**How to do it:**

1. Open the greenfield JSON from `data/greenfield/` (e.g. `blade-runner.json`)
2. Note the `bookTitle` and `slug`
3. Go to Amazon.com and search for the book
4. Find the correct edition (paperback or most popular)
5. Copy the ASIN from the URL (the 10-character code, e.g. `B00AABBCC1`)
6. Format the affiliate link: `https://www.amazon.com/dp/ASIN/?tag=readingtheill-20`
7. Go to YouTube and search for "[film title] official trailer"
8. Copy the video ID from the URL (the part after `v=`, e.g. `dQw4w9WgXcQ`)
9. Fill in `affiliateLink` and `youtubeId` in the JSON file
10. Leave `videoAffiliateLink` blank unless the film is on Amazon Prime Video

**Done when:** Both `affiliateLink` and `youtubeId` are filled in with real values
(not placeholder `xxxxx`). The JSON is saved.

**Current queue:** See `docs/team/greenfield-queue.md`

---

## Task 2 — Source Missing Book Cover Images

**What it is:** Every review page needs a book cover image at `images/slug.jpg`.
When an image is missing the page shows a broken image slot.

**How to do it:**

1. Run the consistency audit to get the current missing image list:
   `node scripts/utils/consistency-audit.js`
2. For each missing slug, find a high-quality book cover image online
   (Amazon product page, Open Library, publisher site)
3. Download and save as `images/slug.jpg` (use the exact slug as the filename)
4. Image should be at least 300px wide, JPG format, portrait orientation

**Done when:** The image file exists at `images/slug.jpg` and the consistency
audit no longer flags that slug as missing.

---

## Task 3 — Daily GSC Indexing Requests

**What it is:** New pages need to be submitted to Google Search Console so
Google indexes them. Google allows 10 URL inspection requests per day.

**How to do it:**

1. Go to Google Search Console → URL Inspection
2. Open `docs/indexing-requests.txt` for the current priority list
3. Submit 10 URLs per day using the "Request Indexing" button
4. Mark each URL as done in the list with today's date

**Done when:** 10 URLs submitted and marked in the list.

---

## Task 4 — Browser QA on New Pages

**What it is:** After new pages are deployed, someone needs to check they
look correct in a browser before we consider them done.

**Checklist for each page:**
- [ ] Page loads without errors
- [ ] Book cover image displays correctly
- [ ] Buy button is visible and links to Amazon
- [ ] YouTube trailer thumbnail loads
- [ ] Verdict badge shows correct colour (green = Book Wins, etc.)
- [ ] Page looks correct on mobile (resize browser window)
- [ ] No obvious typos in the title or first paragraph

**Done when:** All checklist items pass. Flag any failures to the site owner.

---

## Task 5 — Upcoming Adaptations Research

**What it is:** The site has an upcoming adaptations page that needs to stay
current. Research new book-to-film announcements and add them to the source list.

**How to do it:**

1. Search for recent adaptation announcements on Deadline, Hollywood Reporter,
   Publisher's Weekly, and BookBub
2. For each new title found, add a row to `data/guides/sources.json` with:
   - Book title and author
   - Film/series title
   - Studio or streamer
   - Expected release date (or TBA)
   - Key cast if known
3. Flag to site owner when 5+ new entries are ready to run the guide pipeline

**Done when:** New entries added to sources.json and site owner notified.
