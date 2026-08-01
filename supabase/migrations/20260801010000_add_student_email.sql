-- Store student email addresses entered manually by administrators.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS email text;