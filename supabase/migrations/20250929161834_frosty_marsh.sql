/*
  # Fix Call Analysis RLS Insert Policy

  1. Security
    - Add INSERT policy for call_analysis table
    - Allow authenticated users to insert their own records
    - Ensure user_id matches the authenticated user's ID

  This migration fixes the RLS policy violation when users try to save session records.
*/

-- Add INSERT policy for call_analysis table
CREATE POLICY "Users can insert their own call analysis"
  ON call_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);