/*
  # Add agent_id column to personas table

  1. Changes
    - Add agent_id column to store ElevenLabs agent identifier
    - Make column nullable to support existing records
    - Add index for faster lookups

  2. Details
    - Column stores ElevenLabs agent ID as text
    - Allows linking personas with their ElevenLabs counterparts
*/

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS agent_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS personas_agent_id_idx ON personas(agent_id);