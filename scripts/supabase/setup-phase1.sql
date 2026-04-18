-- =============================================
-- BooksVersusMovies.com — Supabase Phase 1 Schema
-- Last Updated: 2026-04-18
-- Purpose: Analytics, tasks, decisions, notes, brainstorming
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing tables (safe for re-running during development)
DROP TABLE IF EXISTS brainstorming CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS analytics_history CASCADE;

-- =============================================
-- 1. ANALYTICS HISTORY
-- =============================================
CREATE TABLE analytics_history (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id         int NOT NULL DEFAULT 1,
  date            date NOT NULL,
  clicks          int DEFAULT 0,
  impressions     int DEFAULT 0,
  ctr             numeric(6,4),
  position        numeric(6,2),
  created_at      timestamptz DEFAULT now(),
  UNIQUE(site_id, date)
);

-- =============================================
-- 2. TASKS
-- =============================================
CREATE TABLE tasks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id         int NOT NULL DEFAULT 1,
  text            text NOT NULL,
  status          text DEFAULT 'not-started'
                  CHECK (status IN ('not-started', 'in-progress', 'done', 'blocked')),
  priority        text DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),
  category        text DEFAULT 'general',
  section         text,
  due_date        date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =============================================
-- 3. DECISIONS
-- =============================================
CREATE TABLE decisions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id         int NOT NULL DEFAULT 1,
  title           text NOT NULL,
  category        text,
  decision_date   date,
  decision        text NOT NULL,
  alternatives    text,
  rationale       text,
  status          text DEFAULT 'decided'
                  CHECK (status IN ('proposed', 'decided', 'implemented', 'reverted')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =============================================
-- 4. NOTES
-- =============================================
CREATE TABLE notes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id         int NOT NULL DEFAULT 1,
  slug            text NOT NULL,
  title           text NOT NULL,
  category        text,
  priority        text DEFAULT 'medium',
  status          text DEFAULT 'not-started',
  tags            text[],
  dependencies    text[],
  body            text,
  date            date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =============================================
-- 5. BRAINSTORMING
-- =============================================
CREATE TABLE brainstorming (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id         int NOT NULL DEFAULT 1,
  slug            text NOT NULL,
  title           text NOT NULL,
  topic           text,
  category        text,
  llm             text,
  sentiment       text,
  signal          text,
  actionable      boolean DEFAULT false,
  promoted        boolean DEFAULT false,
  tags            text[],
  summary         text,
  comment         text,
  date            date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_analytics_site_date     ON analytics_history(site_id, date DESC);
CREATE INDEX idx_tasks_site_status       ON tasks(site_id, status);
CREATE INDEX idx_tasks_site_priority     ON tasks(site_id, priority);
CREATE INDEX idx_decisions_site          ON decisions(site_id);
CREATE INDEX idx_notes_site_slug         ON notes(site_id, slug);
CREATE INDEX idx_brainstorming_site      ON brainstorming(site_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE analytics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorming     ENABLE ROW LEVEL SECURITY;

-- Anon read-only for dashboard (uses SUPABASE_ANON_KEY)
CREATE POLICY "anon_read_analytics"     ON analytics_history FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_tasks"         ON tasks             FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_decisions"     ON decisions         FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_notes"         ON notes             FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_brainstorming" ON brainstorming     FOR SELECT TO anon USING (true);

-- Service role (SUPABASE_SERVICE_KEY) bypasses RLS automatically
-- Used by all Vercel API functions for writes

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
    BEFORE UPDATE ON decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorming_updated_at
    BEFORE UPDATE ON brainstorming
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABLE COMMENTS
-- =============================================
COMMENT ON TABLE analytics_history IS 'Daily GSC analytics snapshots per site';
COMMENT ON TABLE tasks             IS 'Project tasks and daily checklist items';
COMMENT ON TABLE decisions         IS 'Architectural and product decision log';
COMMENT ON TABLE notes             IS 'General notes and structured ideas';
COMMENT ON TABLE brainstorming     IS 'LLM brainstorming sessions and feedback log';
