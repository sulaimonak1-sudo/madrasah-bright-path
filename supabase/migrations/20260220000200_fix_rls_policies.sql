-- ============================================================
-- FIX PROFILES AND CLASS_ARMS RLS POLICIES
-- ============================================================

-- Allow anonymous users to insert profiles during signup
-- (they provide their own user_id from the signup response)
CREATE POLICY "Anon can insert own profile during signup"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to update profiles
-- (in addition to the existing policy for reading own profiles)
ALTER POLICY "Users can update their own profile"
  ON public.profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix class_arms to be joinable with class_levels
-- Allow anon to read class_arms with their related class_levels
CREATE POLICY "Anon can read class_arms for signup (improved)"
  ON public.class_arms FOR SELECT
  TO anon
  USING (true);
