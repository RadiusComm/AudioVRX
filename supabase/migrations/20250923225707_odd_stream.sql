/*
  # Create scenario images storage bucket

  1. New Storage Bucket
    - `scenario-images`
      - Public access for viewing images
      - Restricted access for uploading/modifying

  2. Security
    - Public read access for all images
    - Write access limited to authenticated users
    - Update/delete limited to image owners and admins
*/

-- Create storage bucket for scenario cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scenario-images', 'scenario-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Scenario images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'scenario-images');

CREATE POLICY "Authenticated users can upload scenario images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scenario-images');

CREATE POLICY "Users can update their own scenario images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'scenario-images' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));

CREATE POLICY "Users can delete their own scenario images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'scenario-images' AND (auth.uid() = owner OR auth.uid() IN (
  SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'
)));