/*
  # Add transcript column to call_analysis table

  1. Changes
    - Add transcript column to store conversation transcripts
    - Make column nullable to support existing records
*/

ALTER TABLE call_analysis
ADD COLUMN IF NOT EXISTS transcript text;