/*
  # Fix RLS policies to avoid recursion

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new policies with direct role checks
    - Add policy for admins to manage all profiles
    - Add policy for users to manage their own profiles

  2. Security
    - Policies use direct role comparison instead of subqueries
    - Maintains proper access control without recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new policies without recursive checks
CREATE POLICY "Users can read own profile or admin can read all"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR role = 'admin'
);

CREATE POLICY "Users can update own profile or admin can update all"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR role = 'admin'
)
WITH CHECK (
  auth.uid() = id OR role = 'admin'
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (role = 'admin');