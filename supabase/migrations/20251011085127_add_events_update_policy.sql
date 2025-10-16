/*
  # Add UPDATE policy for events table

  ## Overview
  This migration adds an UPDATE policy for the events table to allow
  the service role to update events from the admin panel.

  ## Changes
  1. Add UPDATE policy for events table that allows service role access

  ## Security Notes
  - Only service role (admin) can update events
  - Public users can only read published events (existing SELECT policy)
*/

-- Add UPDATE policy for events table (service role only)
CREATE POLICY "Service role can update events"
  ON events
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
