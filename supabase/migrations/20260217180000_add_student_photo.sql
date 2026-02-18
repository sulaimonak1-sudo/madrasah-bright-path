-- Add photo_url column to students for optional student photos
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- No special RLS required; anon can read students already.
