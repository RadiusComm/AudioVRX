/*
  # Add document_id column to personas table

  1. Changes
    - Add document_id column that references knowledge_base_documents
    - Make column nullable to support existing records
    - Add foreign key constraint with CASCADE on delete
*/

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES knowledge_base_documents(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS personas_document_id_idx ON personas(document_id);