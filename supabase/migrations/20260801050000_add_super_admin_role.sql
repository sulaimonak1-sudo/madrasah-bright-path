-- Make super-admin access explicit instead of inferring it from a null campus.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role::text IN ('super_admin', 'admin', 'teacher', 'parent'));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  )
$$;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage non-super roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin() AND (role::text <> 'super_admin' OR public.is_super_admin()))
  WITH CHECK (public.is_admin() AND (role::text <> 'super_admin' OR public.is_super_admin()));

DROP POLICY IF EXISTS "Admins full access on school_settings" ON public.school_settings;
CREATE POLICY "Super admins full access on school_settings"
  ON public.school_settings FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage website posts" ON public.website_posts;
CREATE POLICY "Super admins manage website posts"
  ON public.website_posts FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
CREATE POLICY "Super admins can upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND public.is_super_admin());

DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;
CREATE POLICY "Super admins can update gallery images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'gallery' AND public.is_super_admin());

DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;
CREATE POLICY "Super admins can delete gallery images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND public.is_super_admin());