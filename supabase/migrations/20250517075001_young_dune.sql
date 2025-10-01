/*
  # Assign personas to roleplay scenarios

  1. Changes
    - Add default personas for each scenario type
    - Map personas based on their roles
    - Ensure each scenario type has a designated persona

  2. Details
    - Create personas for different roles
    - Link personas to specific scenario types
    - Set up initial conversation data
*/

-- Create initial personas if they don't exist
DO $$ 
BEGIN
  -- Sales Persona for Discovery Calls
  IF NOT EXISTS (
    SELECT 1 FROM personas 
    WHERE role = 'Sales Manager' 
    AND name = 'Sarah Mitchell'
  ) THEN
    INSERT INTO personas (
      name,
      role,
      company,
      background,
      personality,
      voice_type,
      is_public
    ) VALUES (
      'Sarah Mitchell',
      'Sales Manager',
      'TechPro Solutions',
      'Experienced sales professional with 8+ years in enterprise software sales. Expert in consultative selling and building long-term client relationships.',
      ARRAY['professional', 'friendly', 'analytical'],
      'female_professional',
      true
    );
  END IF;

  -- Business Development Persona for Cold Calling
  IF NOT EXISTS (
    SELECT 1 FROM personas 
    WHERE role = 'Business Development Representative' 
    AND name = 'Michael Chen'
  ) THEN
    INSERT INTO personas (
      name,
      role,
      company,
      background,
      personality,
      voice_type,
      is_public
    ) VALUES (
      'Michael Chen',
      'Business Development Representative',
      'Growth Dynamics',
      'Dynamic BDR with proven track record in outbound prospecting and lead generation. Skilled at creating opportunities through cold outreach.',
      ARRAY['professional', 'persistent', 'empathetic'],
      'male_professional',
      true
    );
  END IF;

  -- Account Manager for Objection Handling
  IF NOT EXISTS (
    SELECT 1 FROM personas 
    WHERE role = 'Account Executive' 
    AND name = 'Emily Rodriguez'
  ) THEN
    INSERT INTO personas (
      name,
      role,
      company,
      background,
      personality,
      voice_type,
      is_public
    ) VALUES (
      'Emily Rodriguez',
      'Account Executive',
      'Enterprise Solutions Inc',
      'Senior account executive specializing in enterprise client management and complex negotiations. Expert at handling objections and building consensus.',
      ARRAY['professional', 'detail_oriented', 'patient'],
      'female_professional',
      true
    );
  END IF;
END $$;

-- Create default roleplay scenarios with assigned personas
DO $$
DECLARE
  sales_persona_id uuid;
  bdr_persona_id uuid;
  account_persona_id uuid;
BEGIN
  -- Get persona IDs
  SELECT id INTO sales_persona_id FROM personas WHERE role = 'Sales Manager' AND name = 'Sarah Mitchell' LIMIT 1;
  SELECT id INTO bdr_persona_id FROM personas WHERE role = 'Business Development Representative' AND name = 'Michael Chen' LIMIT 1;
  SELECT id INTO account_persona_id FROM personas WHERE role = 'Account Executive' AND name = 'Emily Rodriguez' LIMIT 1;

  -- Create discovery call scenario
  IF NOT EXISTS (
    SELECT 1 FROM roleplay_scenarios 
    WHERE type = 'discovery_call' 
    AND title = 'Enterprise Discovery Call'
  ) THEN
    INSERT INTO roleplay_scenarios (
      title,
      description,
      type,
      difficulty,
      objectives,
      success_criteria,
      intents,
      branches,
      persona_id,
      is_public
    ) VALUES (
      'Enterprise Discovery Call',
      'Practice conducting an effective discovery call with a potential enterprise client',
      'discovery_call',
      'intermediate',
      ARRAY['Identify key pain points', 'Understand business objectives', 'Qualify opportunity'],
      ARRAY['Asked relevant qualifying questions', 'Uncovered business challenges', 'Set clear next steps'],
      '[{"name": "greeting", "examples": ["Hello", "Hi there"], "responses": ["Hi, thanks for taking the time to meet today"]}]'::jsonb,
      '[{"trigger": "greeting", "response": "Thanks for connecting. I''d love to learn more about your business needs."}]'::jsonb,
      sales_persona_id,
      true
    );
  END IF;

  -- Create cold calling scenario
  IF NOT EXISTS (
    SELECT 1 FROM roleplay_scenarios 
    WHERE type = 'cold_call' 
    AND title = 'B2B Cold Call'
  ) THEN
    INSERT INTO roleplay_scenarios (
      title,
      description,
      type,
      difficulty,
      objectives,
      success_criteria,
      intents,
      branches,
      persona_id,
      is_public
    ) VALUES (
      'B2B Cold Call',
      'Practice effective cold calling techniques and opening conversations',
      'cold_call',
      'intermediate',
      ARRAY['Create interest', 'Handle initial objections', 'Schedule follow-up'],
      ARRAY['Clear value proposition', 'Professional introduction', 'Secured next steps'],
      '[{"name": "introduction", "examples": ["Hello", "Good morning"], "responses": ["Hi, I hope I caught you at a good time"]}]'::jsonb,
      '[{"trigger": "introduction", "response": "I''m reaching out because we''ve helped similar companies in your industry."}]'::jsonb,
      bdr_persona_id,
      true
    );
  END IF;

  -- Create objection handling scenario
  IF NOT EXISTS (
    SELECT 1 FROM roleplay_scenarios 
    WHERE type = 'objection_handling' 
    AND title = 'Price Negotiation'
  ) THEN
    INSERT INTO roleplay_scenarios (
      title,
      description,
      type,
      difficulty,
      objectives,
      success_criteria,
      intents,
      branches,
      persona_id,
      is_public
    ) VALUES (
      'Price Negotiation',
      'Handle common pricing objections and negotiate effectively',
      'objection_handling',
      'advanced',
      ARRAY['Address price concerns', 'Demonstrate value', 'Maintain relationship'],
      ARRAY['Validated concerns', 'Presented value proposition', 'Found common ground'],
      '[{"name": "price_objection", "examples": ["Too expensive", "Over budget"], "responses": ["I understand price is a concern"]}]'::jsonb,
      '[{"trigger": "price_objection", "response": "Let''s discuss the value and ROI our solution provides."}]'::jsonb,
      account_persona_id,
      true
    );
  END IF;
END $$;