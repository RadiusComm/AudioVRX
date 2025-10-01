/*
  # Add secure access to auth users

  1. New Functions
    - `get_auth_users`: Function to safely access auth.users data
      - Returns user email only if requester is admin or owns the record
      - Includes basic user information like email and sign in dates
  
  2. Security
    - Function security barrier ensures proper access control
    - Only authenticated users can execute the function
    - Results filtered based on user role and ownership
*/

-- Create a function to safely access auth.users data
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'admin' THEN
    -- Admin can see all users
    RETURN QUERY SELECT 
      u.id,
      u.email,
      u.email_confirmed_at,
      u.last_sign_in_at
    FROM auth.users u;
  ELSE
    -- Regular users can only see their own data
    RETURN QUERY SELECT 
      u.id,
      u.email,
      u.email_confirmed_at,
      u.last_sign_in_at
    FROM auth.users u
    WHERE u.id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users TO authenticated;