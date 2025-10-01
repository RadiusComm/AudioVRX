/*
  # Add system_prompt column to scenarios table

  1. Changes
    - Add `system_prompt` column to `scenarios` table
    - Column type: TEXT (nullable)
    - Allows storing AI system prompts for scenarios

  This fixes the error where the application tries to update a non-existent system_prompt column.
*/

ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS system_prompt TEXT;