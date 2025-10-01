/*
  # Create user_roles table

  1. New Table
    - `user_roles`
      - `user_id` (uuid, primary key)
      - `account_id` (text, not uuid)
      - `system_role_id` (uuid)
      - `assigned_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users, admins, and super-admins
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  system_role_id UUID REFERENCES system_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create policies
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles for users in their account"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    (
      -- User is an admin
      EXISTS (
        SELECT 1 FROM profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
      )
    ) AND (
      -- Target role is in the same account as the admin
      account_id = (
        SELECT profiles.account_id::TEXT FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (
      -- User is an admin
      EXISTS (
        SELECT 1 FROM profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
      )
    ) AND (
      -- Target role is in the same account as the admin
      account_id = (
        SELECT profiles.account_id::TEXT FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Super-admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super-admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super-admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_account_id ON user_roles(account_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_system_role_id ON user_roles(system_role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);