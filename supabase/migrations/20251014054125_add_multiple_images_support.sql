/*
  # Add Multiple Images Support to Sections and Bottle Packages

  1. Changes
    - Change `sections.image_url` from text to text[] (array of URLs)
    - Change `bottle_packages.image_url` from text to text[] (array of URLs)
    - Migrate existing single image URLs to arrays
    - Rename columns to `image_urls` for clarity
  
  2. Notes
    - Existing single images will be converted to single-item arrays
    - NULL values remain NULL
    - Allows multiple images per section/package for galleries
*/

-- Migrate sections table
DO $$
BEGIN
  -- Add new column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sections' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE sections ADD COLUMN image_urls text[];
    
    -- Migrate existing data
    UPDATE sections 
    SET image_urls = ARRAY[image_url]::text[]
    WHERE image_url IS NOT NULL;
    
    -- Drop old column
    ALTER TABLE sections DROP COLUMN IF EXISTS image_url;
  END IF;
END $$;

-- Migrate bottle_packages table
DO $$
BEGIN
  -- Add new column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bottle_packages' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE bottle_packages ADD COLUMN image_urls text[];
    
    -- Migrate existing data
    UPDATE bottle_packages 
    SET image_urls = ARRAY[image_url]::text[]
    WHERE image_url IS NOT NULL;
    
    -- Drop old column
    ALTER TABLE bottle_packages DROP COLUMN IF EXISTS image_url;
  END IF;
END $$;
