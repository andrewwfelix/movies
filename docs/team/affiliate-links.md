[//]: # (Destination: docs/team/affiliate-links.md)

# Affiliate Links — How to Find and Format Them
==========================================
Last updated: April 17 2026


## The Tracking ID

Every affiliate link on this site uses the tracking ID: `readingtheill-20`

This ID is already public — it's embedded in every page on the site.
You can share it freely. It's not a password.


## Amazon Book Links

**Format:**
```
https://www.amazon.com/dp/ASIN/?tag=readingtheill-20
```

**How to find the ASIN:**

1. Go to amazon.com and search for the book by title and author
2. Click through to the book's product page
3. Look at the URL — it contains a 10-character code like `B00AABBCC1` or `0593311817`
4. That's the ASIN. It also appears under "Product Details" on the page.

**Which edition to use:**

- Prefer the paperback edition — it's usually the most purchased
- If there's a "movie tie-in" edition, use the original cover edition instead
- For novellas published in collections (e.g. Shawshank in Different Seasons),
  link to the collection

**Example:**
For *Reminders of Him* by Colleen Hoover:
- Amazon URL: `https://www.amazon.com/dp/1542021472/`
- ASIN: `1542021472`
- Affiliate link: `https://www.amazon.com/dp/1542021472/?tag=readingtheill-20`


## YouTube Trailer IDs

**How to find the YouTube ID:**

1. Go to youtube.com and search for "[film title] official trailer"
2. Click the official trailer (usually from the studio's channel)
3. Look at the URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. The ID is the part after `v=` — in this case `dQw4w9WgXcQ`

**Which trailer to use:**

- Always use the official trailer from the studio or distributor's channel
- If there are multiple trailers, use the first official one
- For older films, the remastered or HD upload is fine
- Do not use fan-made trailers or reaction videos


## Prime Video / Streaming Links

The `videoAffiliateLink` field is for Amazon Prime Video links.

**Only fill this in if the film is available on Amazon Prime Video.**

Format:
```
https://www.amazon.com/dp/ASIN/?tag=readingtheill-20
```

Where ASIN is the Amazon Video product ASIN (different from the book ASIN).

If the film is on Netflix, HBO, or another non-Amazon streamer, leave
`videoAffiliateLink` blank or null.


## Common Mistakes to Avoid

- Don't use shortened Amazon links (amzn.to) — use the full dp/ format
- Don't forget the tracking ID — every link must end with `?tag=readingtheill-20`
- Don't link to the Kindle edition — link to the physical book
- Don't use regional Amazon URLs (amazon.co.uk etc.) — always use amazon.com
- Don't use the YouTube full URL — just the ID after `v=`


## Quality Check

Before submitting, verify each link:
- [ ] Opens the correct book on Amazon
- [ ] Contains `readingtheill-20` in the URL
- [ ] YouTube ID loads the correct trailer (paste `youtube.com/watch?v=ID` to check)
