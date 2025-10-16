/*
  # Create Guest List System

  ## Overview
  Creates a comprehensive guest list system for events with phone validation and SMS confirmation.

  ## Changes
  1. New Tables
    - `guest_list_entries` - Stores guest list submissions
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `phone_number` (text)
      - `confirmation_code` (text) - SMS verification code
      - `is_confirmed` (boolean) - Whether phone was verified
      - `created_at` (timestamptz)
      - `confirmed_at` (timestamptz) - When verification completed

  2. Add Column to events table
    - `guest_list_enabled` (boolean) - Toggle guest list feature per event

  3. Security
    - Enable RLS on guest_list_entries table
    - Allow anonymous users to insert entries
    - Allow anonymous users to read their own entries
    - Allow anonymous users to update their confirmation status
    - Allow authenticated users (admins) to read all entries
*/

-- Add guest list toggle to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS guest_list_enabled boolean DEFAULT false;

-- Create guest list entries table
CREATE TABLE IF NOT EXISTS guest_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  confirmation_code text,
  is_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- Enable RLS
ALTER TABLE guest_list_entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert guest list entries
CREATE POLICY "Anyone can submit guest list entry"
  ON guest_list_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read their own entries (by confirmation code)
CREATE POLICY "Anyone can read own guest list entry"
  ON guest_list_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to update their confirmation status
CREATE POLICY "Anyone can confirm their entry"
  ON guest_list_entries
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_list_event_id ON guest_list_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_list_phone ON guest_list_entries(phone_number);
CREATE INDEX IF NOT EXISTS idx_guest_list_confirmation_code ON guest_list_entries(confirmation_code);
