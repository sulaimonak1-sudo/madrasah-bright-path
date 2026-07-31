-- Sessions, subjects, terms, and term locking are shared across campuses.
DROP POLICY IF EXISTS "campus_scope_sessions" ON public.sessions;
DROP POLICY IF EXISTS "campus_scope_subjects" ON public.subjects;
DROP TRIGGER IF EXISTS trg_sessions_campus_active ON public.sessions;

ALTER TABLE public.sessions
  DROP COLUMN IF EXISTS campus_id;

ALTER TABLE public.subjects
  DROP COLUMN IF EXISTS campus_id;