/*
  # Add status column to roleplay_sessions table

  1. Changes
    - Add status column to track session acceptance status
    - Add check constraint for valid status values
    - Add updated_at column for tracking changes
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add status column with constraint
ALTER TABLE roleplay_sessions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_roleplay_sessions_updated_at'
  ) THEN
    CREATE TRIGGER handle_roleplay_sessions_updated_at
    BEFORE UPDATE ON roleplay_sessions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;