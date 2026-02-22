
-- Add signature_url column to profiles for teacher signatures
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- Add class_teacher_class_level_id for teachers assigned to levels without arms
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_teacher_class_level_id uuid REFERENCES public.class_levels(id);

-- Allow admins to update any profile (for staff management)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin());

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin());

-- Create storage policy for teacher signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own signature"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own signature"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Signatures are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');
