import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Users, MessageSquare, CheckCircle2, ZoomIn } from 'lucide-react';
import type { Event, Section, BottlePackage } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { sendReservationNotification } from '../lib/notifications';
import ImageZoomModal from './ImageZoomModal';

type BookingModalProps = {
  event: Event & { venues?: { name: string } };
  section?: Section;
  bottlePackage?: BottlePackage;
  onClose: () => void;
};

export default function BookingModal({ event, section, bottlePackage, onClose }: BookingModalProps) {
  const [tableOptions, setTableOptions] = useState<any[]>([]);
  const [selectedTableOption, setSelectedTableOption] = useState<string>('');
  const [sectionImages, setSectionImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: bottlePackage?.serves || 2,
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const isSection = !bottlePackage;
  const isBottleService = !!bottlePackage;

  useEffect(() => {
    if (isSection) {
      loadTableOptions();
    }
  }, [event.id]);

  const loadTableOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('table_options')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_available', true)
        .order('display_order');

      if (error) throw error;
      if (data && data.length > 0) {
        setTableOptions(data);
        setSelectedTableOption(data[0].id);
      }

      const { data: sectionsData } = await supabase
        .from('sections')
        .select('image_urls')
        .eq('event_id', event.id)
        .eq('is_available', true)
        .limit(1)
        .maybeSingle();

      if (sectionsData && sectionsData.image_urls) {
        setSectionImages(sectionsData.image_urls);
      }
    } catch (error) {
      console.error('Error loading table options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingMode = (event as any).sections_booking_mode || 'instant';
      const initialStatus = bookingMode === 'request' ? 'pending' : 'confirmed';

      const reservationData: any = {
        event_id: event.id,
        reservation_type: isSection ? 'section' : 'bottle_service',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        party_size: formData.partySize,
        special_requests: formData.specialRequests || null,
        status: initialStatus,
      };

      if (isSection && selectedTableOption) {
        reservationData.table_option_id = selectedTableOption;
      }

      if (bottlePackage) {
        reservationData.bottle_package_id = bottlePackage.id;
        reservationData.total_amount = bottlePackage.price;
      }

      const { data, error } = await supabase.from('reservations').insert(reservationData).select().single();

      if (error) throw error;

      if (data) {
        await sendReservationNotification({
          id: data.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          party_size: formData.partySize,
          reservation_type: isSection ? 'section' : 'bottle_service',
          event: {
            name: event.name,
            event_date: event.event_date,
          },
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const bookingMode = (event as any).sections_booking_mode || 'instant';
    const isRequestMode = bookingMode === 'request';

    return (
      <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center my-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            {isRequestMode ? 'Booking Request Received!' : 'Booking Confirmed!'}
          </h3>
          <p className="text-slate-600 mb-6">
            {isRequestMode
              ? 'Our team will review your request and contact you within 24 hours to confirm your reservation. Check your email for updates.'
              : 'Your reservation has been confirmed! Our team will contact you within 24 hours to finalize details. Check your email for confirmation.'}
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
      {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}
      </>
    );
  }

  return (
    <>
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
          <h3 className="text-2xl font-bold text-white">
            {isSection ? 'Reserve VIP Table' : 'Book Bottle Service'}
          </h3>
          <p className="text-slate-200 mt-1">{event.name}</p>
        </div>

        <div className="p-6">
          {(event as any).sections_instructions && isSection && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="font-bold text-blue-900 mb-2">HOW TO BOOK A SECTION</h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{(event as any).sections_instructions}</p>
            </div>
          )}

          {isSection && sectionImages.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 mb-3 text-center">Click to View Sections and Bottle Service Menu</p>
              <div className="grid grid-cols-2 gap-2">
                {sectionImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Section ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-lg cursor-pointer"
                      onClick={() => setZoomImage(url)}
                    />
                    <button
                      onClick={() => setZoomImage(url)}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bottlePackage && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              {bottlePackage.image_urls && bottlePackage.image_urls.length > 0 && (
                <>
                <p className="text-sm text-slate-600 mb-3 text-center">Click to View Sections and Bottle Service Menu</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {bottlePackage.image_urls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`${bottlePackage.name} ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg cursor-pointer"
                        onClick={() => setZoomImage(url)}
                      />
                      <button
                        onClick={() => setZoomImage(url)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                </>
              )}
              <h4 className="font-bold text-slate-900 mb-2">{bottlePackage.name}</h4>
              <div className="mb-3">
                <span className="text-slate-700 text-sm block mb-1">Includes:</span>
                <ul className="text-sm text-slate-900 space-y-0.5 pl-4">
                  {bottlePackage.bottles_included.map((bottle, idx) => (
                    <li key={idx}>• {bottle}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 text-sm">Serves {bottlePackage.serves} people</span>
                <span className="font-bold text-xl text-yellow-600">
                  ${bottlePackage.price.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSection && tableOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Your Table Option
                </label>
                <select
                  value={selectedTableOption}
                  onChange={(e) => setSelectedTableOption(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {tableOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {option.description && ` - ${option.description}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  Party Size
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Special Requests (Optional)
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Any special requests or dietary restrictions..."
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">
                A member of our team will contact you to confirm availability and finalize your
                reservation. Payment will be processed at the venue.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Submitting...' : ((event as any).sections_booking_mode === 'request' ? 'Submit Booking Request' : 'Book Instantly')}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
    {zoomImage && <ImageZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />}
    </>
  );
}
