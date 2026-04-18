[//]: # (Destination: docs/brainstorming/vercel/vercel-phase1-plan.md)
[//]: # (Format: BooksVersusMovies standard markdown v1)
[//]: # (Rules: H1 title, H2 sections, H3 subsections, dates YYYY-MM-DD, no escaped chars)

# BooksVersusMovies.com — Vercel Phase 1 Plan
Last updated: 2026-04-17

Phase 1 objective: Add a Vercel API backend and Supabase persistence layer
to the existing dashboard WITHOUT touching the live site or content pipeline.
The static HTML site stays on Netlify (or moves to Vercel hosting). Vercel
adds the /api layer. The dashboard stops reading from static JSON files and
starts reading from live API endpoints.

Phase 2 (separate epic): Move the content pipeline to Vercel Functions and
migrate reviews to Supabase. That is a rewrite. This document covers Phase 1 only.

Codebase strategy: One repo, two deployment targets. Netlify serves the
static site. Vercel serves /api/* functions. The dashboard HTML reads from
the Vercel API. If the API breaks, the live site is unaffected.

---

## 0. Interface and Credential Setup

Do this before touching any code. All credentials go into Vercel environment
variables — never committed to git.

### 0.1 Google Cloud Project (GSC + GA — same project, same service account)

One Google Cloud project covers both GSC and GA4.

Steps:
1. Go to console.cloud.google.com
2. Create new project — name: booksversusmovies-api
3. APIs and Services → Enable APIs and Services
4. Search and enable: Google Search Console API
5. Search and enable: Google Analytics Data API (GA4)
6. IAM and Admin → Service Accounts → Create Service Account
   - Name: bvm-dashboard
   - Click Done (no project-level role needed)
7. Click the new service account → Keys tab → Add Key → Create new key → JSON
8. Download credentials JSON — store securely, add to .gitignore immediately
9. In Google Search Console → Settings → Users and permissions → Add user
   - Paste client_email from the JSON
   - Permission: Full
10. In Google Analytics → Admin → Property Access Management → Add user
    - Paste same client_email
    - Role: Viewer

Vercel environment variables:
- GOOGLE_CLIENT_EMAIL — from credentials JSON
- GOOGLE_PRIVATE_KEY — full private key string including BEGIN/END markers
- GSC_SITE_URL — https://booksversusmovies.com/
- GA_PROPERTY_ID — numeric GA4 property ID (found in GA Admin → Property Settings)

Note: The private key contains newlines. Paste raw value into Vercel — it handles them correctly.

### 0.2 Supabase Project

1. supabase.com → New project
   - Name: booksversusmovies
   - Region: us-east-1
   - Save the database password
2. Settings → API → copy:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_KEY (server only, never expose to browser)

### 0.3 Beehiiv API

1. Beehiiv → Settings → API → Generate API key
2. Note your Publication ID (visible in dashboard URL)
3. Vercel environment variables:
   - BEEHIIV_API_KEY
   - BEEHIIV_PUBLICATION_ID

### 0.4 Vercel Project Setup

1. vercel.com → New Project → Import from GitHub → select movies repo
2. Framework preset: Other
3. Root directory: . (project root)
4. Add all environment variables from 0.1-0.3
5. Add vercel.json to project root (see section 1.1)
6. Deploy

### 0.5 Environment Variables Reference

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GSC_SITE_URL=https://booksversusmovies.com/
GA_PROPERTY_ID=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
BEEHIIV_API_KEY=
BEEHIIV_PUBLICATION_ID=
OPENROUTER_API_KEY=
SITE_ID=1

---

## 1. Vercel Configuration

### 1.1 vercel.json

{
  "functions": {
    "api/**/*.js": { "memory": 512, "maxDuration": 30 }
  },
  "crons": [
    { "path": "/api/gsc", "schedule": "0 6 * * *" },
    { "path": "/api/docs-sync", "schedule": "0 7 * * 1" }
  ]
}

### 1.2 Project structure (Phase 1)

movies/
  api/
    gsc.js          - GET: fetch GSC data, write to analytics_history
    analytics.js    - GET: fetch GA4 session data
    tasks.js        - GET/PATCH: read and update tasks in Supabase
    docs.js         - GET: decisions, notes, brainstorming from Supabase
    docs-sync.js    - POST: parse markdown files, upsert to Supabase
  dashboard/
    index.html      - updated to fetch from /api/* endpoints
    data/           - kept as local fallback during transition
  vercel.json
  (all other files unchanged)

---

## 2. Supabase Schema — Phase 1 Tables Only

No reviews table in Phase 1. Content pipeline unchanged.

### 2.1 analytics_history

CREATE TABLE analytics_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id     int NOT NULL DEFAULT 1,
  date        date NOT NULL,
  clicks      int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr         numeric(5,4),
  position    numeric(5,2),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(site_id, date)
);

### 2.2 tasks

CREATE TABLE tasks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id    int NOT NULL DEFAULT 1,
  text       text NOT NULL,
  status     text DEFAULT 'not-started',
  priority   text DEFAULT 'medium',
  category   text DEFAULT 'tech',
  section    text,
  date       date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

### 2.3 decisions

CREATE TABLE decisions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id      int NOT NULL DEFAULT 1,
  title        text NOT NULL,
  category     text,
  date         date,
  decision     text,
  alternatives text,
  rationale    text,
  status       text,
  created_at   timestamptz DEFAULT now()
);

### 2.4 notes

CREATE TABLE notes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id      int NOT NULL DEFAULT 1,
  slug         text NOT NULL,
  title        text NOT NULL,
  category     text,
  priority     text DEFAULT 'medium',
  status       text DEFAULT 'not-started',
  tags         text[],
  dependencies text[],
  body         text,
  date         date,
  created_at   timestamptz DEFAULT now()
);

### 2.5 brainstorming

CREATE TABLE brainstorming (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id    int NOT NULL DEFAULT 1,
  slug       text NOT NULL,
  title      text NOT NULL,
  topic      text,
  category   text,
  llm        text,
  sentiment  text,
  signal     text,
  actionable boolean DEFAULT false,
  promoted   boolean DEFAULT false,
  tags       text[],
  summary    text,
  comment    text,
  date       date,
  created_at timestamptz DEFAULT now()
);

### 2.6 RLS policies

ALTER TABLE analytics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorming ENABLE ROW LEVEL SECURITY;

-- Anon read-only for dashboard (no auth required to view)
CREATE POLICY "anon read" ON analytics_history FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON tasks FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON decisions FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON notes FOR SELECT TO anon USING (true);
CREATE POLICY "anon read" ON brainstorming FOR SELECT TO anon USING (true);

-- Service role key bypasses RLS (used by API functions for writes)

---

## 3. API Functions

### 3.1 GET /api/gsc
Fetches last 14 days from GSC Search Analytics API.
Writes each day to analytics_history (upsert on site_id + date).
Returns same structure as current latest.json.
Also runs daily as Vercel Cron at 6am.

### 3.2 GET /api/analytics
Fetches GA4 sessions, users, bounce rate, pages per session.
Returns structured data for future dashboard tab.

### 3.3 GET /api/tasks
Returns tasks from Supabase grouped by section.
Query params: status, priority, category.

### 3.4 PATCH /api/tasks/:id
Updates task status. Body: { "status": "done" }
Used by Tab 2 Project checkboxes and Tab 5 Daily checklist.

### 3.5 GET /api/docs
Returns decisions, notes, or brainstorming from Supabase.
Query params: type=decisions | type=notes | type=brainstorming

### 3.6 POST /api/docs-sync
Reads markdown files, parses them, upserts to Supabase.
Replaces running docs-to-json.js locally.
Also runs as weekly Vercel Cron on Mondays at 7am.

---

## 4. Dashboard Wiring

Swap static JSON fetches for API endpoints — one tab at a time.

Tab 1 Analytics:  fetch('data/latest.json') → fetch('/api/gsc')
Tab 2 Project:    fetch('data/project-status.json') → fetch('/api/tasks')
                  + PATCH /api/tasks/:id on checkbox click
Tab 3 Decisions:  fetch('data/decisions.json') → fetch('/api/docs?type=decisions')
Tab 5 Daily:      sessionStorage → PATCH /api/tasks/:id (full write-back)
Tab 6 Notes:      fetch('/api/docs?type=notes') — new tab
Tab 7 Brainstorm: fetch('/api/docs?type=brainstorming') — new tab

---

## 5. Migration Scripts (run once, before switching dashboard to API)

scripts/migrate/seed-analytics.js     - latest.json → analytics_history
scripts/migrate/seed-tasks.js         - project-status.json → tasks
scripts/migrate/seed-decisions.js     - decisions.json → decisions
scripts/migrate/seed-notes.js         - notes.json → notes
scripts/migrate/seed-brainstorming.js - brainstorming.json → brainstorming

---

## 6. Vercel Crons

Daily at 6am:   /api/gsc — fresh GSC data, no manual CSV export needed
Weekly Monday:  /api/docs-sync — markdown → Supabase sync

---

## 7. Build Order

1. Complete credential setup (section 0) — all env vars in Vercel
2. Run Supabase SQL (section 2) — create tables and RLS policies
3. Run migration scripts (section 5) — seed from existing JSON files
4. Build and deploy /api/gsc first — verify data flowing into analytics_history
5. Update Tab 1 to fetch from /api/gsc — verify dashboard still works
6. Build /api/tasks — update Tab 2 and Tab 5
7. Build /api/docs — update Tab 3, add Tab 6 and Tab 7
8. Build /api/docs-sync — verify cron works
9. Once all tabs verified — remove dependency on data/*.json
10. Live site is never touched during any of these steps

---

## What Phase 1 Does Not Include

- reviews table (Phase 2)
- /api/generate endpoint (Phase 2)
- Content pipeline migration (Phase 2)
- ISR / static site regeneration (Phase 2)
- Multi-site site_id usage (Phase 2)
- Netlify retirement (Phase 2)

---

## 8. Grok Review Notes (2026-04-18)

Grok reviewed Phase 1 plan and schema. Overall verdict: ready to execute with small tweaks.

### What Grok confirmed as correct
- Risk isolation is excellent — live site stays untouched during entire Phase 1
- Schema design is clean and well-scoped for Phase 1
- site_id from day one is the right call for future multi-site
- Vercel Crons for GSC refresh and docs-sync are the right automation pattern
- Migration scripts section is correctly placed before API build

### Grok's suggested improvements (incorporated)
- Add CHECK constraints on status and priority fields in tasks and decisions tables
- Add DESC to analytics_history date index for faster latest-first queries
- Add updated_at trigger function — was in plan but not in original SQL
- Consider API key validation in Vercel functions as additional security layer beyond RLS
- Bump Vercel function memory to 1024 MB if timeouts appear on GSC fetches
- Add graceful degradation in dashboard — fall back to cached JSON if /api/gsc fails

### Grok's sprint order recommendation
Sprint 1 (Momentum): Live GSC API + dashboard Tab 1 + Beehiiv auto-draft
Sprint 2 (Foundation): Supabase schema + tasks/decisions/notes + migration scripts
Sprint 3 (Content flow): Simple /api/generate (draft only) + docs-sync cron
Sprint 4 (Scale prep): Redirects table, redirects cleanup, programmatic pages if traffic warrants

### What to delay (Grok confirmed)
- Full AI pipeline rewrite — wait until Phase 1 stable
- Realtime subscriptions — no team, not needed yet
- RBAC / team table — premature
- Programmatic SEO hubs, auto internal linking — Phase 3+
- Audit logs / version history — nice-to-have, not now

### Phase 1.5 — Site config table (post Phase 1)
Grok suggested adding a site_config table to Supabase so nav items, default featured slugs,
hero tagline etc. can be edited from the dashboard without code changes. Table design:

```sql
CREATE TABLE site_config (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id     int NOT NULL DEFAULT 1,
  key         text NOT NULL,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz DEFAULT now(),
  updated_by  text,
  UNIQUE(site_id, key)
);
```

Example rows: nav_items, default_featured, hero_tagline, spotlight_heading.
API routes: GET /api/config and PATCH /api/config/:key.
Deferred until Phase 1 is stable and running.

### SQL file
Final canonical schema: scripts/supabase/setup-phase1.sql
Run this in Supabase SQL Editor to create all Phase 1 tables.
