
-- Create user_signatures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user_signatures',
  'user_signatures', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
);

-- Create storage policies for user_signatures bucket
CREATE POLICY "Users can upload their own signatures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user_signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own signatures" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user_signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own signatures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user_signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own signatures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user_signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add a new column to track storage path for signatures
ALTER TABLE public.user_signatures 
ADD COLUMN signature_file_path text;

-- Add index for performance
CREATE INDEX idx_user_signatures_file_path ON public.user_signatures(signature_file_path);
