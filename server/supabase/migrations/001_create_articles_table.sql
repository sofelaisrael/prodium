-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT DEFAULT 'General',
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read published articles
CREATE POLICY "Published articles are readable by everyone"
    ON public.articles
    FOR SELECT
    USING (published = true);

-- Authors can read their own articles (published or not)
CREATE POLICY "Authors can read own articles"
    ON public.articles
    FOR SELECT
    USING (auth.uid() = author_id);

-- Authors can insert their own articles
CREATE POLICY "Authors can insert own articles"
    ON public.articles
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Authors can update their own articles
CREATE POLICY "Authors can update own articles"
    ON public.articles
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own articles
CREATE POLICY "Authors can delete own articles"
    ON public.articles
    FOR DELETE
    USING (auth.uid() = author_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_created ON public.articles(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();