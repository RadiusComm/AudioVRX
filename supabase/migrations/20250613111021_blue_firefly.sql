/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop problematic policies that cause infinite recursion
    - Create new policies with proper table aliases
    - Add separate policies for admins and super-admins
    - Use conditional policy creation to avoid "already exists" errors
    
  2. Security
    - Admins can only manage users in their own account
    - Super-admins can manage all users
    - Regular users can only manage their own profiles
*/

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read users in their account" ON profiles;
DROP POLICY IF EXISTS "Admins can update users in their account" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users in their account" ON profiles;

-- Create admin policies with conditional checks
DO $$ 
BEGIN
  -- Admin read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can read users in their account'
  ) THEN
    CREATE POLICY "Admins can read users in their account"
      ON profiles
      FOR SELECT
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
          -- Target user is in the same account
          (
            SELECT profiles_1.account_id FROM profiles profiles_1
            WHERE profiles_1.id = auth.uid()
          ) = account_id
        )
      );
  END IF;

  -- Admin update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update users in their account'
  ) THEN
    CREATE POLICY "Admins can update users in their account"
      ON profiles
      FOR UPDATE
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
          -- Target user is in the same account
          (
            SELECT profiles_1.account_id FROM profiles profiles_1
            WHERE profiles_1.id = auth.uid()
          ) = account_id
        ) AND (
          -- Target user is not a super-admin
          role <> 'super-admin'
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
          -- Target user is in the same account
          (
            SELECT profiles_1.account_id FROM profiles profiles_1
            WHERE profiles_1.id = auth.uid()
          ) = account_id
        ) AND (
          -- Target user is not a super-admin
          role <> 'super-admin'
        )
      );
  END IF;

  -- Admin delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can delete users in their account'
  ) THEN
    CREATE POLICY "Admins can delete users in their account"
      ON profiles
      FOR DELETE
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
          -- Target user is in the same account
          (
            SELECT profiles_1.account_id FROM profiles profiles_1
            WHERE profiles_1.id = auth.uid()
          ) = account_id
        ) AND (
          -- Target user is not a super-admin
          role <> 'super-admin'
        )
      );
  END IF;

  -- Super-admin read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Super-admins can read all profiles'
  ) THEN
    CREATE POLICY "Super-admins can read all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles profiles_1
          WHERE profiles_1.id = auth.uid() 
          AND profiles_1.role = 'super-admin'
        )
      );
  END IF;

  -- Super-admin update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Super-admins can update all profiles'
  ) THEN
    CREATE POLICY "Super-admins can update all profiles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles profiles_1
          WHERE profiles_1.id = auth.uid() 
          AND profiles_1.role = 'super-admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles profiles_1
          WHERE profiles_1.id = auth.uid() 
          AND profiles_1.role = 'super-admin'
        )
      );
  END IF;

  -- Super-admin delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Super-admins can delete any profile'
  ) THEN
    CREATE POLICY "Super-admins can delete any profile"
      ON profiles
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles profiles_1
          WHERE profiles_1.id = auth.uid() 
          AND profiles_1.role = 'super-admin'
        )
      );
  END IF;
END $$;