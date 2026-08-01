-- Make existing teacher and admin accounts visible to campus-scoped staff management.
-- Profiles created before campus scoping may not have a campus, and some role rows
-- may not have a corresponding profile yet.

UPDATE public.profiles
SET campus_id = public.main_campus_id()
WHERE campus_id IS NULL;

INSERT INTO public.profiles (user_id, full_name, campus_id)
SELECT
  ur.user_id,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    u.email
  ),
  public.main_campus_id()
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role IN ('teacher', 'admin')
  AND p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;