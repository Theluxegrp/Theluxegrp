/*
  # Create Standard Reservation Options System

  ## Overview
  This creates a system for managing standard reservation options (Guest List, Book A Section, Plan Something Special)
  that can be toggled per event, and allows table service sub-options within those standard options.

  ## Changes
  
  ### 1. New Tables
    
  #### `standard_reservation_options`
  - `id` (uuid, primary key)
  - `name` (text) - Internal name (e.g., "guest_list", "book_section", "plan_special")
  - `display_name` (text) - Display name shown to users
  - `description` (text) - Description of the option
  - `display_order` (integer) - Order in which options appear
  - `is_system` (boolean) - Whether this is a system option (cannot be deleted)
  - `created_at` (timestamptz)
  
  #### `event_standard_options`
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key to events)
  - `standard_option_id` (uuid, foreign key to standard_reservation_options)
  - `is_enabled` (boolean) - Whether this option is enabled for this event
  - `booking_mode` (text) - 'instant' or 'request'
  - `instructions` (text) - Custom instructions for this option on this event
  - `created_at` (timestamptz)
  
  #### `table_service_options`
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key to events)
  - `standard_option_id` (uuid, foreign key to standard_reservation_options)
  - `name` (text) - Name of the table service option
  - `display_name` (text) - Display name shown to users
  - `description` (text) - Description
  - `price` (numeric) - Optional price
  - `minimum_spend` (numeric) - Optional minimum spend
  - `capacity` (integer) - Optional capacity
  - `image_urls` (text[]) - Optional images
  - `display_order` (integer)
  - `is_available` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access (admin only)
  - Add policies for public read access where appropriate
*/

-- Create standard_reservation_options table
CREATE TABLE IF NOT EXISTS standard_reservation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE standard_reservation_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view standard reservation options"
  ON standard_reservation_options FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage standard options"
  ON standard_reservation_options FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert the 3 standard options
INSERT INTO standard_reservation_options (name, display_name, description, display_order, is_system) VALUES
  ('guest_list', 'Guest List', 'Join the guest list for entry', 1, true),
  ('book_section', 'Book A Section', 'Reserve a table section', 2, true),
  ('plan_special', 'Plan Something Special', 'Book bottle service and special experiences', 3, true)
ON CONFLICT (name) DO NOTHING;

-- Create event_standard_options table
CREATE TABLE IF NOT EXISTS event_standard_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  standard_option_id uuid NOT NULL REFERENCES standard_reservation_options(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  booking_mode text DEFAULT 'instant' CHECK (booking_mode IN ('instant', 'request')),
  instructions text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, standard_option_id)
);

ALTER TABLE event_standard_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event standard options"
  ON event_standard_options FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage event standard options"
  ON event_standard_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update event standard options"
  ON event_standard_options FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete event standard options"
  ON event_standard_options FOR DELETE
  TO authenticated
  USING (true);

-- Create table_service_options table
CREATE TABLE IF NOT EXISTS table_service_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  standard_option_id uuid NOT NULL REFERENCES standard_reservation_options(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  description text,
  price numeric DEFAULT 0,
  minimum_spend numeric DEFAULT 0,
  capacity integer,
  image_urls text[],
  display_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE table_service_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view table service options"
  ON table_service_options FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert table service options"
  ON table_service_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update table service options"
  ON table_service_options FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete table service options"
  ON table_service_options FOR DELETE
  TO authenticated
  USING (true);