/*
  # Fix RLS policies for roleplay_sessions table

  1. Changes
    - Drop existing user management policy
    - Create separate policies for different operations
    - Allow admins to insert sessions for any user
    - Allow users to insert sessions only for themselves
    
  2. Security
    - Maintain proper access control
    - Fix permission issues for admin scheduling
*/

-- Drop the existing ALL policy and recreate with more specific policies
DROP POLICY IF EXISTS "roleplay_sessions_user_manage" ON roleplay_sessions;

-- Allow users to manage (SELECT, UPDATE, DELETE) their own sessions
CREATE POLICY "roleplay_sessions_user_manage_own"
  ON roleplay_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to insert sessions for any user
CREATE POLICY "roleplay_sessions_admin_insert"
  ON roleplay_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow users to insert sessions for themselves
CREATE POLICY "roleplay_sessions_user_insert_own"
  ON roleplay_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);