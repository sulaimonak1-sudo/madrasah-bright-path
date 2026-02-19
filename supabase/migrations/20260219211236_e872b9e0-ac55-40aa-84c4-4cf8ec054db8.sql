
-- Add class_teacher_class_arm_id to profiles so teachers can be assigned as class teachers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_teacher_class_arm_id uuid REFERENCES public.class_arms(id);

-- Create tiered_remarks table for class teacher and head teacher auto-remarks based on score ranges
CREATE TABLE IF NOT EXISTS public.tiered_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('teacher', 'head')),
  class_arm_id uuid REFERENCES public.class_arms(id),
  min_score integer NOT NULL,
  max_score integer NOT NULL,
  remark_en text NOT NULL DEFAULT '',
  remark_ar text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tiered_remarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to tiered_remarks"
  ON public.tiered_remarks FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Teachers can read tiered_remarks"
  ON public.tiered_remarks FOR SELECT
  TO authenticated
  USING (public.is_teacher());
