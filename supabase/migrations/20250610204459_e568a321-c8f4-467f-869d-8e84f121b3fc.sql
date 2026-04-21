
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload signatures to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;

-- Also drop the existing policies from the migration
DROP POLICY IF EXISTS "Users can upload their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;

-- Make sure the bucket is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'user_signatures';

-- Create new policies with corrected names
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
