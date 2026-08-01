CREATE TABLE public.website_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('news', 'event')),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'School News',
  excerpt TEXT NOT NULL DEFAULT '',
  event_date DATE,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT website_events_have_dates CHECK (type = 'news' OR event_date IS NOT NULL)
);

ALTER TABLE public.website_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published website posts"
  ON public.website_posts FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Admins manage website posts"
  ON public.website_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX website_posts_public_order_idx
  ON public.website_posts (type, published_at DESC, sort_order);

CREATE TRIGGER update_website_posts_updated_at
  BEFORE UPDATE ON public.website_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();