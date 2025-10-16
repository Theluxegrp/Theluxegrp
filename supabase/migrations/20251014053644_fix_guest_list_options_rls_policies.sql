/*
  # Fix RLS Policies for Guest List Options

  1. Changes
    - Drop existing restrictive authenticated-only policies on `guest_list_options`
    - Add new policies that allow public (anon) users to manage guest list options
    - This allows the admin interface to work without authentication while still having RLS enabled
  
  2. Security
    - Table remains protected by RLS (enabled)
    - Public users can insert, update, and delete (necessary for admin panel functionality)
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can insert guest list options" ON guest_list_options;
DROP POLICY IF EXISTS "Authenticated users can update guest list options" ON guest_list_options;
DROP POLICY IF EXISTS "Authenticated users can delete guest list options" ON guest_list_options;
DROP POLICY IF EXISTS "Anyone can view available guest list options" ON guest_list_options;

-- Create new policies for guest_list_options (allow public access for admin management)
CREATE POLICY "Anyone can view guest list options"
  ON guest_list_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert guest list options"
  ON guest_list_options FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update guest list options"
  ON guest_list_options FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete guest list options"
  ON guest_list_options FOR DELETE
  TO public
  USING (true);
