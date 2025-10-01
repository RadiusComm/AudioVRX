/*
  # Create user activation tokens table

  1. New Table
    - `user_activation_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `token` (text, unique)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin access only
*/

-- Create user_activation_tokens table
CREATE TABLE IF NOT EXISTS user_activation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE user_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admins can access activation tokens"
  ON user_activation_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_activation_tokens_user_id_idx ON user_activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS user_activation_tokens_token_idx ON user_activation_tokens(token);