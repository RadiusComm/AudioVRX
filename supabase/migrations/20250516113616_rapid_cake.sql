/*
  # Fix user management data retrieval

  1. Changes
    - Simplify get_auth_users function
    - Remove unnecessary role checks
    - Return all user data
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_auth_users();

-- Create simplified function
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
    id,
    email::text,
    created_at
  FROM auth.users;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users TO authenticated;