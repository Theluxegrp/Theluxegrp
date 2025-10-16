/*
  # Add Booking Instructions and Template System

  ## Overview
  This migration adds customizable instructions for booking sections and special events,
  along with a template system to save and reuse instruction text.

  ## 1. Changes to Events Table
    - `sections_instructions` (text) - Custom instructions for "How to Book a Section"
    - `special_events_instructions` (text) - Custom instructions for "How to Book a Special Event"

  ## 2. New Tables

  ### `booking_instructions_templates`
    - `id` (uuid, primary key) - Unique template identifier
    - `name` (text) - Template name for easy identification
    - `type` (text) - Type of template: 'sections' or 'special_events'
    - `content` (text) - The instruction text content
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## 3. Security
    - Public users can SELECT booking instructions from events
    - Authenticated users (admins) can manage templates
    - RLS policies ensure templates are properly secured

  ## 4. Important Notes
    - Instructions are optional and can be left empty
    - Templates provide a library of reusable instruction text
    - Each template is typed for either sections or special events
    - Templates help maintain consistency across events
*/

-- Add instruction fields to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'sections_instructions'
  ) THEN
    ALTER TABLE events ADD COLUMN sections_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'special_events_instructions'
  ) THEN
    ALTER TABLE events ADD COLUMN special_events_instructions text;
  END IF;
END $$;

-- Create booking instructions templates table
CREATE TABLE IF NOT EXISTS booking_instructions_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sections', 'special_events')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on templates table
ALTER TABLE booking_instructions_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Anyone can view templates"
  ON booking_instructions_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON booking_instructions_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON booking_instructions_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete templates"
  ON booking_instructions_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger for templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_instructions_templates_updated_at
  BEFORE UPDATE ON booking_instructions_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();