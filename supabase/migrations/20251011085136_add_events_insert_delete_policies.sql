/*
  # Add INSERT and DELETE policies for events table

  ## Overview
  This migration adds INSERT and DELETE policies for the events table to allow
  the service role to create and delete events from the admin panel.

  ## Changes
  1. Add INSERT policy for events table that allows service role access
  2. Add DELETE policy for events table that allows service role access

  ## Security Notes
  - Only service role (admin) can insert and delete events
  - Public users can only read published events (existing SELECT policy)
*/

-- Add INSERT policy for events table (service role only)
CREATE POLICY "Service role can insert events"
  ON events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add DELETE policy for events table (service role only)
CREATE POLICY "Service role can delete events"
  ON events
  FOR DELETE
  TO service_role
  USING (true);
