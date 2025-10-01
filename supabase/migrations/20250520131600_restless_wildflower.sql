/*
  # Add knowledge_base_id to knowledge base documents

  1. Changes
    - Add knowledge_base_id column to store ElevenLabs knowledge base ID
    - Make column nullable to support existing records
*/

ALTER TABLE knowledge_base_documents
ADD COLUMN IF NOT EXISTS knowledge_base_id text;