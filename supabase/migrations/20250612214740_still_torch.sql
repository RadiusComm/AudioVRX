/*
  # Add super-admin role to profiles table

  1. Changes
    - Update role constraint to include super-admin role
    - Ensure backward compatibility with existing roles
    
  2. Security
    - Maintain existing RLS policies
    - Super-admin will have access to all data
*/

-- Drop existing role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with super-admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'general-manager', 'manager', 'supervisor', 'employee', 'super-admin'));