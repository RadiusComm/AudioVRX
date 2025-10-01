-- Add new columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS image_url text;