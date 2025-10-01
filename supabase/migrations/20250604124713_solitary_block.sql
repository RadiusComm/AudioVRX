/*
  # Add role constraints to profiles table

  1. Changes
    - Update existing roles to valid values
    - Add role constraint with allowed values
    - Set default role for new users
    - Make role column required
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during migration
*/

-- First, update any existing roles to valid values
UPDATE profiles 
SET role = 'trainee' 
WHERE role NOT IN ('admin', 'gm', 'manager', 'supervisor', 'employee');

-- Drop existing role column constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'gm', 'manager', 'supervisor', 'employee', 'trainee'));

-- Set default role for new users
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'employee';

-- Make role column NOT NULL
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL;