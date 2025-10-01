/*
  # Create stores and user assignments tables

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `store_id` (text)
      - `description` (text)
    
    - `user_store_assignments`
      - Junction table linking users to stores
      - Composite primary key (user_id, store_id)
      - Foreign key constraints with cascade delete

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Users can view assigned stores
      - Admins can manage all stores and assignments
*/

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  store_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user store assignments table
CREATE TABLE IF NOT EXISTS user_store_assignments (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, store_id)
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Users can view assigned stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_store_assignments
      WHERE user_store_assignments.store_id = stores.id
      AND user_store_assignments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all stores"
  ON stores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_store_assignments_user_id ON user_store_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_store_assignments_store_id ON user_store_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id);