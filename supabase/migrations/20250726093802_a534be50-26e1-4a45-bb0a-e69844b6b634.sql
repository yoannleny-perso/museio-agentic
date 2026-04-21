-- Create storage policies for username-based event uploads
-- Allow users to upload to events/{username}/ paths

CREATE POLICY "Users can upload event images to their username folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = 'events'
  AND (storage.foldername(name))[2] = (
    SELECT username FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view event images in username folders" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = 'events'
);

CREATE POLICY "Users can update their own event images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = 'events'
  AND (storage.foldername(name))[2] = (
    SELECT username FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own event images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio-images' 
  AND (storage.foldername(name))[1] = 'events'
  AND (storage.foldername(name))[2] = (
    SELECT username FROM public.profiles WHERE id = auth.uid()
  )
);