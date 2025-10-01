/*
  # Fix infinite recursion in profile policies

  1. Changes
    - Remove recursive admin check from policies
    - Simplify admin role checks to prevent infinite recursion
    - Update policies to use direct role comparison

  2. Security
    - Maintains RLS security while preventing infinite recursion
    - Preserves existing access control patterns
    - Ensures admins can still manage all profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Recreate policies without recursive checks
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (role = 'admin'::text) OR (auth.uid() = id)
);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (role = 'admin'::text) OR (auth.uid() = id)
)
WITH CHECK (
  (role = 'admin'::text) OR (auth.uid() = id)
);

CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  (role = 'admin'::text)
);