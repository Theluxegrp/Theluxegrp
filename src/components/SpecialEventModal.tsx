import { useState } from 'react';
import { X, User, Mail, Phone, Users, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { Event } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { sendReservationNotification } from '../lib/notifications';

type SpecialEventModalProps = {
  event: Event & { venues?: { name: string } };
  onClose: () => void;
};

const occasionTypes = [
  'Birthday Party',
  'Anniversary',
  'Bachelor/Bachelorette Party',
  'Corporate Event',
  'Graduation',
  'Engagement',
  'Other',
];

export default function SpecialEventModal({ event, onClose }: SpecialEventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: 10,
    occasion: 'Birthday Party',
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingMode = (event as any).special_events_booking_mode || 'instant';
      const initialStatus = bookingMode === 'request' ? 'pending' : 'confirmed';

      const { data, error } = await supabase.from('reservations').insert({
        event_id: event.id,
        reservation_type: 'special_event',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        party_size: formData.partySize,
        occasion: formData.occasion,
        special_requests: formData.specialRequests || null,
        status: initialStatus,
      }).select().single();

      if (error) throw error;

      if (data) {
        await sendReservationNotification({
          id: data.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          party_size: formData.partySize,
          reservation_type: 'special_event',
          event: {
            name: event.name,
            event_date: event.event_date,
          },
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to submit special event request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const bookingMode = (event as any).special_events_booking_mode || 'instant';
    const isRequestMode = bookingMode === 'request';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center my-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            {isRequestMode ? 'Request Received!' : 'Booking Confirmed!'}
          </h3>
          <p className="text-slate-600 mb-6">
            {isRequestMode
              ? 'Our events team will review your request and contact you within 24 hours to discuss your special event. Check your email for updates.'
              : 'Your special event booking has been confirmed! Our events team will contact you within 24 hours to finalize details. Check your email for confirmation.'}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md"
          >
            Close
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-bold text-white">Book Special Event</h3>
          <p className="text-slate-200 mt-1">{event.name}</p>
        </div>

        <div className="p-6">
          {(event as any).special_events_instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="font-bold text-blue-900 mb-2">HOW TO BOOK A SPECIAL EVENT</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{(event as any).special_events_instructions}</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 mb-6">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Create an Unforgettable Experience
            </h4>
            <p className="text-slate-700 text-sm leading-relaxed">
              Whether it's a birthday bash, corporate celebration, or any special occasion, our team
              will work with you to create a custom package including VIP seating, bottle service,
              decorations, and more. Let us make your event extraordinary.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Expected Guest Count
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="200"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Occasion Type
              </label>
              <select
                value={formData.occasion}
                onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
              >
                {occasionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Tell Us About Your Event
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="Share details about your vision, budget, specific requirements, entertainment needs, food & beverage preferences, etc."
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-slate-600 font-medium">What happens next:</p>
              <ul className="text-sm text-slate-600 space-y-1 pl-5 list-disc">
                <li>Our events coordinator will contact you within 24 hours</li>
                <li>We'll discuss your vision and create a customized package</li>
                <li>Receive a detailed proposal with pricing and options</li>
                <li>Finalize details and secure your date with a deposit</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Submitting...' : ((event as any).special_events_booking_mode === 'request' ? 'Submit Event Request' : 'Book Instantly')}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
