ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);

UPDATE public.sessions
SET campus_id = public.main_campus_id()
WHERE campus_id IS NULL;

ALTER TABLE public.sessions
  ALTER COLUMN campus_id SET DEFAULT public.main_campus_id(),
  ALTER COLUMN campus_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_campus
  ON public.sessions (campus_id, name);

DROP POLICY IF EXISTS "campus_scope_sessions" ON public.sessions;
CREATE POLICY "campus_scope_sessions" ON public.sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_campus(campus_id))
  WITH CHECK (public.can_access_campus(campus_id));

DROP TRIGGER IF EXISTS trg_sessions_campus_active ON public.sessions;
CREATE TRIGGER trg_sessions_campus_active BEFORE INSERT ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.assert_campus_active();