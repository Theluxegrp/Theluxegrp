/*
  # Add Display Order to Booking Options

  1. Changes
    - Add `display_order` column to `sections` table (integer, default 0)
    - Add `display_order` column to `bottle_packages` table (integer, default 0)
    - Add `display_order` column to `guest_list_options` table (integer, default 0)
    - Set initial order values based on creation order
  
  2. Notes
    - Lower numbers appear first
    - Allows admin to control the display order of all booking options
    - All options will be shown in a single unified list on the frontend
*/

-- Add display_order to sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sections' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE sections ADD COLUMN display_order integer DEFAULT 0;
    
    -- Set initial order based on creation
    UPDATE sections 
    SET display_order = subquery.row_num - 1
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as row_num
      FROM sections
    ) AS subquery
    WHERE sections.id = subquery.id;
  END IF;
END $$;

-- Add display_order to bottle_packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bottle_packages' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE bottle_packages ADD COLUMN display_order integer DEFAULT 0;
    
    -- Set initial order based on creation
    UPDATE bottle_packages 
    SET display_order = subquery.row_num - 1
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as row_num
      FROM bottle_packages
    ) AS subquery
    WHERE bottle_packages.id = subquery.id;
  END IF;
END $$;

-- Add display_order to guest_list_options
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_list_options' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE guest_list_options ADD COLUMN display_order integer DEFAULT 0;
    
    -- Set initial order based on creation
    UPDATE guest_list_options 
    SET display_order = subquery.row_num - 1
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) as row_num
      FROM guest_list_options
    ) AS subquery
    WHERE guest_list_options.id = subquery.id;
  END IF;
END $$;
