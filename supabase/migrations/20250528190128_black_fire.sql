-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Voice types are viewable by everyone" ON voice_types;

-- Drop existing table if it exists
DROP TABLE IF EXISTS voice_types;

-- Create voice_types table
CREATE TABLE voice_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  qualities text[] NOT NULL,
  elevenlabs_voice_id text NOT NULL,
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
INSERT INTO voice_types (id, name, description, qualities, elevenlabs_voice_id) VALUES
  ('male_professional_1', 'Michael', 'Professional male voice with authoritative tone', ARRAY['male', 'professional', 'authoritative', 'clear'], 'UgBBYS2sOqTuMpoF3BR0'),
  ('male_professional_2', 'David', 'Professional male voice with warm tone', ARRAY['male', 'professional', 'warm', 'trustworthy'], 'iP95p4xoKVk53GoZ742B'),
  ('male_casual_1', 'James', 'Casual male voice with friendly tone', ARRAY['male', 'casual', 'friendly', 'energetic'], 'nPczCjzI2devNBz1zQrb'),
  ('male_casual_2', 'Tom', 'Casual male voice with relaxed tone', ARRAY['male', 'casual', 'relaxed', 'approachable'], 'pqHfZKP75CvOlQylNhV4'),
  ('female_professional_1', 'Sarah', 'Professional female voice with confident tone', ARRAY['female', 'professional', 'confident', 'articulate'], '9BWtsMINqrJLrRacOk9x'),
  ('female_professional_2', 'Emily', 'Professional female voice with poised tone', ARRAY['female', 'professional', 'poised', 'sophisticated'], '56AoDkrOh6qfVPDXZ7Pt'),
  ('female_casual_1', 'Rachel', 'Casual female voice with warm tone', ARRAY['female', 'casual', 'warm', 'engaging'], 'g6xIsTj2HwM6VR4iXFCw'),
  ('female_casual_2', 'Lisa', 'Casual female voice with natural tone', ARRAY['female', 'casual', 'natural', 'friendly'], 'bxiObU1YDrf7lrFAyV99')
ON CONFLICT (id) DO NOTHING;