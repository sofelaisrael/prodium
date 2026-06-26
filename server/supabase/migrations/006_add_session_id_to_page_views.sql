-- Add session_id column to page_views for standard analytics
-- Each row now represents one pageview (every load counts)
-- session_id groups views within a 30-minute activity window

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Index for unique pageview queries (visitor + session + path)
CREATE INDEX IF NOT EXISTS idx_page_views_session
  ON page_views (visitor_id, session_id, path)
  WHERE session_id IS NOT NULL;
