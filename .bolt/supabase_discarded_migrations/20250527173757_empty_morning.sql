/*
  # Add ElevenLabs agent ID to scenarios table

  1. Changes
    - Add elevenlabs_agent_id column to store ElevenLabs agent identifier
    - Make column nullable to support existing records
*/

ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text;