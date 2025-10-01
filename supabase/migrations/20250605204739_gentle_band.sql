/*
  # Create storage bucket for store logos

  1. Changes
    - Create a new storage bucket for store logos
    - Set up public access for the bucket
    - Add RLS policies for upload and delete operations
*/

-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Store logos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'store-logos');

CREATE POLICY "Authenticated users can upload store logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-logos');

CREATE POLICY "Users can update their own store logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'store-logos' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));

CREATE POLICY "Users can delete their own store logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'store-logos' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));