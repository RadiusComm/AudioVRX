/*
  # Fix stores table RLS policies

  1. Changes
    - Add RLS policy for inserting stores
    - Update existing policies to be more permissive for authenticated users
    - Ensure proper policy naming and consistency

  2. Security
    - Enable RLS on stores table (already enabled)
    - Add policy for authenticated users to insert stores
    - Modify existing policies to be more permissive while maintaining security
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Admins can manage all stores" ON stores;
DROP POLICY IF EXISTS "Users can view assigned stores" ON stores;

-- Create new comprehensive policies
CREATE POLICY "Enable insert for authenticated users"
ON stores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for admins"
ON stores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable view for assigned users"
ON stores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_store_assignments
    WHERE user_store_assignments.store_id = stores.id
    AND user_store_assignments.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);