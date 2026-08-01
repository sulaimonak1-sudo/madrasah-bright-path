-- Public website content is readable by visitors, while private settings remain admin-only.
GRANT SELECT ON public.school_settings TO anon, authenticated;

CREATE POLICY "Anyone can read website settings"
  ON public.school_settings FOR SELECT
  TO anon, authenticated
  USING (key LIKE 'website.%');