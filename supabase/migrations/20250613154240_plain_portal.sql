/*
  # Add trigger to insert user_roles on signup

  1. New Trigger
    - Automatically inserts a row into user_roles when a new user is created
    - Uses the role and account_id from the profiles table
    - Maintains data consistency between profiles and user_roles tables

  2. Security
    - Trigger runs with security definer to ensure proper permissions
    - Only executes after a successful profile creation
*/

-- Create function to handle user role assignment on signup
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Get the system_role_id based on the user's role in profiles
  SELECT id INTO role_id
  FROM system_roles
  WHERE name = NEW.role
  LIMIT 1;

  -- Insert into user_roles table
  INSERT INTO user_roles (
    user_id,
    account_id,
    system_role_id,
    assigned_by,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.account_id,
    role_id,
    NEW.id, -- Self-assigned for new users
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    account_id = EXCLUDED.account_id,
    system_role_id = EXCLUDED.system_role_id,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_new_user_role_trigger'
  ) THEN
    CREATE TRIGGER handle_new_user_role_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_role();
  END IF;
END $$;