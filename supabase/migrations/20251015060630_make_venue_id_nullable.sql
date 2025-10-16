/*
  # Make venue_id nullable in events table

  ## Overview
  This migration makes the venue_id field nullable in the events table since events
  can store venue information directly using venue_name, venue_address, and venue_city fields.

  ## Changes
  1. Tables Modified
    - `events`
      - `venue_id` (uuid) - Changed from NOT NULL to NULL
      - This allows events to be created without linking to the venues table
      - Events can use direct venue fields instead

  ## Rationale
  The events table has both:
  - `venue_id` - Foreign key to venues table (optional)
  - `venue_name`, `venue_address`, `venue_city` - Direct venue fields
  
  This gives flexibility to either:
  - Link to a predefined venue from the venues table
  - OR specify venue details directly in the event
*/

-- Make venue_id nullable
ALTER TABLE events ALTER COLUMN venue_id DROP NOT NULL;
