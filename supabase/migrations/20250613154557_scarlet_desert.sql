/*
  # Add trigger to update user_roles when profile role changes

  1. Changes
    - Create function to update user_roles when profile role changes
    - Add trigger to profiles table for role updates
    - Ensure system_role_id stays in sync with profile role
    
  2. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
    - Only updates user_roles when role actually changes
*/

-- Create function to handle user role updates
CREATE OR REPLACE FUNCTION handle_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Only proceed if the role has changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Get the system_role_id based on the user's new role
    SELECT id INTO role_id
    FROM system_roles
    WHERE name = NEW.role
    LIMIT 1;

    -- Update the user_roles table
    UPDATE user_roles
    SET 
      system_role_id = role_id,
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for updates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_profile_role_update_trigger'
  ) THEN
    CREATE TRIGGER handle_profile_role_update_trigger
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_profile_role_update();
  END IF;
END $$;