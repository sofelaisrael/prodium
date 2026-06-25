-- Create page_views table for analytics
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    visitor_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Owner can read all page views
CREATE POLICY "Owner can read page views"
    ON public.page_views
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Anyone can insert page views
CREATE POLICY "Anyone can insert page views"
    ON public.page_views
    FOR INSERT
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
