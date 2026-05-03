-- Allow teachers to insert students
CREATE POLICY "Teachers can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Allow teachers to update students
CREATE POLICY "Teachers can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));