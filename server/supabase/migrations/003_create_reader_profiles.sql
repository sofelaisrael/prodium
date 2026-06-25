-- Create reader_profiles table for public readers (no auth required)
CREATE TABLE IF NOT EXISTS public.reader_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed - reader profiles are simple name records, not sensitive data
-- The API layer controls access (anyone can create, comments link to profile)

CREATE INDEX IF NOT EXISTS idx_reader_profiles_id ON public.reader_profiles(id);
