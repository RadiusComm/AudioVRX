/*
  # Create iq_agents table

  1. New Table
    - `iq_agents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `elevenlabs_agent_id` (text)
      - `voice_id` (text)
      - `avatar_url` (text)
      - `document_id` (uuid, references knowledge_base_documents)
      - Standard timestamps and metadata

  2. Security
    - Enable RLS
    - Add policies for user management and admin access
    - Add indexes for performance
*/

-- Create iq_agents table
CREATE TABLE IF NOT EXISTS iq_agents (
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
ALTER TABLE iq_agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own agents"
  ON iq_agents
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all agents"
  ON iq_agents
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Public agents are viewable by everyone"
  ON iq_agents
  FOR SELECT
  TO public
  USING (is_public = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS iq_agents_elevenlabs_agent_id_idx ON iq_agents(elevenlabs_agent_id);
CREATE INDEX IF NOT EXISTS iq_agents_document_id_idx ON iq_agents(document_id);
CREATE INDEX IF NOT EXISTS iq_agents_created_by_idx ON iq_agents(created_by);

-- Create trigger for updated_at
CREATE TRIGGER handle_iq_agents_updated_at
  BEFORE UPDATE ON iq_agents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();