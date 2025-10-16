/*
  # Add Admin Features and Event Templates

  ## Overview
  This migration adds authentication support, event templates for reusability,
  and display ordering for events in the reservation system.

  ## 1. New Tables

  ### `event_templates`
  - `id` (uuid, primary key) - Unique template identifier
  - `name` (text) - Template name for easy identification
  - `template_data` (jsonb) - Complete event configuration stored as JSON
  - `created_by` (uuid, foreign key) - User who created the template
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Schema Changes

  ### `events` table additions
  - `display_order` (integer) - Controls the order events appear on the site
  - `is_published` (boolean) - Controls whether event is visible to public

  ## 3. Security Updates

  ### RLS Policies:
  - Public users can only SELECT published events
  - Authenticated users can manage all events and templates
  - Event templates are only accessible to authenticated users

  ## 4. Important Notes

  - Event templates store complete event configuration as JSON for reusability
  - Display order allows manual control of event sequence on frontend
  - Published flag enables draft mode for events
  - Templates include sections and bottle packages configuration
*/

-- Add new columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE events ADD COLUMN display_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE events ADD COLUMN is_published boolean DEFAULT true;
  END IF;
END $$;

-- Create event templates table
CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on event templates
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Update events policies to check published status for public
DROP POLICY IF EXISTS "Public can view events" ON events;

CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  TO public
  USING (is_published = true);

-- Event templates policies
CREATE POLICY "Authenticated users can view event templates"
  ON event_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create event templates"
  ON event_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update event templates"
  ON event_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete event templates"
  ON event_templates FOR DELETE
  TO authenticated
  USING (true);

-- Create index for display order
CREATE INDEX IF NOT EXISTS events_display_order_idx ON events(display_order);

-- Update existing events with sequential display order
DO $$
DECLARE
  event_record RECORD;
  counter INTEGER := 0;
BEGIN
  FOR event_record IN 
    SELECT id FROM events ORDER BY event_date ASC
  LOOP
    UPDATE events SET display_order = counter WHERE id = event_record.id;
    counter := counter + 1;
  END LOOP;
END $$;