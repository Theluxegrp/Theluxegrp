import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, User, Mail, Phone, Users, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Reservation = {
  id: string;
  event_id: string;
  reservation_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  special_requests?: string;
  occasion?: string;
  status: string;
  total_amount?: number;
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
  denied_at?: string;
  events: {
    name: string;
    event_date: string;
  };
  sections?: {
    name: string;
  };
  bottle_packages?: {
    name: string;
  };
};

export default function AdminRequests() {
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          events(name, event_date),
          sections(name),
          bottle_packages(name)
        `)
        .in('reservation_type', ['section', 'bottle_service', 'special_event'])
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      } else {
        query = query.in('status', ['pending', 'approved', 'denied']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes[id] || null,
        })
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
      setAdminNotes(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'denied',
          denied_at: new Date().toISOString(),
          admin_notes: adminNotes[id] || null,
        })
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
      setAdminNotes(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      section: 'VIP Table',
      bottle_service: 'Bottle Service',
      special_event: 'Special Event',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Booking Requests</h1>
        <p className="text-slate-600 mt-2">Review and manage booking requests</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('denied')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'denied'
              ? 'bg-red-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Denied
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No {filter !== 'all' ? filter : ''} requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {request.events.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {getTypeLabel(request.reservation_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.events.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Requested {new Date(request.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {expandedId === request.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Name</span>
                    </div>
                    <div className="text-slate-900">{request.customer_name}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <div className="text-slate-900">{request.customer_email}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <div className="text-slate-900">{request.customer_phone}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Party Size</span>
                    </div>
                    <div className="text-slate-900">{request.party_size} guests</div>
                  </div>
                </div>

                {expandedId === request.id && (
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                    {request.sections && (
                      <div>
                        <span className="font-medium text-slate-700">Section:</span>
                        <span className="ml-2 text-slate-900">{request.sections.name}</span>
                      </div>
                    )}
                    {request.bottle_packages && (
                      <div>
                        <span className="font-medium text-slate-700">Package:</span>
                        <span className="ml-2 text-slate-900">{request.bottle_packages.name}</span>
                      </div>
                    )}
                    {request.total_amount && (
                      <div>
                        <span className="font-medium text-slate-700">Amount:</span>
                        <span className="ml-2 text-slate-900">${request.total_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {request.occasion && (
                      <div>
                        <span className="font-medium text-slate-700">Occasion:</span>
                        <span className="ml-2 text-slate-900">{request.occasion}</span>
                      </div>
                    )}
                    {request.special_requests && (
                      <div>
                        <div className="flex items-center gap-1 text-slate-700 font-medium mb-2">
                          <MessageSquare className="w-4 h-4" />
                          Special Requests
                        </div>
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{request.special_requests}</p>
                      </div>
                    )}
                    {request.admin_notes && (
                      <div>
                        <div className="text-slate-700 font-medium mb-2">Admin Notes</div>
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{request.admin_notes}</p>
                      </div>
                    )}
                    {request.status === 'pending' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Admin Notes (Optional)
                          </label>
                          <textarea
                            value={adminNotes[request.id] || ''}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                            placeholder="Add internal notes about this request..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Approve Request
                          </button>
                          <button
                            onClick={() => handleDeny(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                            Deny Request
                          </button>
                        </div>
                      </div>
                    )}
                    {request.approved_at && (
                      <div className="text-sm text-green-600">
                        Approved on {new Date(request.approved_at).toLocaleString()}
                      </div>
                    )}
                    {request.denied_at && (
                      <div className="text-sm text-red-600">
                        Denied on {new Date(request.denied_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
