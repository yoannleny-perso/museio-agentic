
-- Create user_signatures storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user_signatures',
  'user_signatures', 
  false, -- Keep private for security
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for user_signatures bucket
-- First drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload signatures to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view signatures in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update signatures in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete signatures in their own folder" ON storage.objects;

-- Create new policies for the user_signatures bucket
CREATE POLICY "Users can upload signatures to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user_signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view signatures in their own folder" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user_signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update signatures in their own folder" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user_signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete signatures in their own folder" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user_signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
