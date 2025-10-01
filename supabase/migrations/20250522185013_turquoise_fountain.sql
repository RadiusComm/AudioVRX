/*
  # Update scenarios table with new fields and sample data

  1. Changes
    - Add estimated_time (text)
    - Add completion_rate (integer)
    - Add tags (text[])
    - Add cover_image_url (text)
    - Add difficulty with constraint
    
  2. Data
    - Add sample scenarios with realistic data
    - Include high-quality cover images
    - Set appropriate difficulty levels
*/

-- Add new columns to scenarios table
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS estimated_time text,
ADD COLUMN IF NOT EXISTS completion_rate integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'beginner';

-- Add difficulty constraint
DO $$ BEGIN
  ALTER TABLE scenarios
    ADD CONSTRAINT valid_difficulty CHECK (
      difficulty IN (
        'beginner',
        'intermediate',
        'advanced',
        'expert'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add sample scenarios
INSERT INTO scenarios (
  title,
  description,
  difficulty,
  estimated_time,
  completion_rate,
  tags,
  cover_image_url,
  is_public
) VALUES 
(
  'Handling Customer Objections',
  'Practice responding to common customer objections in a sales conversation.',
  'intermediate',
  '10-15 min',
  85,
  ARRAY['Objection Handling', 'Sales Techniques', 'Communication'],
  'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
),
(
  'Technical Support Troubleshooting',
  'Help a customer diagnose and resolve technical issues with your product.',
  'advanced',
  '15-20 min',
  72,
  ARRAY['Technical Support', 'Problem Solving', 'Customer Service'],
  'https://images.pexels.com/photos/7947757/pexels-photo-7947757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
),
(
  'Negotiation Fundamentals',
  'Practice basic negotiation techniques with a potential client.',
  'beginner',
  '8-10 min',
  92,
  ARRAY['Negotiation', 'Persuasion', 'Value Proposition'],
  'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
),
(
  'Handling Angry Customers',
  'Deescalate situations with upset customers and turn them into advocates.',
  'intermediate',
  '12-15 min',
  78,
  ARRAY['Conflict Resolution', 'Empathy', 'Customer Retention'],
  'https://images.pexels.com/photos/7709087/pexels-photo-7709087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
),
(
  'Enterprise Solution Pitch',
  'Present a comprehensive solution to a C-level executive audience.',
  'expert',
  '20-25 min',
  65,
  ARRAY['Executive Presentation', 'Solution Selling', 'Strategic Communication'],
  'https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
),
(
  'Onboarding New Customers',
  'Guide new customers through the initial setup and configuration process.',
  'beginner',
  '10-12 min',
  88,
  ARRAY['Onboarding', 'Product Training', 'User Experience'],
  'https://images.pexels.com/photos/1181622/pexels-photo-1181622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  true
)
ON CONFLICT (id) DO NOTHING;