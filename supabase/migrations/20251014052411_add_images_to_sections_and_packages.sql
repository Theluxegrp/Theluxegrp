/*
  # Add image support to sections and bottle packages

  1. Changes
    - Add `image_url` column to `sections` table for table grid images
    - Add `image_url` column to `bottle_packages` table for bottle service menu images
    - Both columns are optional text fields that will store image URLs from storage

  2. Notes
    - Images will be stored in the existing event-images bucket
    - Images can be enlarged on click for better viewing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sections' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE sections ADD COLUMN image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bottle_packages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE bottle_packages ADD COLUMN image_url text;
  END IF;
END $$;