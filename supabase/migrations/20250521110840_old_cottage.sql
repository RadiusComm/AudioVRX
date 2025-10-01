/*
  # Create call analysis table

  1. New Table
    - `call_analysis`
      - `id` (uuid, primary key)
      - `agent_id` (text)
      - `conversation_id` (text)
      - `analysis` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users and admins
*/

-- Create call_analysis table
CREATE TABLE IF NOT EXISTS call_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  conversation_id text NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own call analysis"
  ON call_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas
      WHERE personas.agent_id = call_analysis.agent_id
      AND personas.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all call analysis"
  ON call_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS call_analysis_agent_id_idx ON call_analysis(agent_id);
CREATE INDEX IF NOT EXISTS call_analysis_conversation_id_idx ON call_analysis(conversation_id);