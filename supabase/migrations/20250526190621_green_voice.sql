/*
  # Create role-plays table

  1. New Table
    - `role_plays`
      - Core fields for role-play scenarios
      - References to IQ agents
      - Type and difficulty constraints
      - Cover image and metadata

  2. Security
    - Enable RLS
    - Add policies for public access and user management
*/

-- Create role_plays table
CREATE TABLE IF NOT EXISTS role_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  iq_agent_id uuid REFERENCES iq_agents(id) ON DELETE SET NULL,
  type text CHECK (type IN ('employee', 'customer')),
  cover_page_url text,
  difficulty_level text NOT NULL CHECK (
    difficulty_level IN (
      'beginner',
      'intermediate',
      'advanced',
      'expert'
    )
  ),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE role_plays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own role-plays"
  ON role_plays
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all role-plays"
  ON role_plays
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Public role-plays are viewable by everyone"
  ON role_plays
  FOR SELECT
  TO public
  USING (is_public = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS role_plays_iq_agent_id_idx ON role_plays(iq_agent_id);
CREATE INDEX IF NOT EXISTS role_plays_created_by_idx ON role_plays(created_by);

-- Create trigger for updated_at
CREATE TRIGGER handle_role_plays_updated_at
  BEFORE UPDATE ON role_plays
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();