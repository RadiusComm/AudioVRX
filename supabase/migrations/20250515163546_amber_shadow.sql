/*
  # Fix get_auth_users function type mismatch

  1. Changes
    - Drop existing get_auth_users function
    - Create new get_auth_users function with correct type casting
    
  2. Details
    - Ensures all string columns are explicitly cast as TEXT
    - Returns user data from auth.users table with proper types
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_auth_users();

-- Create the function with explicit TEXT casting
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
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    CAST(au.email AS TEXT),
    au.created_at
  FROM auth.users au;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;