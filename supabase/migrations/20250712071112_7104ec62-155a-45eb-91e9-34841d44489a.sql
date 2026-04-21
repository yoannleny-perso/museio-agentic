-- Drop existing portfolio-images storage policies
DROP POLICY IF EXISTS "Users can view their own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own portfolio images" ON storage.objects;

-- Create updated storage policies for portfolio-images bucket that handle nested folder structures
CREATE POLICY "Users can view their own portfolio images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'portfolio-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (auth.uid()::text = (storage.foldername(name))[2] AND (storage.foldername(name))[1] IN ('featured-cards', 'profile-images'))
  )
);

CREATE POLICY "Users can upload their own portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (auth.uid()::text = (storage.foldername(name))[2] AND (storage.foldername(name))[1] IN ('featured-cards', 'profile-images'))
  )
);

CREATE POLICY "Users can update their own portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (auth.uid()::text = (storage.foldername(name))[2] AND (storage.foldername(name))[1] IN ('featured-cards', 'profile-images'))
  )
);

CREATE POLICY "Users can delete their own portfolio images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (auth.uid()::text = (storage.foldername(name))[2] AND (storage.foldername(name))[1] IN ('featured-cards', 'profile-images'))
  )
);