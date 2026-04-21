-- Update the existing INSERT policy to include 'events' folder
DROP POLICY IF EXISTS "Users can upload their own portfolio images" ON storage.objects;

CREATE POLICY "Users can upload their own portfolio images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'portfolio-images' AND (
    (auth.uid())::text = (storage.foldername(name))[1] OR 
    (
      (auth.uid())::text = (storage.foldername(name))[2] AND 
      (storage.foldername(name))[1] = ANY (ARRAY['featured-cards'::text, 'profile-images'::text, 'events'::text])
    )
  )
);

-- Update the existing UPDATE policy to include 'events' folder for consistency
DROP POLICY IF EXISTS "Users can update their own portfolio images" ON storage.objects;

CREATE POLICY "Users can update their own portfolio images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'portfolio-images' AND (
    (auth.uid())::text = (storage.foldername(name))[1] OR 
    (
      (auth.uid())::text = (storage.foldername(name))[2] AND 
      (storage.foldername(name))[1] = ANY (ARRAY['featured-cards'::text, 'profile-images'::text, 'events'::text])
    )
  )
);

-- Update the existing DELETE policy to include 'events' folder for consistency
DROP POLICY IF EXISTS "Users can delete their own portfolio images" ON storage.objects;

CREATE POLICY "Users can delete their own portfolio images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'portfolio-images' AND (
    (auth.uid())::text = (storage.foldername(name))[1] OR 
    (
      (auth.uid())::text = (storage.foldername(name))[2] AND 
      (storage.foldername(name))[1] = ANY (ARRAY['featured-cards'::text, 'profile-images'::text, 'events'::text])
    )
  )
);