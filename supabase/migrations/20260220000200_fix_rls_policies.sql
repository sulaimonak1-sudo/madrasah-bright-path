-- ============================================================
-- FIX PROFILES AND CLASS_ARMS RLS POLICIES
-- ============================================================

-- Drop the restrictive authenticated-only INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Allow anyone (anon or authenticated) to insert profiles during signup
-- User provides their own user_id from the signup response
CREATE POLICY "Anyone can insert own profile"
  ON public.profiles FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Allow anon and authenticated to read class_arms
DROP POLICY IF EXISTS "Teachers can read class_arms" ON public.class_arms;

CREATE POLICY "Everyone can read class_arms"
  ON public.class_arms FOR SELECT
  USING (true);

-- Allow anon and authenticated to read class_levels  
DROP POLICY IF EXISTS "Teachers can read class_levels" ON public.class_levels;

CREATE POLICY "Everyone can read class_levels"
  ON public.class_levels FOR SELECT
  USING (true);
