/*
  # Add type column to role_play_agents table

  1. Changes
    - Add type column with check constraint for 'voice' and 'text' values
    - Set default value to 'voice'
    - Add index for better query performance
*/

-- Add type column with constraint
ALTER TABLE role_play_agents
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'voice'
CHECK (type IN ('voice', 'text'));

-- Create index for type column
CREATE INDEX IF NOT EXISTS role_play_agents_type_idx ON role_play_agents(type);