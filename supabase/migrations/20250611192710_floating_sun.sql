/*
  # Add account_id to profiles table

  1. Changes
    - Add account_id column to profiles table
    - Make column nullable to support existing records
    - Add email column to profiles table for easier querying
    
  2. Details
    - account_id will be used to group users by organization
    - email column mirrors auth.users email for easier access
*/

-- Add account_id column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_id text,
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);