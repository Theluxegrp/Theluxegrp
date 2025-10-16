import { useState } from 'react';
import { X, Calendar, MapPin, Music, Users, Clock, Shirt } from 'lucide-react';
import type { Event } from '../lib/supabase';
import GuestListForm from './GuestListForm';

type EventDetailModalProps = {
  event: Event & { venues?: { name: string; city: string; address: string } };
  onClose: () => void;
};

export default function EventDetailModal({
  event,
  onClose,
}: EventDetailModalProps) {
  const [showGuestListForm, setShowGuestListForm] = useState(false);
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const venueName = event.venue_name || event.venues?.name || 'Venue TBA';
  const venueCity = event.venue_city || event.venues?.city || '';
  const venueAddress = event.venue_address || event.venues?.address || '';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="relative">
          {event.image_url && (
            <img src={event.image_url} alt={event.name} className="w-full h-72 object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{event.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{formattedDate}</p>
                <p className="text-sm text-slate-600">{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{venueName}</p>
                {venueAddress && <p className="text-sm text-slate-600">{venueAddress}</p>}
                {venueCity && <p className="text-sm text-slate-600">{venueCity}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Music className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Music</p>
                <p className="font-semibold text-slate-900">{event.music_genre}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shirt className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Dress Code</p>
                <p className="font-semibold text-slate-900">{event.dress_code}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-600">Age Requirement</p>
                <p className="font-semibold text-slate-900">{event.min_age}+</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">About This Event</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {(event as any).booking_url_enabled && (event as any).booking_url && (
            <div className="border-t border-slate-200 pt-6">
              <a
                href={
                  (event as any).booking_url.startsWith('http://') || (event as any).booking_url.startsWith('https://')
                    ? (event as any).booking_url
                    : `https://${(event as any).booking_url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-4 rounded-lg font-bold text-lg text-center hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                Book Now
              </a>
            </div>
          )}

          {(event as any).guest_list_enabled && (
            <div className={`${(event as any).booking_url_enabled && (event as any).booking_url ? '' : 'border-t border-slate-200'} pt-6`}>
              <button
                onClick={() => setShowGuestListForm(true)}
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg text-center hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Join Guest List
              </button>
            </div>
          )}
        </div>
      </div>

      {showGuestListForm && (
        <GuestListForm
          eventId={event.id}
          eventName={event.name}
          onClose={() => setShowGuestListForm(false)}
        />
      )}
    </div>
  );
}
