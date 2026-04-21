
-- Make the invoicelogos bucket public so uploaded logos can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'invoicelogos';

-- Create RLS policies for the invoicelogos bucket to allow proper access control

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload logos to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'invoicelogos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all logos (since they're business logos meant to be shown on invoices)
CREATE POLICY "Anyone can view uploaded logos" ON storage.objects
FOR SELECT USING (bucket_id = 'invoicelogos');

-- Allow users to update their own logos
CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'invoicelogos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'invoicelogos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
