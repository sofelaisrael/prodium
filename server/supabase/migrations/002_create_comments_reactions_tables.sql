-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on published articles
CREATE POLICY "Comments on published articles are readable by everyone"
    ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.articles
            WHERE articles.id = comments.article_id
            AND articles.published = true
        )
    );

-- Authors can read comments on their own articles (published or not)
CREATE POLICY "Authors can read comments on own articles"
    ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.articles
            WHERE articles.id = comments.article_id
            AND articles.author_id = auth.uid()
        )
    );

-- Comment authors can read their own comments
CREATE POLICY "Comment authors can read own comments"
    ON public.comments
    FOR SELECT
    USING (auth.uid() = author_id);

-- Authenticated users can insert comments on published articles
CREATE POLICY "Authenticated users can comment on published articles"
    ON public.comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.articles
            WHERE articles.id = comments.article_id
            AND articles.published = true
        )
    );

-- Comment authors can update their own comments
CREATE POLICY "Comment authors can update own comments"
    ON public.comments
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Comment authors can delete their own comments
CREATE POLICY "Comment authors can delete own comments"
    ON public.comments
    FOR DELETE
    USING (auth.uid() = author_id);

-- Article authors can delete any comment on their articles
CREATE POLICY "Article authors can delete comments on their articles"
    ON public.comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.articles
            WHERE articles.id = comments.article_id
            AND articles.author_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Create reactions table (likes, bookmarks, etc.)
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'bookmark', 'clap')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (article_id, user_id, type)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions on published articles
CREATE POLICY "Reactions on published articles are readable by everyone"
    ON public.reactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.articles
            WHERE articles.id = reactions.article_id
            AND articles.published = true
        )
    );

-- Users can manage their own reactions
CREATE POLICY "Users can manage own reactions"
    ON public.reactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_article_id ON public.reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();