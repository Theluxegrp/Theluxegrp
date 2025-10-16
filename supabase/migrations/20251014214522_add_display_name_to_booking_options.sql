/*
  # Add Display Name Fields to Booking Options

  1. Changes
    - Add `display_name` column to `guest_list_options` table
    - Add `display_name` column to `sections` table  
    - Add `display_name` column to `bottle_packages` table
    
  2. Notes
    - Display name allows custom titles for reservation options shown to users
    - If display_name is null, the system will fall back to using the `name` field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_list_options' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE guest_list_options ADD COLUMN display_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sections' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE sections ADD COLUMN display_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bottle_packages' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE bottle_packages ADD COLUMN display_name text;
  END IF;
END $$;