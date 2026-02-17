
-- ============================================================
-- MADRASAH RESULT MANAGEMENT SCHEMA
-- ============================================================

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
$$;

-- ============================================================
-- 1. CLASS LEVELS
-- ============================================================
CREATE TABLE public.class_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on class_levels"
  ON public.class_levels FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read class_levels"
  ON public.class_levels FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- ============================================================
-- 2. CLASS ARMS
-- ============================================================
CREATE TABLE public.class_arms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_level_id UUID NOT NULL REFERENCES public.class_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- A, B, C, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_arms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on class_arms"
  ON public.class_arms FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read class_arms"
  ON public.class_arms FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- ============================================================
-- 3. SESSIONS
-- ============================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. "2024/2025"
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- ============================================================
-- 4. TERMS
-- ============================================================
CREATE TABLE public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  term_number SMALLINT NOT NULL CHECK (term_number IN (1, 2, 3)),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, term_number)
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on terms"
  ON public.terms FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read terms"
  ON public.terms FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- ============================================================
-- 5. ADD MADRASAH COLUMNS TO EXISTING STUDENTS TABLE
-- ============================================================
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_uid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS class_level_id UUID REFERENCES public.class_levels(id),
  ADD COLUMN IF NOT EXISTS class_arm_id UUID REFERENCES public.class_arms(id),
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

-- ============================================================
-- 6. ADD MADRASAH COLUMNS TO EXISTING SUBJECTS TABLE
-- ============================================================
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS class_level_id UUID REFERENCES public.class_levels(id);

-- ============================================================
-- 7. TERM SCORES
-- ============================================================
CREATE TABLE public.term_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  ca1 NUMERIC NOT NULL DEFAULT 0,
  ca2 NUMERIC NOT NULL DEFAULT 0,
  exam NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (ca1 + ca2 + exam) STORED,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, term_id)
);

ALTER TABLE public.term_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on term_scores"
  ON public.term_scores FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read term_scores"
  ON public.term_scores FOR SELECT
  TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Teachers can insert term_scores"
  ON public.term_scores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher());

CREATE POLICY "Teachers can update term_scores"
  ON public.term_scores FOR UPDATE
  TO authenticated
  USING (public.is_teacher());

-- Auto-update updated_at
CREATE TRIGGER update_term_scores_updated_at
  BEFORE UPDATE ON public.term_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. PROMOTION RECORDS
-- ============================================================
CREATE TABLE public.promotion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id),
  from_class_level_id UUID NOT NULL REFERENCES public.class_levels(id),
  to_class_level_id UUID REFERENCES public.class_levels(id),
  from_arm_id UUID NOT NULL REFERENCES public.class_arms(id),
  to_arm_id UUID REFERENCES public.class_arms(id),
  status TEXT NOT NULL CHECK (status IN ('PROMOTED', 'RETAINED', 'INCOMPLETE')),
  cumulative_average NUMERIC NOT NULL DEFAULT 0,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  promoted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on promotion_records"
  ON public.promotion_records FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 9. PINS (for public result checking)
-- ============================================================
CREATE TABLE public.pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, term_id)
);

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on pins"
  ON public.pins FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public can read pins for validation (anon role)
CREATE POLICY "Public can validate pins"
  ON public.pins FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================
-- 10. AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on audit_logs"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 11. PUBLIC ACCESS for result checking (anon can read scores via pin)
-- Allow anon to read term_scores, students, subjects, terms, sessions
-- for the public result checker
-- ============================================================
CREATE POLICY "Anon can read term_scores"
  ON public.term_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read students"
  ON public.students FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read subjects for results"
  ON public.subjects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read terms for results"
  ON public.terms FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read sessions for results"
  ON public.sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can read class_levels for results"
  ON public.class_levels FOR SELECT
  TO anon
  USING (true);
