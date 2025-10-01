/*
  # Create ElevenLabs Voices Table

  1. New Tables
    - `elevenlabs_voices`
      - `id` (text, primary key) - ElevenLabs voice ID
      - `name` (text) - Voice name
      - `description` (text) - Voice description
      - `category` (text) - Voice category
      - `gender` (text) - Voice gender
      - `accent` (text) - Voice accent
      - `age` (text) - Voice age
      - `use_case` (text) - Voice use case
      - `preview_url` (text) - Preview audio URL
      - `labels` (jsonb) - Additional voice labels/metadata
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `elevenlabs_voices` table
    - Add policy for public read access
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS elevenlabs_voices (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  gender text,
  accent text,
  age text,
  use_case text,
  preview_url text,
  labels jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE elevenlabs_voices ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read voices
CREATE POLICY "Anyone can read voices"
  ON elevenlabs_voices
  FOR SELECT
  TO public
  USING (true);

-- Only admins can insert/update/delete voices
CREATE POLICY "Admins can manage voices"
  ON elevenlabs_voices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super-admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super-admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_elevenlabs_voices_updated_at
  BEFORE UPDATE ON elevenlabs_voices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();