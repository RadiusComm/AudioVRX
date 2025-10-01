/*
  # Create role_mappings table

  1. New Tables
    - `role_mappings`
      - `id` (uuid, primary key)
      - `accountId` (text, not null) - The account identifier
      - `originalRole` (text, not null) - The original system role name
      - `customName` (text, not null) - The custom display name for the role
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `role_mappings` table
    - Add policies for admins to manage all role mappings
    - Add policies for users to manage role mappings in their account
    - Add policies for users to view role mappings in their account

  3. Indexes
    - Add index on accountId for efficient filtering
    - Add unique constraint on accountId + originalRole combination
*/

-- Create the role_mappings table
CREATE TABLE IF NOT EXISTS role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" text NOT NULL,
  "originalRole" text NOT NULL,
  "customName" text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE("accountId", "originalRole")
);

-- Enable RLS
ALTER TABLE role_mappings ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS role_mappings_account_id_idx ON role_mappings ("accountId");
CREATE INDEX IF NOT EXISTS role_mappings_original_role_idx ON role_mappings ("originalRole");

-- Policies for admins (super-admin can manage all)
CREATE POLICY "Super admins can manage all role mappings"
  ON role_mappings
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

-- Policies for account admins (can manage mappings for their account)
CREATE POLICY "Account admins can manage their account role mappings"
  ON role_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.account_id = role_mappings."accountId"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.account_id = role_mappings."accountId"
    )
  );

-- Policy for users to view role mappings in their account
CREATE POLICY "Users can view role mappings in their account"
  ON role_mappings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_id = role_mappings."accountId"
    )
  );