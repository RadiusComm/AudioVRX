/*
  # Add scenario_id column to role_play_agents table

  1. Changes
    - Add `scenario_id` column to `role_play_agents` table
    - Set up foreign key constraint to `scenarios` table
    - Add index for better query performance

  This resolves the error where the application expects a `scenario_id` column
  that doesn't exist in the current database schema.
*/

-- Add scenario_id column to role_play_agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_play_agents' AND column_name = 'scenario_id'
  ) THEN
    ALTER TABLE role_play_agents ADD COLUMN scenario_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to scenarios table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'role_play_agents_scenario_id_fkey'
  ) THEN
    ALTER TABLE role_play_agents 
    ADD CONSTRAINT role_play_agents_scenario_id_fkey 
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'role_play_agents_scenario_id_idx'
  ) THEN
    CREATE INDEX role_play_agents_scenario_id_idx ON role_play_agents(scenario_id);
  END IF;
END $$;