/*
  # Add Recurring Event Support

  1. Changes
    - Add `is_recurring` (boolean) column to events table - indicates if event repeats weekly
    - Add `recurrence_day` (integer) column to events table - day of week (0=Sunday, 6=Saturday) for recurring events
    - Add index on recurrence_day for efficient querying of recurring events

  2. Notes
    - When is_recurring is true, the event_date represents the first occurrence
    - recurrence_day stores which day of the week the event should recur on
    - One-time events will have is_recurring=false and recurrence_day=null
    - Default values ensure backward compatibility with existing events
*/

-- Add recurring event columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE events ADD COLUMN is_recurring boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'recurrence_day'
  ) THEN
    ALTER TABLE events ADD COLUMN recurrence_day integer;
  END IF;
END $$;

-- Add index for efficient querying of recurring events
CREATE INDEX IF NOT EXISTS idx_events_recurring ON events(is_recurring, recurrence_day) WHERE is_recurring = true;

-- Add check constraint to ensure recurrence_day is valid (0-6 for days of week)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_recurrence_day_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_recurrence_day_check 
    CHECK (recurrence_day IS NULL OR (recurrence_day >= 0 AND recurrence_day <= 6));
  END IF;
END $$;