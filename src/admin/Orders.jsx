import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const buildTrackingInputs = (ordersList) => Object.fromEntries(
    ordersList.map((order) => [order.id, order.trackingNumber || ''])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      setOrders(data);
      setTrackingInputs(buildTrackingInputs(data));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setMessage('Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateOrder = async (orderId, nextStatus) => {
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status: nextStatus,
          trackingNumber: trackingInputs[orderId] || '',
        }),
      });
      if (handleAuthError(response, navigate)) return;
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Unable to update order');
        return;
      }

      setMessage('Order updated');
      setOrders((prev) => prev.map((order) => (
        order.id === data.id
          ? {
              ...order,
              status: data.status,
              trackingNumber: data.trackingNumber,
              trackingAssignedAt: data.trackingAssignedAt,
            }
          : order
      )));
      setTrackingInputs((prev) => ({
        ...prev,
        [orderId]: data.trackingNumber || '',
      }));
    } catch (err) {
      setMessage('Unable to update order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Order Management</h2>
            <p className="mt-2 text-slate-500">Assign tracking numbers and update shipping status for each order.</p>
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="rounded-2xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>
        {lastUpdated && (
          <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated} | Auto-refresh every 15s</p>
        )}
      </div>

      {message && <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 shadow-sm border border-amber-100">{message}</div>}

      <div className="space-y-5">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Order #{order.id}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{order.user_name} ({order.user_email})</p>
                <p className="text-sm text-slate-500">Total: ₹{Number(order.total).toFixed(2)}</p>
                <p className="text-sm text-slate-500">Payment: {order.paymentMethod}</p>
              </div>
              <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                <span className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'Shipped'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : order.status === 'Returned'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.status}
                </span>
                <button
                  onClick={() => navigate(`/admin/invoice/${order.id}`)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  View Invoice
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_220px_180px]">
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-slate-800">Tracking Number</span>
                <input
                  type="text"
                  value={trackingInputs[order.id] || ''}
                  onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value.toUpperCase() }))}
                  placeholder="Enter courier tracking number"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-semibold text-slate-800">Order Status</span>
                <select
                  value={order.status}
                  onChange={(e) => updateOrder(order.id, e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option>Pending</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                  <option>Returned</option>
                </select>
              </label>

              <div className="flex items-end">
                <button
                  onClick={() => updateOrder(order.id, order.status)}
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Save Tracking
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="font-semibold text-slate-800">Tracking Details</p>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Created: {new Date(order.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500">Status: {order.status}</p>
                <p className="text-sm text-slate-500">
                  Tracking Number: {order.trackingNumber || 'Not assigned yet'}
                </p>
                <p className="text-sm text-slate-500">
                  Assigned At: {order.trackingAssignedAt ? new Date(order.trackingAssignedAt).toLocaleString('en-IN') : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
