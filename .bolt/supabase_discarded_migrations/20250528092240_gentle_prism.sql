/*
  # Update IQ agents voice type reference

  1. Changes
    - Rename voice_type column to voice_id
    - Add foreign key constraint to voice_types table
    - Update existing records to use valid voice IDs
*/

-- Rename column and add foreign key constraint
ALTER TABLE iq_agents
RENAME COLUMN voice_type TO voice_id;

-- Add foreign key constraint
ALTER TABLE iq_agents
ADD CONSTRAINT iq_agents_voice_id_fkey
FOREIGN KEY (voice_id) REFERENCES voice_types(id)
ON DELETE SET NULL;