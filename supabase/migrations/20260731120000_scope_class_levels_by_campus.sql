ALTER TABLE public.class_levels
  ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);

UPDATE public.class_levels
SET campus_id = public.main_campus_id()
WHERE campus_id IS NULL;

ALTER TABLE public.class_levels
  ALTER COLUMN campus_id SET DEFAULT public.main_campus_id(),
  ALTER COLUMN campus_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_levels_campus
  ON public.class_levels (campus_id, display_order);

DROP POLICY IF EXISTS "campus_scope_class_levels" ON public.class_levels;
CREATE POLICY "campus_scope_class_levels" ON public.class_levels
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_campus(campus_id))
  WITH CHECK (public.can_access_campus(campus_id));

DROP TRIGGER IF EXISTS trg_class_levels_campus_active ON public.class_levels;
CREATE TRIGGER trg_class_levels_campus_active BEFORE INSERT ON public.class_levels
FOR EACH ROW EXECUTE FUNCTION public.assert_campus_active();