-- ============================================================
-- FIX USER_ROLES RLS TO ALLOW SIGNUP
-- ============================================================

-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow anonymous users to insert roles (in case signup creates role before auth confirmation)
CREATE POLICY "Anon can insert own role during signup"
  ON public.user_roles FOR INSERT
  TO anon
  WITH CHECK (true);
