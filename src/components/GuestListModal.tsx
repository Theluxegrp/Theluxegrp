import { useState } from 'react';
import { X, User, Mail, Phone, Users, CheckCircle2 } from 'lucide-react';
import type { Event } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { sendReservationNotification } from '../lib/notifications';

type GuestListModalProps = {
  event: Event & { venues?: { name: string } };
  onClose: () => void;
};

export default function GuestListModal({ event, onClose }: GuestListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.from('reservations').insert({
        event_id: event.id,
        reservation_type: 'guest_list',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        party_size: formData.partySize,
        status: 'confirmed',
      }).select().single();

      if (error) throw error;

      if (data) {
        await sendReservationNotification({
          id: data.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          party_size: formData.partySize,
          reservation_type: 'guest_list',
          event: {
            name: event.name,
            event_date: event.event_date,
          },
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to submit guest list request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center my-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">You're on the List!</h3>
          <p className="text-slate-600 mb-6">
            Check your email for confirmation details and event information. See you at {event.name}!
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
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-bold text-white">Join Guest List</h3>
          <p className="text-slate-200 mt-1">{event.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Party Size
            </label>
            <input
              type="number"
              required
              min="1"
              max="10"
              value={formData.partySize}
              onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
