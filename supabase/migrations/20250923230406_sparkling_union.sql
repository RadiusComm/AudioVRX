/*
  # Fix profiles table RLS policy for signup

  1. Security Changes
    - Add policy to allow profile creation during signup
    - Ensure new users can create their own profile record
    - Maintain existing security for other operations

  This migration fixes the RLS policy violation that prevents new users from creating their profile during the signup process.
*/

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON profiles;

-- Create a policy that allows users to insert their own profile during signup
CREATE POLICY "Enable profile creation during signup"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Ensure authenticated users can also create profiles (for admin creation scenarios)
CREATE POLICY "Authenticated users can create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super-admin')
    )
  );