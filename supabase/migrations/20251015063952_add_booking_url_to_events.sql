/*
  # Add booking URL to events

  ## Overview
  Adds optional booking URL fields to events table to support external booking links.

  ## Changes
  1. Add Columns to events table
    - `booking_url_enabled` (boolean) - Toggle to enable/disable booking URL
    - `booking_url` (text) - The external URL for booking
*/

-- Add booking URL fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS booking_url_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_url text;
