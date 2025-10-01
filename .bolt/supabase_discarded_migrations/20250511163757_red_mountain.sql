/*
  # Storage policies for avatar management
  
  1. Security
    - Enable RLS on storage.objects
    - Add policies for CRUD operations on avatars
    - Ensure users can only manage their own avatars
    - Allow public read access to all avatars
  
  2. Policies
    - Upload: Users can upload avatars to their own directory
    - Update: Users can update their own avatars
    - Delete: Users can delete their own avatars
    - Read: Public access to view avatars
*/

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policy to allow users to upload their own avatars
create policy "Users can upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to update their own avatars
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to delete their own avatars
create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow public access to avatars
create policy "Public can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');