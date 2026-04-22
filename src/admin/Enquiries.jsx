import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Enquiries = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('New');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/enquiries`, {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      setEnquiries(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setMessage('Unable to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
    const interval = setInterval(loadEnquiries, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateEnquiry = async (enquiryId, status, adminReply) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status, admin_reply: adminReply }),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      if (!response.ok) {
        setMessage('Unable to update enquiry');
        return;
      }
      setMessage('✅ Enquiry updated successfully');
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, ...data } : e))
      );
      setSelectedEnquiry(null);
      setReplyText('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Unable to update enquiry');
    }
  };

  const deleteEnquiry = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/admin/enquiries/${enquiryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      if (!response.ok) {
        setMessage('Unable to delete enquiry');
        return;
      }
      setMessage('✅ Enquiry deleted');
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Unable to delete enquiry');
    }
  };

  const filteredEnquiries = enquiries.filter((e) => e.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Replied':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Customer Enquiries</h2>
            <p className="mt-2 text-slate-500">Manage customer enquiries and respond to queries.</p>
          </div>
          <button
            onClick={loadEnquiries}
            disabled={loading}
            className="rounded-2xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated} • Auto-refresh every 30s</p>
        )}
      </div>

      {message && (
        <div className={`rounded-3xl p-4 ${
          message.includes('Error') || message.includes('❌')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['New', 'Replied', 'Closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
              filter === status
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status} ({enquiries.filter((e) => e.status === status).length})
          </button>
        ))}
      </div>

      {/* Enquiries List */}
      <div className="space-y-4">
        {filteredEnquiries.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">No {filter.toLowerCase()} enquiries</p>
          </div>
        ) : (
          filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{enquiry.subject}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enquiry.status)}`}>
                      {enquiry.status}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-3">{enquiry.message}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Name</p>
                      <p className="font-medium text-slate-900">{enquiry.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{enquiry.email}</p>
                    </div>
                    {enquiry.phone && (
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-medium text-slate-900">{enquiry.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">Date</p>
                      <p className="font-medium text-slate-900">
                        {new Date(enquiry.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap md:flex-col">
                  <button
                    onClick={() => setSelectedEnquiry(enquiry.id === selectedEnquiry ? null : enquiry.id)}
                    className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    {selectedEnquiry === enquiry.id ? 'Close' : 'Reply'}
                  </button>
                  <button
                    onClick={() => deleteEnquiry(enquiry.id)}
                    className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Admin Reply Section */}
              {selectedEnquiry === enquiry.id && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">Admin Reply</h4>
                  <textarea
                    value={enquiry.id === selectedEnquiry ? replyText : (enquiry.admin_reply || '')}
                    onChange={(e) => {
                      if (enquiry.id === selectedEnquiry) {
                        setReplyText(e.target.value);
                      }
                    }}
                    placeholder="Type your reply here..."
                    rows="4"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateEnquiry(enquiry.id, 'Replied', replyText)}
                      className="rounded-2xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                    >
                      Mark as Replied
                    </button>
                    <button
                      onClick={() => updateEnquiry(enquiry.id, 'Closed', enquiry.admin_reply)}
                      className="rounded-2xl bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                    >
                      Close Enquiry
                    </button>
                  </div>
                </div>
              )}

              {enquiry.admin_reply && selectedEnquiry !== enquiry.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Admin Reply:</strong>
                  </p>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-2xl">{enquiry.admin_reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Enquiries;
