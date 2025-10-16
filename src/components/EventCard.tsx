import { Calendar, MapPin, Music, Clock } from 'lucide-react';
import type { Event } from '../lib/supabase';

type EventCardProps = {
  event: Event & { venues?: { name: string; city: string } };
  onClick: () => void;
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          key={event.image_url}
          src={event.image_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-1">{event.name}</h3>
          <p className="text-yellow-400 text-sm font-medium">{event.venues?.name}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          <div className="flex items-center text-slate-700">
            <Calendar className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>

          <div className="flex items-center text-slate-700">
            <Clock className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="text-sm font-medium">{formattedTime}</span>
          </div>

          <div className="flex items-center text-slate-700">
            <MapPin className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="text-sm">{event.venues?.city}</span>
          </div>

          <div className="flex items-center text-slate-700">
            <Music className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="text-sm">{event.music_genre}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {event.guest_list_available && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                Guest List
              </span>
            )}
            {event.sections_available && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                VIP Tables
              </span>
            )}
            {event.special_events_available && (
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                Special Events
              </span>
            )}
          </div>
        </div>

        <button className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg">
          View Details
        </button>
      </div>
    </div>
  );
}
