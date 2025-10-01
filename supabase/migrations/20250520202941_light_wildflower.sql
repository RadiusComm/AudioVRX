/*
  # Add document type field and constraints

  1. Changes
    - Add type column to knowledge_base_documents
    - Add check constraint for valid types
    - Default type to null
*/

ALTER TABLE knowledge_base_documents
ADD COLUMN IF NOT EXISTS type text
CHECK (type IN ('text', 'file', 'url'));