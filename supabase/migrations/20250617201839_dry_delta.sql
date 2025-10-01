/*
  # Create system_prompts table

  1. New Table
    - `system_prompts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for super-admin access
*/

-- Create system_prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create policies
CREATE POLICY "Super-admins can manage system prompts"
  ON system_prompts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super-admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super-admin'
    )
  );

-- Allow all users to view system prompts
CREATE POLICY "All users can view system prompts"
  ON system_prompts
  FOR SELECT
  TO authenticated
  USING (true);