import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import EventsList from './components/EventsList';
import EventDetailModal from './components/EventDetailModal';
import GuestListForm from './components/GuestListForm';
import AdminLayout from './pages/AdminLayout';
import AdminEvents from './pages/AdminEvents';
import AdminSettings from './pages/AdminSettings';
import AdminGuestList from './pages/AdminGuestList';
import type { Event } from './lib/supabase';

type ModalState = {
  eventDetail: Event | null;
};

type AdminPage = 'events' | 'settings' | 'guestlist';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminPage, setAdminPage] = useState<AdminPage>('events');
  const [eventsKey, setEventsKey] = useState(0);
  const [guestListEventId, setGuestListEventId] = useState<string | null>(null);
  const [guestListEvent, setGuestListEvent] = useState<Event | null>(null);

  const [modals, setModals] = useState<ModalState>({
    eventDetail: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guestlistParam = params.get('guestlist');

    if (guestlistParam) {
      setGuestListEventId(guestlistParam);
      loadGuestListEvent(guestlistParam);
    }

    setLoading(false);
  }, []);

  const loadGuestListEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.error('Event not found');
        setGuestListEventId(null);
        setGuestListEvent(null);
        return;
      }

      setGuestListEvent(data);
    } catch (err) {
      console.error('Error loading event:', err);
      setGuestListEventId(null);
      setGuestListEvent(null);
    }
  };

  const closeAllModals = () => {
    setModals({
      eventDetail: null,
    });
  };

  const openEventDetail = (event: Event) => {
    setModals({ ...modals, eventDetail: event });
  };

  const handleAdminAccess = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminPage('events');
    setEventsKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminLayout currentPage={adminPage} onNavigate={setAdminPage} onLogout={handleLogout}>
        {adminPage === 'events' && <AdminEvents />}
        {adminPage === 'guestlist' && <AdminGuestList />}
        {adminPage === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header onAdminAccess={handleAdminAccess} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Upcoming Events</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover exclusive nightlife experiences at premier venues.
          </p>
        </div>

        <EventsList key={eventsKey} onEventClick={openEventDetail} />
      </main>

      {modals.eventDetail && (
        <EventDetailModal
          event={modals.eventDetail}
          onClose={closeAllModals}
        />
      )}

      {guestListEventId && guestListEvent && (
        <GuestListForm
          eventId={guestListEventId}
          eventName={guestListEvent.name}
          onClose={() => {
            setGuestListEventId(null);
            setGuestListEvent(null);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      )}
    </div>
  );
}

export default App;
