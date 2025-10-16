/*
  # Update events policies to allow anon access

  ## Overview
  This migration updates the events table policies to allow anonymous users
  (using the anon key) to perform INSERT, UPDATE, and DELETE operations.
  This is necessary because the admin panel uses the anon key, not service role.

  ## Changes
  1. Drop existing service role policies
  2. Add new policies that allow anon access for admin operations

  ## Security Notes
  - In a production environment, this should be combined with proper authentication
  - For now, anyone with the anon key can modify events (admin-only app assumption)
  - Public users can still only read published events (existing SELECT policy)
*/

-- Drop existing service role policies
DROP POLICY IF EXISTS "Service role can update events" ON events;
DROP POLICY IF EXISTS "Service role can insert events" ON events;
DROP POLICY IF EXISTS "Service role can delete events" ON events;

-- Add policies that allow anon access (for admin operations)
CREATE POLICY "Allow insert for anon"
  ON events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update for anon"
  ON events
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for anon"
  ON events
  FOR DELETE
  TO anon
  USING (true);
