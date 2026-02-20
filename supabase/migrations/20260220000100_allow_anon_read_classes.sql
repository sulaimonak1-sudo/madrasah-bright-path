-- ============================================================
-- ALLOW ANONYMOUS ACCESS TO CLASS DATA FOR SIGNUP
-- ============================================================

-- Allow anon to read class_levels (needed for staff signup)
CREATE POLICY "Anon can read class_levels for signup"
  ON public.class_levels FOR SELECT
  TO anon
  USING (true);

-- Allow anon to read class_arms (needed for staff signup)
CREATE POLICY "Anon can read class_arms for signup"
  ON public.class_arms FOR SELECT
  TO anon
  USING (true);
