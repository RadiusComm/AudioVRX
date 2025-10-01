/*
  # Add RLS policy for profile creation

  1. Security Changes
    - Add policy for authenticated users to create their own profile
    - This complements the existing service role policy
    - Ensures users can only create a profile with their own ID
*/

-- Add policy for authenticated users to create their own profile
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);