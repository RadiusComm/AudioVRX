/*
  # Update user store assignments schema

  1. Changes
    - Add migration to ensure user_store_assignments table exists
    - Create proper indexes for better query performance
    - Set up RLS policies for secure access control
    
  2. Security
    - Enable RLS on the table
    - Add policies for users to view their own assignments
    - Add policies for admins to manage all assignments
*/

-- Ensure the user_store_assignments table exists
CREATE TABLE IF NOT EXISTS user_store_assignments (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, store_id)
);

-- Create indexes for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_store_assignments_user_id ON user_store_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_store_assignments_store_id ON user_store_assignments(store_id);

-- Enable RLS if not already enabled
ALTER TABLE user_store_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their store assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can manage store assignments" ON user_store_assignments;

-- Create policies for user_store_assignments
CREATE POLICY "Users can view their store assignments"
  ON user_store_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage store assignments"
  ON user_store_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );