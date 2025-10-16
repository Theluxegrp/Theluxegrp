/*
  # Create Storage Bucket for Event Images

  ## Overview
  This migration creates a storage bucket to store event images uploaded by admins.

  ## 1. Storage Bucket
  - Creates `event-images` bucket for storing event photos
  - Public access enabled for reading images
  - Upload restricted to authenticated users

  ## 2. Security
  - RLS policies for secure upload and public read access
  - Authenticated users can upload images
  - Anyone can view images (public bucket)

  ## 3. Important Notes
  - Maximum file size: 5MB (configurable)
  - Allowed file types: image/jpeg, image/png, image/webp
  - Images are publicly accessible via URL
*/

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Policy to allow authenticated users to update their images
CREATE POLICY "Authenticated users can update event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images')
WITH CHECK (bucket_id = 'event-images');

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');

-- Policy to allow public read access
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');