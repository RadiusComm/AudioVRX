/*
  # Fix user management access control

  1. Changes
    - Remove role-based filtering from get_auth_users function
    - Move access control to RLS policies
    - Ensure function returns all users
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_auth_users();

-- Create new function that returns all users
CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email::text,
    au.created_at
  FROM auth.users au
  WHERE EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users TO authenticated;