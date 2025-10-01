/*
  # Add user statistics columns to profiles table

  1. Changes
    - Add completed_scenarios (integer)
    - Add average_score (integer)
    - Add last_active (timestamptz)
    - Add status (text)
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS completed_scenarios integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));