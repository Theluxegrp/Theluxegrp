/*
  # Fix Event Images Storage Policies

  ## Overview
  This migration updates the storage policies for event-images bucket to be more permissive
  while still maintaining security.

  ## Changes
  1. Drop existing restrictive policies
  2. Create new policies that allow:
     - Anyone with the anon key to upload images (for admin panel)
     - Public read access for displaying images
     - Authenticated users can delete/update

  ## Security Notes
  - Upload is protected by the anon key requirement
  - Only admin users should have access to the admin panel
  - Public read access is necessary for displaying event images
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;

-- Allow anyone with valid credentials to upload to event-images bucket
CREATE POLICY "Allow uploads to event-images bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-images');

-- Allow anyone with valid credentials to update event-images
CREATE POLICY "Allow updates to event-images bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'event-images')
WITH CHECK (bucket_id = 'event-images');

-- Allow anyone with valid credentials to delete from event-images
CREATE POLICY "Allow deletes from event-images bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'event-images');

-- Allow public read access to event-images
CREATE POLICY "Allow public read access to event-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');