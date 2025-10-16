/*
  # Enable Realtime for Events Table

  ## Overview
  This migration enables realtime replication for the events table so that
  changes made in the admin panel are immediately reflected on the home page.

  ## Changes
  1. Enable replication for the events table
  2. This allows Supabase realtime subscriptions to receive updates

  ## Security Notes
  - Realtime follows the same RLS policies as regular queries
  - Only published events are visible to public users
*/

-- Enable realtime replication for events table
ALTER PUBLICATION supabase_realtime ADD TABLE events;