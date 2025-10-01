/*
  # Create system roles and account role names tables

  1. New Tables
    - `system_roles` - Defines system-wide role hierarchy
    - `account_role_names` - Stores custom role names per account

  2. Changes
    - Create tables if they don't exist
    - Handle existing data carefully to avoid constraint violations
    - Set up proper relationships between tables
*/

-- First check if system_roles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'system_roles') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE system_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      hierarchy_level integer UNIQUE NOT NULL,
      description text,
      created_at timestamptz DEFAULT now()
    );

    -- Insert default system roles
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES 
      ('super-admin', 1, 'System-wide administrator with full access to all features and data'),
      ('admin', 2, 'Organization administrator with access to manage users within their account'),
      ('general-manager', 3, 'General manager with access to manage multiple stores'),
      ('manager', 4, 'Store manager with access to manage a single store'),
      ('supervisor', 5, 'Supervisor with limited management capabilities'),
      ('employee', 6, 'Regular employee with basic access');
  ELSE
    -- Table exists, check for each role individually and insert only if the hierarchy level is available
    
    -- Check and insert super-admin (level 1)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 1) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'super-admin') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('super-admin', 1, 'System-wide administrator with full access to all features and data');
      END IF;
    END IF;
    
    -- Check and insert admin (level 2)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 2) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'admin') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('admin', 2, 'Organization administrator with access to manage users within their account');
      END IF;
    END IF;
    
    -- Check and insert general-manager (level 3)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 3) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'general-manager') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('general-manager', 3, 'General manager with access to manage multiple stores');
      END IF;
    END IF;
    
    -- Check and insert manager (level 4)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 4) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'manager') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('manager', 4, 'Store manager with access to manage a single store');
      END IF;
    END IF;
    
    -- Check and insert supervisor (level 5)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 5) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'supervisor') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('supervisor', 5, 'Supervisor with limited management capabilities');
      END IF;
    END IF;
    
    -- Check and insert employee (level 6)
    IF NOT EXISTS (SELECT 1 FROM system_roles WHERE hierarchy_level = 6) THEN
      IF NOT EXISTS (SELECT 1 FROM system_roles WHERE name = 'employee') THEN
        INSERT INTO system_roles (name, hierarchy_level, description)
        VALUES ('employee', 6, 'Regular employee with basic access');
      END IF;
    END IF;
  END IF;
END $$;

-- Enable RLS on system_roles
ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;

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

-- Add system_role_id to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS system_role_id uuid REFERENCES system_roles(id);