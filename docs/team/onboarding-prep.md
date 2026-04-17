[//]: # (Destination: docs/team/onboarding-prep.md)

# Onboarding Prep — What to Do Before a Helper Starts
==========================================
Last updated: April 17 2026


## Before You Hand Off Any Work

These tasks need to be done by the site owner before a helper can work
effectively. None require code changes — they're mostly documentation
and list preparation.


## Prep Tasks

- [ ] Create `docs/team/greenfield-queue.md` — list of slugs needing affiliate
      links and YouTube IDs, with book title and film title for each
      (see Task 1 in tasks.md)

- [ ] Update `docs/indexing-requests.txt` — ensure the Priority 1 list is
      current with all recently deployed pages not yet indexed in GSC
      (see Task 3 in tasks.md)

- [ ] Run consistency audit and save results as baseline:
      `node scripts/utils/consistency-audit.js --fix-report`
      Share the missing images list with the helper so they know what to source

- [ ] Confirm Amazon Associates account is fully approved
      (requires 3 qualifying sales — check Associates dashboard)

- [ ] Create a shared folder or communication channel for the helper to
      submit completed work (Google Drive, Dropbox, or email)

- [ ] Do a 15-minute walkthrough call or Loom video covering:
      - What the site is
      - How slugs work
      - How to format an affiliate link
      - How to find a YouTube ID
      - Where to save files and how to submit work


## Nice to Have Before Starting

- [ ] Set up a simple task tracker (even a shared Google Sheet) so both
      you and the helper can see what's in progress and what's done

- [ ] Prepare a batch of 10-20 greenfield JSONs with slugs and book titles
      already filled in, so the helper has a clear queue to work through

- [ ] Identify 2-3 "practice" tasks the helper can do first with low stakes
      before touching production data — e.g. sourcing images for titles
      that already have pages but are missing the JPG


## What the Helper Does NOT Need Access To

- The GitHub repository
- The Netlify dashboard
- The Amazon Associates account
- The Google Search Console account
- Any API keys or environment variables

All of these stay with the site owner. The helper works only with
data files and image files, which can be shared via a folder.


## Suggested First Week Tasks for a Helper

Week 1 — low risk, high value:
1. Source missing book cover images (pachinko, the-three-body-problem + any others)
2. Populate 5 greenfield JSONs with affiliate links and YouTube IDs
3. Browser QA on the 10 most recently deployed pages

That's enough to validate the working relationship before delegating
higher-volume tasks like daily GSC indexing or upcoming adaptations research.
