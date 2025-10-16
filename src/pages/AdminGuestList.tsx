import { useState, useEffect } from 'react';
import { Users, Download, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GuestListEntry = {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
  events: {
    name: string;
    event_date: string;
  };
};

export default function AdminGuestList() {
  const [entries, setEntries] = useState<GuestListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesRes, eventsRes] = await Promise.all([
        supabase
          .from('guest_list_entries')
          .select('*, events(name, event_date)')
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, name')
          .eq('guest_list_enabled', true)
          .order('name')
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      setEntries(entriesRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error loading guest lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = selectedEvent === 'all'
    ? entries
    : entries.filter(e => e.event_id === selectedEvent);

  const confirmedCount = filteredEntries.filter(e => e.is_confirmed).length;
  const pendingCount = filteredEntries.filter(e => !e.is_confirmed).length;

  const exportToCSV = () => {
    const headers = ['Event', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Submitted', 'Confirmed'];
    const rows = filteredEntries.map(entry => [
      entry.events.name,
      entry.first_name,
      entry.last_name,
      entry.email,
      entry.phone_number,
      entry.is_confirmed ? 'Confirmed' : 'Pending',
      new Date(entry.created_at).toLocaleString(),
      entry.confirmed_at ? new Date(entry.confirmed_at).toLocaleString() : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-list-${selectedEvent === 'all' ? 'all-events' : 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Guest List Management</h2>
            <p className="text-sm text-slate-600 mt-1">View and manage guest list entries</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredEntries.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Total Entries</div>
            <div className="text-2xl font-bold text-slate-900">{filteredEntries.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Confirmed</div>
            <div className="text-2xl font-bold text-green-700">{confirmedCount}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Events</div>
            <div className="text-2xl font-bold text-blue-700">{events.length}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No guest list entries yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Enable guest list on events to start receiving entries
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      {entry.is_confirmed ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Confirmed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{entry.events.name}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(entry.events.event_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {entry.first_name} {entry.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a href={`mailto:${entry.email}`} className="text-blue-600 hover:text-blue-700 text-sm">
                        {entry.email}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <a href={`tel:${entry.phone_number}`} className="text-blue-600 hover:text-blue-700 text-sm">
                        {entry.phone_number}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
