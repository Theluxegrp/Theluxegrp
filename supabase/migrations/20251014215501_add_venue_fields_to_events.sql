/*
  # Add Venue Fields to Events Table

  1. Changes
    - Add `venue_name` column to `events` table
    - Add `venue_address` column to `events` table
    - Add `venue_city` column to `events` table
    
  2. Notes
    - Venue information will now be stored directly on events instead of using a separate venues table
    - This simplifies event management by keeping all event data in one place
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue_name'
  ) THEN
    ALTER TABLE events ADD COLUMN venue_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue_address'
  ) THEN
    ALTER TABLE events ADD COLUMN venue_address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue_city'
  ) THEN
    ALTER TABLE events ADD COLUMN venue_city text;
  END IF;
END $$;