/*
  # Create roleplay tables and policies

  1. New Tables
    - `roleplay_scenarios`
      - Core scenario data (title, description, type)
      - Difficulty level and objectives
      - Conversation structure (intents, branches)
      - References to personas and creators
    
    - `roleplay_sessions`
      - Session tracking and progress
      - Transcript storage
      - Performance metrics and feedback

  2. Security
    - Enable RLS on both tables
    - Public read access for public scenarios
    - Creator access to own content
    - Admin access to all content
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public scenarios are viewable by everyone" ON roleplay_scenarios;
DROP POLICY IF EXISTS "Users can manage their own scenarios" ON roleplay_scenarios;
DROP POLICY IF EXISTS "Admins can manage all scenarios" ON roleplay_scenarios;
DROP POLICY IF EXISTS "Users can view and manage their own sessions" ON roleplay_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON roleplay_sessions;

-- Create roleplay_scenarios table
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

-- Create roleplay_sessions table
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

-- Roleplay scenarios policies
CREATE POLICY "Public scenarios are viewable by everyone"
  ON roleplay_scenarios
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can manage their own scenarios"
  ON roleplay_scenarios
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all scenarios"
  ON roleplay_scenarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Roleplay sessions policies
CREATE POLICY "Users can view and manage their own sessions"
  ON roleplay_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON roleplay_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );