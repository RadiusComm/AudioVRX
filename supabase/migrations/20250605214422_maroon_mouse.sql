/*
  # Create user-images storage bucket

  1. New Storage Bucket
    - `user-images`
      - Public access for viewing images
      - Restricted access for uploading/modifying

  2. Security
    - Public read access for all images
    - Write access limited to authenticated users
    - Update/delete limited to image owners and admins
*/

-- Create storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-images', 'user-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "User images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-images');

CREATE POLICY "Authenticated users can upload user images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images');

CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));

CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-images' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));