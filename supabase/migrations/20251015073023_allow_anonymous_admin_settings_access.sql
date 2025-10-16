/*
  # Allow Anonymous Access to Admin Settings

  ## Overview
  This migration updates the Row Level Security policies for the admin_settings table
  to allow anonymous (unauthenticated) access. This is suitable for single-admin use cases
  where the admin doesn't want to manage authentication.

  ## 1. Security Changes

  ### `admin_settings` table
  - Drop existing authenticated-only policies
  - Add new policies that allow anonymous users to:
    - SELECT (view settings)
    - UPDATE (modify settings)
    - INSERT (create settings)

  ## 2. Important Security Notes
  - This opens up admin_settings to anyone with the Supabase anon key
  - Only use this configuration if you trust your environment
  - Consider implementing additional application-level security if needed
  - The Twilio credentials will be accessible to anyone with access to the site
*/

-- Drop existing policies for admin_settings
DROP POLICY IF EXISTS "Authenticated users can view admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Authenticated users can update admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Authenticated users can insert admin settings" ON admin_settings;

-- Create new policies allowing anonymous access
CREATE POLICY "Anyone can view admin settings"
  ON admin_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update admin settings"
  ON admin_settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert admin settings"
  ON admin_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);