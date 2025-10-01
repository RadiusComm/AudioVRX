/*
  # Add status and owner fields to stores table

  1. New Fields
    - `status` (text) - Store status (active, inactive, pending)
    - `owner_id` (uuid) - Reference to profiles table for store owner
    - `image_url` (text) - URL for store image

  2. Changes
    - Add status field with check constraint
    - Add owner_id field with foreign key reference
    - Add image_url field for store images
*/

-- Add new columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS image_url text;