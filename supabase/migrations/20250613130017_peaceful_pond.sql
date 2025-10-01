-- First check if system_roles table exists
DO $$ 
BEGIN
  -- Check if the table exists
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
  END IF;
END $$;

-- Check if we need to insert default roles
DO $$
DECLARE
  role_count integer;
BEGIN
  -- Count existing roles
  SELECT COUNT(*) INTO role_count FROM system_roles;
  
  -- Only insert if no roles exist
  IF role_count = 0 THEN
    -- Insert default system roles one by one to avoid conflicts
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('super-admin', 1, 'System-wide administrator with full access to all features and data');
    
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('admin', 2, 'Organization administrator with access to manage users within their account');
    
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('general-manager', 3, 'General manager with access to manage multiple stores');
    
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('manager', 4, 'Store manager with access to manage a single store');
    
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('supervisor', 5, 'Supervisor with limited management capabilities');
    
    INSERT INTO system_roles (name, hierarchy_level, description)
    VALUES ('employee', 6, 'Regular employee with basic access');
  END IF;
END $$;

-- Create account_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS account_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  system_role_id uuid REFERENCES system_roles(id) ON DELETE CASCADE,
  custom_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, system_role_id)
);

-- Enable RLS on account_roles
ALTER TABLE account_roles ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_account_roles_updated_at'
  ) THEN
    CREATE TRIGGER handle_account_roles_updated_at
      BEFORE UPDATE ON account_roles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Add system_role_id to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'system_role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN system_role_id uuid;
    
    -- Add foreign key constraint only if we just added the column
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_system_role_id_fkey 
    FOREIGN KEY (system_role_id) REFERENCES system_roles(id);
  END IF;
END $$;