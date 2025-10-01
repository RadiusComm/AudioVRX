/*
  # Fix roleplay sessions insert policy

  1. Security Changes
    - Update INSERT policy for roleplay_sessions table
    - Allow admins and super-admins to insert sessions for any user
    - Ensure users can still insert their own sessions
    
  2. Policy Updates
    - Drop existing restrictive admin insert policy
    - Create new comprehensive admin insert policy
    - Maintain user self-insert policy
*/

-- Drop the existing restrictive admin insert policy
DROP POLICY IF EXISTS "roleplay_sessions_admin_insert" ON roleplay_sessions;

-- Create a new comprehensive admin insert policy that allows admins to schedule for users in their account
CREATE POLICY "roleplay_sessions_admin_insert_comprehensive"
  ON roleplay_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super admins can insert for anyone
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super-admin'
    ))
    OR
    -- Admins can insert for users in their account
    (EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM profiles user_profile
        WHERE user_profile.id = roleplay_sessions.user_id
        AND user_profile.account_id = admin_profile.account_id
      )
    ))
    OR
    -- Users can insert their own sessions
    (auth.uid() = user_id)
  );