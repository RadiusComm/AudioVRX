/*
  # Add admin-only delete policy for roleplay sessions

  1. Changes
    - Add policy to allow only admins to delete roleplay sessions
    - Ensure proper access control for session management
    - Maintain existing user access for their own sessions

  2. Security
    - Restrict delete operations to admin users only
    - Keep existing policies for other operations
*/

-- Create policy for admin-only deletion if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_sessions' 
    AND policyname = 'roleplay_sessions_admin_delete'
  ) THEN
    CREATE POLICY "roleplay_sessions_admin_delete"
      ON roleplay_sessions
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Update existing user policy to exclude DELETE if needed
DO $$
BEGIN
  -- Check if the policy exists and includes DELETE
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_sessions' 
    AND policyname = 'roleplay_sessions_user_manage_own'
    AND cmd = 'ALL'
  ) THEN
    -- Drop the existing policy
    DROP POLICY "roleplay_sessions_user_manage_own" ON roleplay_sessions;
    
    -- Recreate it without DELETE permission
    CREATE POLICY "roleplay_sessions_user_manage_own"
      ON roleplay_sessions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
      
    CREATE POLICY "roleplay_sessions_user_update_own"
      ON roleplay_sessions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;