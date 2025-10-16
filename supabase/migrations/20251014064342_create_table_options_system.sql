/*
  # Create Table Options System with Templates

  ## Overview
  This migration creates a flexible table options system to replace the rigid sections table.
  Admins can define custom table types (e.g., "Small Table", "Large Booth", "VIP Section")
  and save them as templates for reuse across events.

  ## 1. New Tables

  ### `table_options`
    - `id` (uuid, primary key) - Unique table option identifier
    - `event_id` (uuid, foreign key) - Associated event
    - `name` (text) - Table name (e.g., "Premium Booth", "Dance Floor Table")
    - `description` (text) - Description of the table option
    - `display_order` (integer) - Order in which to display options
    - `is_available` (boolean) - Whether this option is currently available
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### `table_options_templates`
    - `id` (uuid, primary key) - Unique template identifier
    - `name` (text) - Template name for identification
    - `options` (jsonb) - Array of table options with name and description
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
    - Public users can SELECT table options for viewing
    - Authenticated users (admins) can manage all table options
    - Templates are managed by authenticated users only

  ## 3. Important Notes
    - This system replaces the old sections table structure
    - Options are more flexible and don't require capacity/spend minimums
    - Templates allow quick setup of common table configurations
    - Display order controls how options appear in the booking form
    - The old sections table remains for backward compatibility
*/

-- Create table options table
CREATE TABLE IF NOT EXISTS table_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table options templates table
CREATE TABLE IF NOT EXISTS table_options_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on table_options
ALTER TABLE table_options ENABLE ROW LEVEL SECURITY;

-- Create policies for table_options
CREATE POLICY "Anyone can view table options"
  ON table_options
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert table options"
  ON table_options
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update table options"
  ON table_options
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete table options"
  ON table_options
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on table_options_templates
ALTER TABLE table_options_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Anyone can view table templates"
  ON table_options_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON table_options_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON table_options_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete templates"
  ON table_options_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_table_options_updated_at
  BEFORE UPDATE ON table_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_options_templates_updated_at
  BEFORE UPDATE ON table_options_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add table_option_id to reservations for the new system
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'table_option_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN table_option_id uuid REFERENCES table_options(id) ON DELETE SET NULL;
  END IF;
END $$;