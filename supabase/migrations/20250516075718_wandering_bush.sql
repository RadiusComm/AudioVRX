/*
  # Create personas and scenarios tables

  1. New Tables
    - `personas`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `company` (text)
      - `industry` (text)
      - `background` (text)
      - `personality` (text[])
      - `voice_type` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)
      - `is_public` (boolean)

    - `scenarios`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `persona_id` (uuid, references personas)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)
      - `is_public` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Public read access for public items
      - Creator read/write access
      - Admin full access
*/

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  company text,
  industry text,
  background text NOT NULL,
  personality text[] NOT NULL,
  voice_type text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  CONSTRAINT valid_voice_type CHECK (
    voice_type IN (
      'male_professional',
      'female_professional',
      'male_casual',
      'female_casual'
    )
  )
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Personas policies
CREATE POLICY "Public personas are viewable by everyone"
  ON personas
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can manage their own personas"
  ON personas
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all personas"
  ON personas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Scenarios policies
CREATE POLICY "Public scenarios are viewable by everyone"
  ON scenarios
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can manage their own scenarios"
  ON scenarios
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all scenarios"
  ON scenarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );