import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  image_url: string | null;
  capacity: number;
  created_at: string;
};

export type Event = {
  id: string;
  venue_id: string;
  name: string;
  description: string;
  event_date: string;
  image_url: string | null;
  dress_code: string;
  music_genre: string;
  min_age: number;
  guest_list_available: boolean;
  sections_available: boolean;
  special_events_available: boolean;
  display_order: number;
  is_published: boolean;
  is_recurring: boolean;
  recurrence_day: number | null;
  created_at: string;
  venues?: Venue;
};

export type Section = {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  minimum_spend: number;
  description: string | null;
  is_available: boolean;
  image_urls?: string[];
  display_order: number;
  created_at: string;
};

export type BottlePackage = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  bottles_included: string[];
  serves: number;
  is_available: boolean;
  image_urls?: string[];
  display_order: number;
  created_at: string;
};

export type GuestListOption = {
  id: string;
  event_id: string;
  tier_name: string;
  price: number;
  capacity: number;
  description: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
};

export type ReservationType = 'guest_list' | 'section' | 'bottle_service' | 'special_event';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type Reservation = {
  id: string;
  event_id: string;
  reservation_type: ReservationType;
  section_id: string | null;
  bottle_package_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  special_requests: string | null;
  occasion: string | null;
  status: ReservationStatus;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
};

export type EventTemplate = {
  id: string;
  name: string;
  description: string | null;
  template_data: {
    name: string;
    description: string;
    dress_code: string;
    music_genre: string;
    min_age: number;
    guest_list_available: boolean;
    sections_available: boolean;
    special_events_available: boolean;
    image_url?: string;
    sections?: Array<{
      name: string;
      capacity: number;
      minimum_spend: number;
      description: string;
    }>;
    bottle_packages?: Array<{
      name: string;
      description: string;
      price: number;
      bottles_included: string[];
      serves: number;
    }>;
  };
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
