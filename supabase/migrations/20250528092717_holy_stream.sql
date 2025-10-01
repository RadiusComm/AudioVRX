/*
  # Create voice types table

  1. New Table
    - `voice_types`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text[])
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public read access
*/

-- Create voice_types table
CREATE TABLE IF NOT EXISTS voice_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE voice_types ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Voice types are viewable by everyone"
  ON voice_types
  FOR SELECT
  TO public
  USING (true);

-- Insert initial voice types
INSERT INTO voice_types (id, name, description) VALUES
  ('male_professional_1', 'Michael', ARRAY['male', 'professional', 'authoritative', 'clear']),
  ('male_professional_2', 'David', ARRAY['male', 'professional', 'warm', 'trustworthy']),
  ('male_casual_1', 'James', ARRAY['male', 'casual', 'friendly', 'energetic']),
  ('male_casual_2', 'Tom', ARRAY['male', 'casual', 'relaxed', 'approachable']),
  ('female_professional_1', 'Sarah', ARRAY['female', 'professional', 'confident', 'articulate']),
  ('female_professional_2', 'Emily', ARRAY['female', 'professional', 'poised', 'sophisticated']),
  ('female_casual_1', 'Rachel', ARRAY['female', 'casual', 'warm', 'engaging']),
  ('female_casual_2', 'Lisa', ARRAY['female', 'casual', 'natural', 'friendly'])
ON CONFLICT (id) DO NOTHING;