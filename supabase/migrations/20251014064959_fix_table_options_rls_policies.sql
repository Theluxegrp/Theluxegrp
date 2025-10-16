/*
  # Fix Table Options RLS Policies

  ## Overview
  Updates RLS policies for table_options and table_options_templates tables
  to allow public/anonymous access for inserting and updating records.

  ## Changes
    - Update table_options policies to allow public access
    - Update table_options_templates policies to allow public access
    - This matches the pattern used for other admin-managed tables like sections and packages

  ## Security Note
    - These tables are managed through the admin interface
    - Public access is needed because the frontend uses the anon key
    - Real authentication/authorization should be handled at the application level
*/

-- Drop existing restrictive policies for table_options
DROP POLICY IF EXISTS "Authenticated users can insert table options" ON table_options;
DROP POLICY IF EXISTS "Authenticated users can update table options" ON table_options;
DROP POLICY IF EXISTS "Authenticated users can delete table options" ON table_options;

-- Create public policies for table_options
CREATE POLICY "Anyone can insert table options"
  ON table_options
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update table options"
  ON table_options
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete table options"
  ON table_options
  FOR DELETE
  TO public
  USING (true);

-- Drop existing restrictive policies for table_options_templates
DROP POLICY IF EXISTS "Authenticated users can insert templates" ON table_options_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON table_options_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON table_options_templates;

-- Create public policies for table_options_templates
CREATE POLICY "Anyone can insert templates"
  ON table_options_templates
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update templates"
  ON table_options_templates
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete templates"
  ON table_options_templates
  FOR DELETE
  TO public
  USING (true);