-- Check current storage policies for portfolio-images bucket
SELECT * FROM storage.buckets WHERE id = 'portfolio-images';

-- Create proper storage policies for portfolio-images bucket
CREATE POLICY "Users can view their own portfolio images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own portfolio images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);