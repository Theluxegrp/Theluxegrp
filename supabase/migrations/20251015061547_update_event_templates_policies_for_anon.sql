/*
  # Update event_templates RLS policies for anonymous access

  ## Overview
  Updates the RLS policies for event_templates table to allow anonymous access,
  consistent with how the events table works in this application.

  ## Changes
  1. Security Changes
    - Drop existing authenticated-only policies
    - Create new policies allowing anonymous access for all operations
    - Allows admin users to manage templates without authentication

  ## Notes
  - The application doesn't have authentication enabled for admin users
  - Templates need to be accessible for creating and managing events
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view event templates" ON event_templates;
DROP POLICY IF EXISTS "Authenticated users can create event templates" ON event_templates;
DROP POLICY IF EXISTS "Authenticated users can update event templates" ON event_templates;
DROP POLICY IF EXISTS "Authenticated users can delete event templates" ON event_templates;

-- Create new policies for anonymous access
CREATE POLICY "Anyone can view event templates"
  ON event_templates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create event templates"
  ON event_templates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update event templates"
  ON event_templates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete event templates"
  ON event_templates
  FOR DELETE
  TO anon
  USING (true);
