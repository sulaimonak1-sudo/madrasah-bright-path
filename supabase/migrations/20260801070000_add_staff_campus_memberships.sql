-- Staff can belong to more than one campus.

CREATE TABLE IF NOT EXISTS public.profile_campuses (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, campus_id)
);

ALTER TABLE public.profile_campuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage profile campuses" ON public.profile_campuses;
CREATE POLICY "Admins manage profile campuses"
  ON public.profile_campuses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read their campus memberships" ON public.profile_campuses;
CREATE POLICY "Users read their campus memberships"
  ON public.profile_campuses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_campuses.profile_id AND p.user_id = auth.uid()
  ));

INSERT INTO public.profile_campuses (profile_id, campus_id)
SELECT p.id, p.campus_id
FROM public.profiles p
WHERE p.campus_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_profile_campuses_campus
  ON public.profile_campuses (campus_id);

CREATE OR REPLACE FUNCTION public.can_access_campus(_campus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1
        FROM public.profile_campuses pc
        JOIN public.profiles p ON p.id = pc.profile_id
        WHERE p.user_id = auth.uid() AND pc.campus_id = _campus_id
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND campus_id = _campus_id
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  )
$$;