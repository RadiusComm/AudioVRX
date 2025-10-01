/*
  # Create role_play_agents table as a copy of iq_agents

  1. Changes
    - Create new table role_play_agents with identical structure to iq_agents
    - Copy all constraints and indexes
    - Set up same RLS policies
*/

-- Create role_play_agents table with same structure as iq_agents
CREATE TABLE IF NOT EXISTS role_play_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  elevenlabs_agent_id text,
  voice_id text,
  avatar_url text,
  document_id uuid REFERENCES knowledge_base_documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE role_play_agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own agents"
  ON role_play_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all agents"
  ON role_play_agents
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Public agents are viewable by everyone"
  ON role_play_agents
  FOR SELECT
  TO public
  USING (is_public = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS role_play_agents_elevenlabs_agent_id_idx ON role_play_agents(elevenlabs_agent_id);
CREATE INDEX IF NOT EXISTS role_play_agents_document_id_idx ON role_play_agents(document_id);
CREATE INDEX IF NOT EXISTS role_play_agents_created_by_idx ON role_play_agents(created_by);

-- Create trigger for updated_at
CREATE TRIGGER handle_role_play_agents_updated_at
  BEFORE UPDATE ON role_play_agents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();