/*
  # Rename file_url column to content in knowledge_base_documents table

  1. Changes
    - Rename file_url column to content
    - Maintain existing data and constraints
*/

ALTER TABLE knowledge_base_documents 
RENAME COLUMN file_url TO content;