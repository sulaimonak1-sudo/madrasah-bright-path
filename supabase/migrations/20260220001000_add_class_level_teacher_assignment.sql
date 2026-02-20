-- Add support for assigning teachers to class levels (for classes without arms)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS class_teacher_class_level_id uuid REFERENCES public.class_levels(id) ON DELETE SET NULL;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_class_teacher_class_level_id 
ON public.profiles(class_teacher_class_level_id);

-- Update RLS policy to allow teachers to read class_levels for assignment
CREATE POLICY "Anon can read class_levels for signup"
  ON public.class_levels FOR SELECT
  USING (true);
