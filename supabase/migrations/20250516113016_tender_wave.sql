/*
  # Fix ambiguous ID column in auth users query

  1. Changes
    - Update get_auth_users function to use fully qualified column names
    - Ensure proper table references for id columns
  
  2. Security
    - Maintain existing RLS policies
    - Function remains accessible to authenticated users only
*/

CREATE OR REPLACE FUNCTION public.get_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au;
END;
$$;