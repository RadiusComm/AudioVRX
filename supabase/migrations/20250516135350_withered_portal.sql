/*
  # Create roleplay scenarios and sessions tables

  1. New Tables
    - `roleplay_scenarios`
      - Core scenario data
      - Type and difficulty constraints
      - References to personas
    - `roleplay_sessions`
      - Session tracking
      - Transcript and feedback storage
      - User performance metrics

  2. Security
    - Enable RLS on both tables
    - Policies for public access, user management, and admin control
*/

-- Create roleplay_scenarios table if it doesn't exist
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  difficulty text NOT NULL,
  objectives text[] NOT NULL,
  success_criteria text[] NOT NULL,
  intents jsonb NOT NULL,
  branches jsonb NOT NULL,
  persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false
);

-- Add type constraint
DO $$ BEGIN
  ALTER TABLE roleplay_scenarios
    ADD CONSTRAINT valid_type CHECK (
      type IN (
        'discovery_call',
        'cold_call',
        'objection_handling',
        'negotiation',
        'hr_interview',
        'performance_review'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add difficulty constraint
DO $$ BEGIN
  ALTER TABLE roleplay_scenarios
    ADD CONSTRAINT valid_difficulty CHECK (
      difficulty IN (
        'beginner',
        'intermediate',
        'advanced',
        'expert'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create roleplay_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS roleplay_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES roleplay_scenarios(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer,
  feedback jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roleplay_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE roleplay_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for roleplay_scenarios
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_scenarios' 
    AND policyname = 'roleplay_scenarios_public_view'
  ) THEN
    CREATE POLICY "roleplay_scenarios_public_view" 
      ON roleplay_scenarios
      FOR SELECT
      TO public
      USING (is_public = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_scenarios' 
    AND policyname = 'roleplay_scenarios_user_manage'
  ) THEN
    CREATE POLICY "roleplay_scenarios_user_manage" 
      ON roleplay_scenarios
      FOR ALL
      TO authenticated
      USING (auth.uid() = created_by)
      WITH CHECK (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_scenarios' 
    AND policyname = 'roleplay_scenarios_admin_manage'
  ) THEN
    CREATE POLICY "roleplay_scenarios_admin_manage" 
      ON roleplay_scenarios
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      ));
  END IF;
END $$;

-- Create policies for roleplay_sessions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_sessions' 
    AND policyname = 'roleplay_sessions_user_manage'
  ) THEN
    CREATE POLICY "roleplay_sessions_user_manage" 
      ON roleplay_sessions
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'roleplay_sessions' 
    AND policyname = 'roleplay_sessions_admin_view'
  ) THEN
    CREATE POLICY "roleplay_sessions_admin_view" 
      ON roleplay_sessions
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      ));
  END IF;
END $$;