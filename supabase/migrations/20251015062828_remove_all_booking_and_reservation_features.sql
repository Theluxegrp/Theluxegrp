/*
  # Remove all booking and reservation features

  ## Overview
  Removes all guest list, sections, packages, table options, and reservation-related tables and columns.
  Simplifies events to basic event information only.

  ## Changes
  1. Drop Tables
    - guest_list_options
    - sections
    - bottle_packages
    - reservations
    - table_options
    - table_service_options
    - event_standard_options
    - standard_reservation_options
    - table_options_templates
    - booking_instructions_templates
    - instruction_templates
    - notification_log

  2. Remove Columns from events table
    - guest_list_available
    - sections_available
    - special_events_available
    - sections_booking_mode
    - special_events_booking_mode
    - section_booking_instructions
    - sections_instructions
    - special_events_instructions
*/

-- Drop all booking/reservation tables (order matters due to foreign keys)
DROP TABLE IF EXISTS notification_log CASCADE;
DROP TABLE IF EXISTS table_service_options CASCADE;
DROP TABLE IF EXISTS event_standard_options CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS guest_list_options CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS bottle_packages CASCADE;
DROP TABLE IF EXISTS table_options CASCADE;
DROP TABLE IF EXISTS standard_reservation_options CASCADE;
DROP TABLE IF EXISTS table_options_templates CASCADE;
DROP TABLE IF EXISTS booking_instructions_templates CASCADE;
DROP TABLE IF EXISTS instruction_templates CASCADE;

-- Remove booking-related columns from events table
ALTER TABLE events DROP COLUMN IF EXISTS guest_list_available;
ALTER TABLE events DROP COLUMN IF EXISTS sections_available;
ALTER TABLE events DROP COLUMN IF EXISTS special_events_available;
ALTER TABLE events DROP COLUMN IF EXISTS sections_booking_mode;
ALTER TABLE events DROP COLUMN IF EXISTS special_events_booking_mode;
ALTER TABLE events DROP COLUMN IF EXISTS section_booking_instructions;
ALTER TABLE events DROP COLUMN IF EXISTS sections_instructions;
ALTER TABLE events DROP COLUMN IF EXISTS special_events_instructions;
