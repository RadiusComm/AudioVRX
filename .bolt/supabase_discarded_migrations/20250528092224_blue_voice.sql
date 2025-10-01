/*
  # Create voice types table

  1. New Table
    - `voice_types`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for admin management
*/

-- Create voice_types table
CREATE TABLE IF NOT EXISTS voice_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE voice_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Voice types are readable by everyone"
  ON voice_types
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage voice types"
  ON voice_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER handle_voice_types_updated_at
  BEFORE UPDATE ON voice_types
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial voice types
INSERT INTO voice_types (id, name, description) VALUES
  (
    'male_professional_1',
    'Michael (Professional)',
    ARRAY['male', 'professional', 'authoritative', 'clear']
  ),
  (
    'male_professional_2',
    'David (Professional)',
    ARRAY['male', 'professional', 'confident', 'articulate']
  ),
  (
    'male_casual_1',
    'James (Casual)',
    ARRAY['male', 'casual', 'friendly', 'approachable']
  ),
  (
    'male_casual_2',
    'Alex (Casual)',
    ARRAY['male', 'casual', 'energetic', 'relatable']
  ),
  (
    'female_professional_1',
    'Sarah (Professional)',
    ARRAY['female', 'professional', 'confident', 'clear']
  ),
  (
    'female_professional_2',
    'Emily (Professional)',
    ARRAY['female', 'professional', 'authoritative', 'articulate']
  ),
  (
    'female_casual_1',
    'Jessica (Casual)',
    ARRAY['female', 'casual', 'friendly', 'warm']
  ),
  (
    'female_casual_2',
    'Emma (Casual)',
    ARRAY['female', 'casual', 'energetic', 'approachable']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;