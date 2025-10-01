/*
  # Add initial prompt field to scenarios table

  1. Changes
    - Add initial_prompt column to scenarios table
    - Make column nullable
    - Allow storing conversation starter text
*/

ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS initial_prompt text;