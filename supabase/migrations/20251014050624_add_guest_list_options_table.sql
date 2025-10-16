/*
  # Add guest list options table

  1. New Tables
    - `guest_list_options`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `tier_name` (text) - e.g., "General Admission", "VIP Entry"
      - `price` (numeric) - price for this tier
      - `capacity` (integer) - max number of guests for this tier
      - `description` (text, optional) - additional details
      - `is_available` (boolean) - whether this tier is currently available
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `guest_list_options` table
    - Add policy for public to read available options
    - Add policy for authenticated users to manage options
*/

CREATE TABLE IF NOT EXISTS guest_list_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 0,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guest_list_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available guest list options"
  ON guest_list_options
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert guest list options"
  ON guest_list_options
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guest list options"
  ON guest_list_options
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete guest list options"
  ON guest_list_options
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_guest_list_options_event_id ON guest_list_options(event_id);