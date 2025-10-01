/*
  # Add persona type field

  1. Changes
    - Add type column to personas table
    - Make type nullable
    - Add check constraint for valid types
*/

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS type text
CHECK (type IN ('employee', 'customer'));