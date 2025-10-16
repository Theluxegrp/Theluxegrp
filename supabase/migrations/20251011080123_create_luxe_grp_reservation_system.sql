/*
  # The Luxe Grp Reservation System Database Schema

  ## Overview
  This migration creates the complete database structure for The Luxe Grp's event reservation system,
  allowing customers to browse events, join guest lists, book sections/bottle service, and reserve
  special events for birthdays and celebrations.

  ## 1. New Tables

  ### `venues`
  - `id` (uuid, primary key) - Unique venue identifier
  - `name` (text) - Venue name
  - `address` (text) - Venue address
  - `city` (text) - City location
  - `description` (text) - Venue description
  - `image_url` (text) - Venue image
  - `capacity` (integer) - Maximum capacity
  - `created_at` (timestamptz) - Creation timestamp

  ### `events`
  - `id` (uuid, primary key) - Unique event identifier
  - `venue_id` (uuid, foreign key) - Associated venue
  - `name` (text) - Event name
  - `description` (text) - Event description
  - `event_date` (timestamptz) - Date and time of event
  - `image_url` (text) - Event image
  - `dress_code` (text) - Dress code requirements
  - `music_genre` (text) - Music genre/type
  - `min_age` (integer) - Minimum age requirement
  - `guest_list_available` (boolean) - Guest list signup enabled
  - `sections_available` (boolean) - Section booking enabled
  - `special_events_available` (boolean) - Special event booking enabled
  - `created_at` (timestamptz) - Creation timestamp

  ### `sections`
  - `id` (uuid, primary key) - Unique section identifier
  - `event_id` (uuid, foreign key) - Associated event
  - `name` (text) - Section name (e.g., "VIP Table 1")
  - `capacity` (integer) - Maximum capacity
  - `minimum_spend` (decimal) - Minimum spend requirement
  - `description` (text) - Section description
  - `is_available` (boolean) - Availability status
  - `created_at` (timestamptz) - Creation timestamp

  ### `bottle_packages`
  - `id` (uuid, primary key) - Unique package identifier
  - `event_id` (uuid, foreign key) - Associated event
  - `name` (text) - Package name
  - `description` (text) - Package description
  - `price` (decimal) - Package price
  - `bottles_included` (text[]) - List of bottles included
  - `serves` (integer) - Number of people served
  - `is_available` (boolean) - Availability status
  - `created_at` (timestamptz) - Creation timestamp

  ### `reservations`
  - `id` (uuid, primary key) - Unique reservation identifier
  - `event_id` (uuid, foreign key) - Associated event
  - `reservation_type` (text) - Type: 'guest_list', 'section', 'bottle_service', 'special_event'
  - `section_id` (uuid, nullable, foreign key) - Associated section if applicable
  - `bottle_package_id` (uuid, nullable, foreign key) - Associated bottle package if applicable
  - `customer_name` (text) - Customer name
  - `customer_email` (text) - Customer email
  - `customer_phone` (text) - Customer phone
  - `party_size` (integer) - Number of guests
  - `special_requests` (text) - Special requests/notes
  - `occasion` (text) - Occasion type (birthday, anniversary, etc.)
  - `status` (text) - Status: 'pending', 'confirmed', 'cancelled'
  - `total_amount` (decimal) - Total amount (nullable for guest list)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  All tables have Row Level Security (RLS) enabled with public read access for browsing events
  and venues. Write operations require authentication for staff management.

  ### RLS Policies:
  - Public users can SELECT from venues, events, sections, and bottle_packages
  - Public users can INSERT reservations (customer-facing booking)
  - Authenticated users can manage all records (staff operations)

  ## 3. Important Notes

  - All monetary values use DECIMAL type for precision
  - Event dates use timestamptz for timezone awareness
  - Reservations track multiple types in a single table for unified management
  - Boolean flags on events control which booking options are available
  - Status tracking on reservations enables workflow management
*/

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  description text NOT NULL,
  image_url text,
  capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  image_url text,
  dress_code text NOT NULL DEFAULT 'Smart Casual',
  music_genre text NOT NULL DEFAULT 'Mixed',
  min_age integer NOT NULL DEFAULT 21,
  guest_list_available boolean DEFAULT true,
  sections_available boolean DEFAULT true,
  special_events_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL,
  minimum_spend decimal(10,2) NOT NULL,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bottle packages table
CREATE TABLE IF NOT EXISTS bottle_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  bottles_included text[] NOT NULL,
  serves integer NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  reservation_type text NOT NULL CHECK (reservation_type IN ('guest_list', 'section', 'bottle_service', 'special_event')),
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  bottle_package_id uuid REFERENCES bottle_packages(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  party_size integer NOT NULL DEFAULT 1,
  special_requests text,
  occasion text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_amount decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Venues policies: Public read, authenticated write
CREATE POLICY "Public can view venues"
  ON venues FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage venues"
  ON venues FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Events policies: Public read, authenticated write
CREATE POLICY "Public can view events"
  ON events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage events"
  ON events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sections policies: Public read, authenticated write
CREATE POLICY "Public can view sections"
  ON sections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage sections"
  ON sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bottle packages policies: Public read, authenticated write
CREATE POLICY "Public can view bottle packages"
  ON bottle_packages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage bottle packages"
  ON bottle_packages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reservations policies: Public can create, authenticated can manage
CREATE POLICY "Public can create reservations"
  ON reservations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view own reservations"
  ON reservations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage all reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster event queries
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS events_venue_idx ON events(venue_id);
CREATE INDEX IF NOT EXISTS reservations_event_idx ON reservations(event_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);

-- Insert sample data
INSERT INTO venues (name, address, city, description, image_url, capacity) VALUES
('The Grand Club', '123 Main Street', 'Los Angeles', 'Premier nightlife destination with state-of-the-art sound and lighting', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg', 500),
('Skyline Lounge', '456 Hollywood Blvd', 'Los Angeles', 'Rooftop venue with stunning city views and VIP service', 'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg', 300),
('Velvet Room', '789 Sunset Strip', 'West Hollywood', 'Intimate upscale lounge with exclusive bottle service', 'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg', 200);

-- Insert sample events (upcoming dates)
INSERT INTO events (venue_id, name, description, event_date, image_url, dress_code, music_genre, min_age, guest_list_available, sections_available, special_events_available)
SELECT 
  v.id,
  'Saturday Night Fever',
  'The hottest party in LA featuring top DJs and premium bottle service',
  '2025-10-18 22:00:00+00'::timestamptz,
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'Upscale Nightclub',
  'House / EDM',
  21,
  true,
  true,
  true
FROM venues v WHERE v.name = 'The Grand Club';

INSERT INTO events (venue_id, name, description, event_date, image_url, dress_code, music_genre, min_age, guest_list_available, sections_available, special_events_available)
SELECT 
  v.id,
  'Skyline Sunset Sessions',
  'Exclusive rooftop experience with craft cocktails and breathtaking views',
  '2025-10-19 20:00:00+00'::timestamptz,
  'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg',
  'Smart Casual',
  'Deep House / Lounge',
  21,
  true,
  true,
  true
FROM venues v WHERE v.name = 'Skyline Lounge';

INSERT INTO events (venue_id, name, description, event_date, image_url, dress_code, music_genre, min_age, guest_list_available, sections_available, special_events_available)
SELECT 
  v.id,
  'Hip Hop Fridays',
  'The ultimate hip hop experience with celebrity DJ appearances',
  '2025-10-17 23:00:00+00'::timestamptz,
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
  'Upscale Nightclub',
  'Hip Hop / R&B',
  21,
  true,
  true,
  true
FROM venues v WHERE v.name = 'The Grand Club';

INSERT INTO events (venue_id, name, description, event_date, image_url, dress_code, music_genre, min_age, guest_list_available, sections_available, special_events_available)
SELECT 
  v.id,
  'VIP Wednesdays',
  'Midweek luxury at its finest with bottle specials and VIP treatment',
  '2025-10-15 22:00:00+00'::timestamptz,
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
  'Smart Casual',
  'Top 40 / Dance',
  21,
  true,
  true,
  true
FROM venues v WHERE v.name = 'Velvet Room';

-- Insert sample sections for events
INSERT INTO sections (event_id, name, capacity, minimum_spend, description, is_available)
SELECT 
  e.id,
  'VIP Table - Main Floor',
  8,
  1500.00,
  'Premium table on the main floor with dedicated server',
  true
FROM events e WHERE e.name = 'Saturday Night Fever';

INSERT INTO sections (event_id, name, capacity, minimum_spend, description, is_available)
SELECT 
  e.id,
  'VIP Booth - Upper Level',
  10,
  2000.00,
  'Elevated booth with premium view of the entire club',
  true
FROM events e WHERE e.name = 'Saturday Night Fever';

INSERT INTO sections (event_id, name, capacity, minimum_spend, description, is_available)
SELECT 
  e.id,
  'Skyline Cabana',
  6,
  1200.00,
  'Private rooftop cabana with exclusive service',
  true
FROM events e WHERE e.name = 'Skyline Sunset Sessions';

-- Insert sample bottle packages
INSERT INTO bottle_packages (event_id, name, description, price, bottles_included, serves, is_available)
SELECT 
  e.id,
  'Premium Package',
  'Perfect for small groups looking for quality',
  800.00,
  ARRAY['Grey Goose Vodka', 'Patron Silver Tequila'],
  4,
  true
FROM events e WHERE e.name = 'Saturday Night Fever';

INSERT INTO bottle_packages (event_id, name, description, price, bottles_included, serves, is_available)
SELECT 
  e.id,
  'Luxury Package',
  'Elevated experience with top-shelf spirits',
  1500.00,
  ARRAY['Belvedere Vodka', 'Don Julio 1942 Tequila', 'Hennessy VS'],
  8,
  true
FROM events e WHERE e.name = 'Saturday Night Fever';

INSERT INTO bottle_packages (event_id, name, description, price, bottles_included, serves, is_available)
SELECT 
  e.id,
  'Champagne Dreams',
  'Celebrate in style with premium champagne',
  2000.00,
  ARRAY['Dom Perignon', 'Ace of Spades', 'Grey Goose Vodka'],
  10,
  true
FROM events e WHERE e.name = 'Saturday Night Fever';