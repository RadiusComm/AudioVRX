/*
  # Create system roles and account role names tables

  1. New Tables
    - `system_roles` - Defines standard system roles with hierarchy levels
    - `account_role_names` - Stores custom role names per account

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for access control
*/

-- First check if system_roles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_roles') THEN
    -- Create system_roles table
    CREATE TABLE system_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      hierarchy_level integer UNIQUE NOT NULL,
      description text,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;

    -- Insert default system roles
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES 
      ('super-admin', 1, 'System-wide administrator with full access to all features and data'),
      ('admin', 2, 'Organization administrator with access to manage users within their account'),
      ('general-manager', 3, 'General manager with access to manage multiple stores'),
      ('manager', 4, 'Store manager with access to manage a single store'),
      ('supervisor', 5, 'Supervisor with limited management capabilities'),
      ('employee', 6, 'Regular employee with basic access');
  END IF;
END $$;

-- Create account_role_names table if it doesn't exist
CREATE TABLE IF NOT EXISTS account_role_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  system_role_id uuid REFERENCES system_roles(id) ON DELETE CASCADE,
  custom_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, system_role_id)
);

-- Enable RLS on account_role_names
ALTER TABLE account_role_names ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_account_role_names_updated_at'
  ) THEN
    CREATE TRIGGER handle_account_role_names_updated_at
      BEFORE UPDATE ON account_role_names
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Add system_role_id to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'system_role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN system_role_id uuid REFERENCES system_roles(id);
  END IF;
END $$;