
-- Allow teachers to manage their own tiered_remarks (for their assigned class arm)
CREATE POLICY "Teachers can insert own tiered_remarks"
ON public.tiered_remarks
FOR INSERT
TO authenticated
WITH CHECK (
  is_teacher() AND (
    class_arm_id IN (
      SELECT class_teacher_class_arm_id FROM public.profiles WHERE user_id = auth.uid() AND class_teacher_class_arm_id IS NOT NULL
    )
  )
);

CREATE POLICY "Teachers can update own tiered_remarks"
ON public.tiered_remarks
FOR UPDATE
TO authenticated
USING (
  is_teacher() AND (
    class_arm_id IN (
      SELECT class_teacher_class_arm_id FROM public.profiles WHERE user_id = auth.uid() AND class_teacher_class_arm_id IS NOT NULL
    )
  )
);

CREATE POLICY "Teachers can delete own tiered_remarks"
ON public.tiered_remarks
FOR DELETE
TO authenticated
USING (
  is_teacher() AND (
    class_arm_id IN (
      SELECT class_teacher_class_arm_id FROM public.profiles WHERE user_id = auth.uid() AND class_teacher_class_arm_id IS NOT NULL
    )
  )
);
