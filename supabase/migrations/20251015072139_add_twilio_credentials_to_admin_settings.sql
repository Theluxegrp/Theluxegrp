/*
  # Add Twilio Credentials to Admin Settings

  ## Overview
  This migration adds Twilio API credentials to the admin_settings table so that
  administrators can configure SMS functionality directly through the admin UI
  without needing access to the Supabase dashboard.

  ## 1. Changes to Tables

  ### `admin_settings` (modifications)
  Adding three new columns:
  - `twilio_account_sid` (text, nullable) - Twilio Account SID for API authentication
  - `twilio_auth_token` (text, nullable) - Twilio Auth Token for API authentication
  - `twilio_from_phone` (text, nullable) - Twilio phone number to send SMS from (E.164 format)

  ## 2. Security
  - RLS policies already exist for admin_settings table
  - Only authenticated admin users can view/update these credentials
  - Credentials are stored in the database and retrieved by Edge Functions

  ## 3. Important Notes
  - Phone number should be in E.164 format (e.g., +12125551234)
  - Account SID typically starts with "AC"
  - Auth Token is sensitive and should be kept secure
  - These credentials will be read by the Edge Functions at runtime
*/

-- Add Twilio credential columns to admin_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'twilio_account_sid'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN twilio_account_sid text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'twilio_auth_token'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN twilio_auth_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'twilio_from_phone'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN twilio_from_phone text;
  END IF;
END $$;