/*
  # Fix roleplay_sessions RLS policies

  1. Changes
    - Drop existing policies if they exist
    - Create new policies with proper auth.uid() references
    - Add separate policies for different operations
    
  2. Security
    - Allow users to manage their own sessions
    - Allow admins to insert sessions for any user
    - Allow users to insert sessions for themselves
*/

-- First check if policies exist before dropping them
DO $$ 
BEGIN
  -- Drop policies only if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roleplay_sessions_user_manage' AND tablename = 'roleplay_sessions') THEN
    DROP POLICY "roleplay_sessions_user_manage" ON roleplay_sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roleplay_sessions_user_manage_own' AND tablename = 'roleplay_sessions') THEN
    DROP POLICY "roleplay_sessions_user_manage_own" ON roleplay_sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roleplay_sessions_admin_insert' AND tablename = 'roleplay_sessions') THEN
    DROP POLICY "roleplay_sessions_admin_insert" ON roleplay_sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roleplay_sessions_user_insert_own' AND tablename = 'roleplay_sessions') THEN
    DROP POLICY "roleplay_sessions_user_insert_own" ON roleplay_sessions;
  END IF;
END $$;

-- Create new policies
-- Allow users to manage their own sessions
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