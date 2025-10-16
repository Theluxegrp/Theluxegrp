/*
  # Add Booking Mode and Approval System

  ## Overview
  This migration adds the ability to toggle between instant booking and request-based booking
  for VIP tables and special events, along with approval/denial functionality.

  ## 1. Changes to Events Table
    - `sections_booking_mode` (text) - Mode for VIP tables: 'instant' or 'request' (default: 'instant')
    - `special_events_booking_mode` (text) - Mode for special events: 'instant' or 'request' (default: 'instant')

  ## 2. Changes to Reservations Table
    - `approved_at` (timestamptz) - Timestamp when reservation was approved
    - `denied_at` (timestamptz) - Timestamp when reservation was denied
    - `admin_notes` (text) - Internal notes for admin/staff use

  ## 3. Updated Status Values
    The `status` field now supports:
    - 'pending' - Waiting for review (request mode) or initial state
    - 'approved' - Request has been approved
    - 'denied' - Request has been denied
    - 'confirmed' - Booking is confirmed (instant mode or after approval)
    - 'cancelled' - Booking was cancelled

  ## 4. Security
    - All existing RLS policies remain in place
    - Public users can still INSERT reservations
    - Authenticated users can UPDATE reservations for approval workflow

  ## 5. Important Notes
    - Default booking mode is 'instant' for backward compatibility
    - Admin can toggle between instant and request modes per event
    - Request mode requires admin approval before confirmation
*/

-- Add booking mode fields to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'sections_booking_mode'
  ) THEN
    ALTER TABLE events ADD COLUMN sections_booking_mode text DEFAULT 'instant' CHECK (sections_booking_mode IN ('instant', 'request'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'special_events_booking_mode'
  ) THEN
    ALTER TABLE events ADD COLUMN special_events_booking_mode text DEFAULT 'instant' CHECK (special_events_booking_mode IN ('instant', 'request'));
  END IF;
END $$;

-- Add approval fields to reservations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'denied_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN denied_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE reservations ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Update status check constraint to include new statuses
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'reservations' AND constraint_name = 'reservations_status_check'
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
    CHECK (status IN ('pending', 'approved', 'denied', 'confirmed', 'cancelled'));
END $$;