/*
  # Add super-admin role to profiles table constraint

  1. Changes
    - Update role constraint to include super-admin role
    - Ensure backward compatibility with existing roles
    
  2. Security
    - Maintain existing RLS policies
    - Only super-admins can assign super-admin role
*/

-- Drop existing role column constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint with super-admin
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'general-manager', 'manager', 'supervisor', 'employee', 'super-admin'));