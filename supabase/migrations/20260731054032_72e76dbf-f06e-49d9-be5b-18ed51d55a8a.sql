-- 1. CAMPUSES
CREATE TABLE IF NOT EXISTS public.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.campuses TO anon;
GRANT SELECT, INSERT, UPDATE ON public.campuses TO authenticated;
GRANT ALL ON public.campuses TO service_role;

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

INSERT INTO public.campuses (name, code)
VALUES ('Main Campus', 'MAIN')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.campuses (name, code)
VALUES ('Annex Campus', 'ANNEX')
ON CONFLICT (code) DO NOTHING;

DROP TRIGGER IF EXISTS trg_campuses_updated_at ON public.campuses;
CREATE TRIGGER trg_campuses_updated_at BEFORE UPDATE ON public.campuses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. HELPERS
CREATE OR REPLACE FUNCTION public.main_campus_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.campuses WHERE code = 'MAIN' LIMIT 1
$$;

-- 3. COLUMNS + BACKFILL
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.class_arms ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);

CREATE OR REPLACE FUNCTION public.user_campus_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT campus_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

UPDATE public.students SET campus_id = public.main_campus_id() WHERE campus_id IS NULL;
UPDATE public.class_arms SET campus_id = public.main_campus_id() WHERE campus_id IS NULL;
UPDATE public.subjects SET campus_id = public.main_campus_id() WHERE campus_id IS NULL;

ALTER TABLE public.students ALTER COLUMN campus_id SET DEFAULT public.main_campus_id();
ALTER TABLE public.class_arms ALTER COLUMN campus_id SET DEFAULT public.main_campus_id();
ALTER TABLE public.subjects ALTER COLUMN campus_id SET DEFAULT public.main_campus_id();

ALTER TABLE public.students ALTER COLUMN campus_id SET NOT NULL;
ALTER TABLE public.class_arms ALTER COLUMN campus_id SET NOT NULL;

-- unique class arm per campus + level
CREATE UNIQUE INDEX IF NOT EXISTS class_arms_campus_level_name_key
  ON public.class_arms (campus_id, class_level_id, name);

CREATE INDEX IF NOT EXISTS idx_students_campus ON public.students (campus_id);
CREATE INDEX IF NOT EXISTS idx_students_campus_level_arm ON public.students (campus_id, class_level_id, class_arm_id, status);
CREATE INDEX IF NOT EXISTS idx_class_arms_campus ON public.class_arms (campus_id, class_level_id);
CREATE INDEX IF NOT EXISTS idx_subjects_campus_level ON public.subjects (campus_id, class_level_id);
CREATE INDEX IF NOT EXISTS idx_term_scores_term_student ON public.term_scores (term_id, student_id);
CREATE INDEX IF NOT EXISTS idx_term_scores_student ON public.term_scores (student_id);
CREATE INDEX IF NOT EXISTS idx_terms_session ON public.terms (session_id);

-- 4. CAMPUS ACCESS FUNCTION
CREATE OR REPLACE FUNCTION public.can_access_campus(_campus_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
     AND (public.user_campus_id() IS NULL OR public.user_campus_id() = _campus_id)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() AND public.user_campus_id() IS NULL
$$;

-- 5. CAMPUS RLS
DROP POLICY IF EXISTS "Authenticated can view campuses" ON public.campuses;
CREATE POLICY "Authenticated can view campuses" ON public.campuses
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Super admins manage campuses" ON public.campuses;
CREATE POLICY "Super admins manage campuses" ON public.campuses
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins update campuses" ON public.campuses;
CREATE POLICY "Super admins update campuses" ON public.campuses
  FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 6. RESTRICTIVE CAMPUS SCOPING (additive; does not widen anything)
DROP POLICY IF EXISTS "campus_scope_students" ON public.students;
CREATE POLICY "campus_scope_students" ON public.students
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_campus(campus_id))
  WITH CHECK (public.can_access_campus(campus_id));

DROP POLICY IF EXISTS "campus_scope_class_arms" ON public.class_arms;
CREATE POLICY "campus_scope_class_arms" ON public.class_arms
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_campus(campus_id))
  WITH CHECK (public.can_access_campus(campus_id));

DROP POLICY IF EXISTS "campus_scope_subjects" ON public.subjects;
CREATE POLICY "campus_scope_subjects" ON public.subjects
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (campus_id IS NULL OR public.can_access_campus(campus_id))
  WITH CHECK (campus_id IS NULL OR public.can_access_campus(campus_id));

DROP POLICY IF EXISTS "campus_scope_term_scores" ON public.term_scores;
CREATE POLICY "campus_scope_term_scores" ON public.term_scores
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = term_scores.student_id AND public.can_access_campus(s.campus_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = term_scores.student_id AND public.can_access_campus(s.campus_id)));

-- 7. DEACTIVATED CAMPUS GUARD
CREATE OR REPLACE FUNCTION public.assert_campus_active()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.campuses c WHERE c.id = NEW.campus_id AND c.is_active) THEN
    RAISE EXCEPTION 'Campus is inactive; new academic records are not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_campus_active ON public.students;
CREATE TRIGGER trg_students_campus_active BEFORE INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION public.assert_campus_active();

DROP TRIGGER IF EXISTS trg_class_arms_campus_active ON public.class_arms;
CREATE TRIGGER trg_class_arms_campus_active BEFORE INSERT ON public.class_arms
FOR EACH ROW EXECUTE FUNCTION public.assert_campus_active();

-- 8. PROMOTION FIX
ALTER TABLE public.promotion_records ALTER COLUMN from_arm_id DROP NOT NULL;
ALTER TABLE public.promotion_records ALTER COLUMN cumulative_average SET DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_promotion_records_student ON public.promotion_records (student_id, session_id);