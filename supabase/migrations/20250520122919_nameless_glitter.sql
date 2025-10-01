/*
  # Create knowledge base documents table

  1. New Table
    - `knowledge_base_documents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `file_url` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user management and admin access
*/

CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all documents"
  ON knowledge_base_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own documents"
  ON knowledge_base_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all documents"
  ON knowledge_base_documents
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create trigger for updated_at
CREATE TRIGGER handle_knowledge_base_documents_updated_at
  BEFORE UPDATE ON knowledge_base_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();