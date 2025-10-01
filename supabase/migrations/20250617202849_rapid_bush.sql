-- Create system_prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at with conditional check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_system_prompts_updated_at'
  ) THEN
    CREATE TRIGGER handle_system_prompts_updated_at
      BEFORE UPDATE ON system_prompts
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- Create policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_prompts' 
    AND policyname = 'Super-admins can manage system prompts'
  ) THEN
    CREATE POLICY "Super-admins can manage system prompts"
      ON system_prompts
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
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_prompts' 
    AND policyname = 'All users can view system prompts'
  ) THEN
    CREATE POLICY "All users can view system prompts"
      ON system_prompts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;