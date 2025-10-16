import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, Download } from 'lucide-react';
import { supabase, type Reservation, type Event } from '../lib/supabase';
import { exportToCSV, formatReservationForExport } from '../lib/export';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<(Reservation & { events?: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, events(name, event_date, venues(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadReservations();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesFilter = filter === 'all' || reservation.status === filter;
    const matchesSearch =
      searchTerm === '' ||
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      guest_list: 'Guest List',
      section: 'VIP Table',
      bottle_service: 'Bottle Service',
      special_event: 'Special Event',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleExportAll = () => {
    const exportData = filteredReservations.map(formatReservationForExport);
    exportToCSV(exportData, `all-reservations-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportByEvent = async () => {
    const events = await supabase.from('events').select('id, name').order('name');
    if (!events.data || events.data.length === 0) {
      alert('No events found');
      return;
    }

    const eventId = prompt(
      `Enter event name or number:\n${events.data.map((e, i) => `${i + 1}. ${e.name}`).join('\n')}`
    );

    if (!eventId) return;

    const eventIndex = parseInt(eventId) - 1;
    const selectedEvent = !isNaN(eventIndex) ? events.data[eventIndex] : events.data.find(e => e.name.toLowerCase().includes(eventId.toLowerCase()));

    if (!selectedEvent) {
      alert('Event not found');
      return;
    }

    const eventReservations = reservations.filter(r => r.event_id === selectedEvent.id);
    if (eventReservations.length === 0) {
      alert('No reservations found for this event');
      return;
    }

    const exportData = eventReservations.map(formatReservationForExport);
    exportToCSV(exportData, `${selectedEvent.name.replace(/[^a-z0-9]/gi, '-')}-reservations-${new Date().toISOString().split('T')[0]}`);
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Reservations Dashboard</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportByEvent}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export by Event</span>
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 items-center">
            <Filter className="text-slate-400 w-5 h-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900">{reservations.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {reservations.filter((r) => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-700">Confirmed</p>
            <p className="text-2xl font-bold text-slate-900">
              {reservations.filter((r) => r.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-700">Cancelled</p>
            <p className="text-2xl font-bold text-red-900">
              {reservations.filter((r) => r.status === 'cancelled').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Party Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{reservation.customer_name}</div>
                    <div className="text-sm text-slate-500">{reservation.customer_email}</div>
                    <div className="text-sm text-slate-500">{reservation.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{reservation.events?.name}</div>
                    {reservation.occasion && (
                      <div className="text-sm text-slate-500">{reservation.occasion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                      {getTypeLabel(reservation.reservation_type)}
                    </span>
                    {reservation.total_amount && (
                      <div className="text-sm text-slate-600 mt-1">
                        ${reservation.total_amount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{reservation.party_size}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                        reservation.status
                      )}`}
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {new Date(reservation.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(reservation.id, 'confirmed')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Confirm"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(reservation.id, 'cancelled')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {reservation.status === 'cancelled' && (
                        <button
                          onClick={() => updateStatus(reservation.id, 'pending')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Reopen"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No reservations found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
