/*
  # Fix get_auth_users function to return all users

  1. Changes
    - Drop existing get_auth_users function
    - Create new function that properly handles admin access
    - Return all users for admins, only own data for regular users
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_auth_users();

-- Create new function with proper access control
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT role INTO requesting_user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Return all users if admin, otherwise just the requesting user
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at
  FROM auth.users au
  WHERE 
    CASE 
      WHEN requesting_user_role = 'admin' THEN true
      ELSE au.id = auth.uid()
    END;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;