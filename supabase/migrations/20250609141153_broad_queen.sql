/*
  # Fix admin update permissions for roleplay sessions

  1. Changes
    - Add policy for admins to update any session
    - Ensure admins have full control over all sessions
    - Maintain existing user permissions

  2. Security
    - Maintain RLS security model
    - Only allow admins to update any session
    - Users can still only manage their own sessions
*/

-- Create policy for admins to update any session
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'roleplay_sessions_admin_update' 
    AND tablename = 'roleplay_sessions'
  ) THEN
    CREATE POLICY "roleplay_sessions_admin_update"
      ON roleplay_sessions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;