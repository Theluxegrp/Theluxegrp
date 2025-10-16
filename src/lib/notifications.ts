import { supabase } from './supabase';

type ReservationData = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  reservation_type: string;
  event: {
    name: string;
    event_date: string;
  };
};

export const sendReservationNotification = async (reservation: ReservationData) => {
  try {
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.notification_enabled || !settings.notification_phone) {
      console.log('SMS notifications not configured or disabled');
      return { success: false, message: 'Notifications not configured' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-reservation-sms`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toPhone: settings.notification_phone,
          reservation: {
            customerName: reservation.customer_name,
            eventName: reservation.event.name,
            eventDate: reservation.event.event_date,
            reservationType: reservation.reservation_type,
            partySize: reservation.party_size,
            customerPhone: reservation.customer_phone,
            customerEmail: reservation.customer_email,
            reservationId: reservation.id,
          },
        }),
      }
    );

    const result = await response.json();

    await supabase.from('notification_log').insert({
      reservation_id: reservation.id,
      notification_type: 'sms',
      recipient: settings.notification_phone,
      status: result.success ? 'sent' : 'failed',
      message: `New reservation for ${reservation.event.name}`,
      error_message: result.success ? null : result.message,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};
