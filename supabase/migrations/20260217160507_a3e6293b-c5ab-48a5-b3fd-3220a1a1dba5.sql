
-- School settings table for storing config like authorization key
CREATE TABLE public.school_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins full access on school_settings"
  ON public.school_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert default authorization key (admin should change this)
INSERT INTO public.school_settings (key, value) VALUES ('staff_auth_key', 'ALBARI2025');

-- Trigger for updated_at
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
