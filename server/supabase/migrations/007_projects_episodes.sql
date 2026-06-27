-- Migration 007: Restructure articles → projects + episodes
-- Projects are containers; episodes are individual posts within a project.

-- 1. Create episodes table first (FK references articles, will auto-update on rename)
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate existing article data into episodes
INSERT INTO public.episodes (project_id, title, content, excerpt, published, created_at, updated_at)
SELECT id, title, content, COALESCE(excerpt, ''), published, created_at, updated_at
FROM public.articles;

-- 3. Rename articles → projects (FK in episodes auto-updates)
ALTER TABLE IF EXISTS public.articles RENAME TO projects;

-- 4. Remove content column from projects
ALTER TABLE public.projects DROP COLUMN IF EXISTS content;

-- 5. Update indexes
DROP INDEX IF EXISTS idx_articles_author_id;
DROP INDEX IF EXISTS idx_articles_published_created;
DROP INDEX IF EXISTS idx_articles_category;

CREATE INDEX IF NOT EXISTS idx_projects_author_id ON public.projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_published_created ON public.projects(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- 6. Update trigger
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Update RLS policies
DROP POLICY IF EXISTS "Published articles are readable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authors can read own articles" ON public.projects;
DROP POLICY IF EXISTS "Authors can insert own articles" ON public.projects;
DROP POLICY IF EXISTS "Authors can update own articles" ON public.projects;
DROP POLICY IF EXISTS "Authors can delete own articles" ON public.projects;

CREATE POLICY "Published projects are readable by everyone"
    ON public.projects FOR SELECT USING (published = true);
CREATE POLICY "Authors can read own projects"
    ON public.projects FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert own projects"
    ON public.projects FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own projects"
    ON public.projects FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own projects"
    ON public.projects FOR DELETE USING (auth.uid() = author_id);

-- 8. Enable RLS on episodes and add policies
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published episodes are readable by everyone"
    ON public.episodes FOR SELECT USING (published = true);
CREATE POLICY "Authors can read own episodes"
    ON public.episodes FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND author_id = auth.uid())
    );
CREATE POLICY "Authors can insert episodes on own projects"
    ON public.episodes FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND author_id = auth.uid())
    );
CREATE POLICY "Authors can update episodes on own projects"
    ON public.episodes FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND author_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND author_id = auth.uid())
    );
CREATE POLICY "Authors can delete episodes on own projects"
    ON public.episodes FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND author_id = auth.uid())
    );

CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON public.episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_published ON public.episodes(published, created_at DESC);

CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON public.episodes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
