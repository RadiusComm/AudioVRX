-- Add voice type column to role_play_agents table
ALTER TABLE role_play_agents
ADD COLUMN voice_type text NOT NULL DEFAULT 'voice';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS role_play_agents_voice_type_idx ON role_play_agents(voice_type);