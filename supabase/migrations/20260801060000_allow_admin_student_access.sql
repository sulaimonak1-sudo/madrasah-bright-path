-- Give administrators explicit access to the student management table.
-- The original student policies only covered public reads and teacher writes.

DROP POLICY IF EXISTS "Admins full access on students" ON public.students;
CREATE POLICY "Admins full access on students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());