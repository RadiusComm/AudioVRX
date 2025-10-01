/*
  # Update role constraint to include super-admin

  1. Changes
    - Drop existing role constraint
    - Add new constraint with super-admin role
    - Ensure all roles are properly defined
*/

-- Drop existing role column constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with super-admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'general-manager', 'manager', 'supervisor', 'employee', 'super-admin'));