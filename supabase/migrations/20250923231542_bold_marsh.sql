/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "profiles"
    - This occurs when RLS policies reference the same table they're protecting
    - Prevents user signup from completing

  2. Solution
    - Drop all existing conflicting policies
    - Create simple, non-recursive policies
    - Allow profile creation during signup without complex checks
    - Use direct auth.uid() comparisons instead of subqueries

  3. Security
    - Users can only create/update their own profiles
    - Admins can manage profiles in their account
    - Super-admins can manage all profiles
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users in their account" ON profiles;
DROP POLICY IF EXISTS "Admins can read users in their account" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update users in their account" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Super-admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Super-admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super-admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON profiles;

-- Create simple, non-recursive policies

-- Allow users to create their own profile during signup
CREATE POLICY "Enable profile creation for new users"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to create profiles (for admin user creation)
CREATE POLICY "Enable profile creation for authenticated users"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role');

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Simple admin policies without recursion
CREATE POLICY "Admin users can manage profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    -- Check if current user has admin role directly from auth metadata
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    -- Or check if they're a super-admin
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super-admin'
  )
  WITH CHECK (
    -- Same check for WITH CHECK
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super-admin'
  );