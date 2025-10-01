/*
  # Create role_mappings table for custom role names

  1. New Table
    - `role_mappings`
      - `id` (uuid, primary key)
      - `accountId` (text)
      - `originalRole` (text)
      - `customName` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can view mappings for their account
      - Admins can manage mappings for their account
      - Super-admins can manage all mappings
*/

-- Create role_mappings table
CREATE TABLE IF NOT EXISTS role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accountId text NOT NULL,
  originalRole text NOT NULL,
  customName text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE role_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view role mappings for their account"
  ON role_mappings
  FOR SELECT
  TO authenticated
  USING (
    accountId = (
      SELECT account_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage role mappings for their account"
  ON role_mappings
  FOR ALL
  TO authenticated
  USING (
    (
      -- User is an admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    ) AND (
      -- Mapping is for their account
      accountId = (
        SELECT account_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (
      -- User is an admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    ) AND (
      -- Mapping is for their account
      accountId = (
        SELECT account_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Super-admins can manage all role mappings"
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

-- Create function to create role_mappings table if it doesn't exist
CREATE OR REPLACE FUNCTION create_role_mappings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'role_mappings'
  ) THEN
    -- Create the table
    CREATE TABLE public.role_mappings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      accountId text NOT NULL,
      originalRole text NOT NULL,
      customName text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.role_mappings ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view role mappings for their account"
      ON public.role_mappings
      FOR SELECT
      TO authenticated
      USING (
        accountId = (
          SELECT account_id FROM profiles
          WHERE profiles.id = auth.uid()
        )
      );

    CREATE POLICY "Admins can manage role mappings for their account"
      ON public.role_mappings
      FOR ALL
      TO authenticated
      USING (
        (
          -- User is an admin
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        ) AND (
          -- Mapping is for their account
          accountId = (
            SELECT account_id FROM profiles
            WHERE profiles.id = auth.uid()
          )
        )
      )
      WITH CHECK (
        (
          -- User is an admin
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        ) AND (
          -- Mapping is for their account
          accountId = (
            SELECT account_id FROM profiles
            WHERE profiles.id = auth.uid()
          )
        )
      );

    CREATE POLICY "Super-admins can manage all role mappings"
      ON public.role_mappings
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
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_role_mappings_table TO authenticated;