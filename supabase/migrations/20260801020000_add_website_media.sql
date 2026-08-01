ALTER TABLE public.website_posts
  ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Anyone can view gallery images"
  ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

CREATE POLICY "Admins can update gallery images"
  ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND public.is_admin())
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

CREATE POLICY "Admins can delete gallery images"
  ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.is_admin());