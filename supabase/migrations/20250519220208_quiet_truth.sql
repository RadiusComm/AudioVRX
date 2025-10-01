/*
  # Add persona type field

  1. Changes
    - Add type column to personas table
    - Set default value to 'employee'
    - Add check constraint for valid types
*/

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'employee'
CHECK (type IN ('employee', 'customer'));