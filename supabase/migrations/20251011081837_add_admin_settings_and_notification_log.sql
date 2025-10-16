/*
  # Add Admin Settings and Notification Tracking

  ## Overview
  This migration adds a settings table to store admin preferences like phone numbers for SMS notifications,
  and a notification log table to track all sent notifications.

  ## 1. New Tables

  ### `admin_settings`
  - `id` (uuid, primary key) - Unique identifier
  - `notification_phone` (text) - Phone number to receive SMS notifications
  - `notification_enabled` (boolean) - Whether notifications are enabled
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `notification_log`
  - `id` (uuid, primary key) - Unique identifier
  - `reservation_id` (uuid, foreign key) - Related reservation
  - `notification_type` (text) - Type of notification (sms, email, etc.)
  - `recipient` (text) - Who received the notification
  - `status` (text) - Delivery status (sent, failed, pending)
  - `message` (text) - Notification content
  - `error_message` (text, nullable) - Error details if failed
  - `sent_at` (timestamptz) - When notification was sent
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security
  - Enable RLS on both tables
  - Only authenticated users can access these tables
  - Admin settings limited to one row for simplicity

  ## 3. Important Notes
  - Admin settings will store the phone number for SMS notifications
  - Notification log tracks all notification attempts for audit purposes
  - Phone numbers should be in E.164 format (+1XXXXXXXXXX)
*/

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_phone text,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification log table
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text NOT NULL,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Admin settings policies
CREATE POLICY "Authenticated users can view admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update admin settings"
  ON admin_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert admin settings"
  ON admin_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification log policies
CREATE POLICY "Authenticated users can view notification log"
  ON notification_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification log"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default admin settings if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1) THEN
    INSERT INTO admin_settings (notification_enabled) VALUES (true);
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notification_log_reservation_id_idx ON notification_log(reservation_id);
CREATE INDEX IF NOT EXISTS notification_log_created_at_idx ON notification_log(created_at DESC);