import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../admin/api.js';

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const statusStyles = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Returned: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
  Pending: 'bg-amber-100 text-amber-800',
};

function MyOrdersPage() {
  const [email, setEmail] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orders, setOrders] = useState([]);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [searched, setSearched] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnMessage, setReturnMessage] = useState('');

  const searchOrders = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    setSearched(true);

    try {
      const response = await fetch(`${API_BASE}/api/orders/user?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Unable to load orders');
        setOrders([]);
        return;
      }

      localStorage.setItem('userEmail', email.trim());
      setOrders(data);
      if (data.length === 0) {
        setMessage('No orders found for this email address');
      }
    } catch (error) {
      setMessage('Unable to connect to server');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByTrackingNumber = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setTrackingMessage('Please enter a tracking number');
      return;
    }

    setTrackingLoading(true);
    setTrackingMessage('');
    setTrackedOrder(null);

    try {
      const response = await fetch(`${API_BASE}/api/orders/track?trackingNumber=${encodeURIComponent(trackingNumber.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        setTrackingMessage(data.message || 'Unable to track order');
        return;
      }

      setTrackedOrder(data);
    } catch (error) {
      setTrackingMessage('Unable to connect to server');
    } finally {
      setTrackingLoading(false);
    }
  };

  const cancelOrderHandler = async (orderId, orderEmail) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      return;
    }

    setCancellingOrder(orderId);
    setCancelMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: orderEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCancelMessage(`Error: ${data.message || 'Unable to cancel order'}`);
        return;
      }

      setOrders((prev) => prev.map((order) => (
        order.id === orderId ? { ...order, status: 'Cancelled' } : order
      )));
      setCancelMessage(`Order #${orderId} cancelled successfully.`);
      setTimeout(() => setCancelMessage(''), 4000);
    } catch (error) {
      setCancelMessage(`Unable to cancel order: ${error.message}`);
    } finally {
      setCancellingOrder(null);
    }
  };

  const returnOrderHandler = async (orderId, orderEmail) => {
    if (!window.confirm('Are you sure you want to return this order? Stock will be restored and refund will be processed.')) {
      return;
    }

    setReturningOrder(orderId);
    setReturnMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: orderEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        setReturnMessage(`Error: ${data.message || 'Unable to return order'}`);
        return;
      }

      setOrders((prev) => prev.map((order) => (
        order.id === orderId ? { ...order, status: 'Returned' } : order
      )));
      setReturnMessage(`Order #${orderId} returned successfully. Refund will be processed within 5-7 business days.`);
      setTimeout(() => setReturnMessage(''), 4000);
    } catch (error) {
      setReturnMessage(`Unable to return order: ${error.message}`);
    } finally {
      setReturningOrder(null);
    }
  };

  const renderOrderCard = (order, { compact = false } = {}) => (
    <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Order #{order.id}</h3>
          <p className="text-sm text-slate-500">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {order.user_name} | {order.user_email}
          </p>
        </div>
        <div className="mt-2 lg:mt-0 text-left lg:text-right">
          <div className="flex flex-col items-start lg:items-end gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles[order.status] || statusStyles.Pending}`}>
                {order.status}
              </span>
              <div className="text-right">
                {order.coupon_discount > 0 ? (
                  <>
                    <p className="text-xs text-slate-500 line-through">{formatCurrency(order.total)}</p>
                    <p className="text-lg font-semibold text-green-700">{formatCurrency(order.total - order.coupon_discount)}</p>
                    <p className="text-xs text-green-600">Coupon saved ₹{Number(order.coupon_discount).toFixed(2)}</p>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-amber-700">{formatCurrency(order.total)}</span>
                )}
              </div>
            </div>
            {!compact && (
              <div className="flex gap-2 flex-wrap">
                {order.status === 'Delivered' && (
                  <>
                    <Link
                      to={`/invoice/${order.id}`}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      View Invoice
                    </Link>
                    <button
                      onClick={() => returnOrderHandler(order.id, order.user_email)}
                      disabled={returningOrder === order.id}
                      className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {returningOrder === order.id ? 'Processing...' : 'Return Order'}
                    </button>
                  </>
                )}
                {order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Returned' && (
                  <button
                    disabled
                    title={`Invoice and return available after delivery. Current status: ${order.status}`}
                    className="rounded-2xl bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 cursor-not-allowed opacity-60"
                  >
                    View Invoice
                  </button>
                )}
                {order.status === 'Pending' && (
                  <button
                    onClick={() => cancelOrderHandler(order.id, order.user_email)}
                    disabled={cancellingOrder === order.id}
                    className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Tracking Details</h4>
          <p className="text-sm text-slate-600">Tracking Number: {order.trackingNumber || 'Not assigned yet'}</p>
          <p className="text-sm text-slate-600">
            Tracking Assigned: {order.trackingAssignedAt ? new Date(order.trackingAssignedAt).toLocaleString('en-IN') : 'Pending'}
          </p>
          <p className="text-sm text-slate-600">Payment: {order.paymentMethod}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Shipping Address</h4>
          <p className="text-sm text-slate-600">{order.address}</p>
          <p className="text-sm text-slate-600">{order.city}, {order.state} - {order.pincode}</p>
          <p className="text-sm text-slate-600">Phone: {order.phone}</p>
        </div>

        {order.coupon_discount > 0 && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold text-green-900 mb-3">💰 Coupon Applied</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Subtotal:</span>
                <span className="text-green-900 line-through">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-green-200 pt-2">
                <span className="text-green-800">Discount:</span>
                <span className="text-green-700">-{formatCurrency(order.coupon_discount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-green-300">
                <span className="text-green-900">You Paid:</span>
                <span className="text-green-700">{formatCurrency(order.total - order.coupon_discount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-6 mt-6">
        <h4 className="font-semibold text-slate-900 mb-4">Order Items</h4>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-700">₹{Number(item.price).toFixed(2)}</p>
                <p className="text-sm text-slate-500">Total: ₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="mt-2 text-slate-600">Find your orders by email or track them directly with the tracking number shared by admin.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Find Orders by Email</h2>
            <form onSubmit={searchOrders} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Enter your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Find My Orders'}
              </button>
            </form>
            {message && (
              <div className={`rounded-2xl p-4 mt-4 ${orders.length > 0 ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Track with Tracking Number</h2>
            <form onSubmit={searchByTrackingNumber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tracking number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter tracking number"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <button
                type="submit"
                disabled={trackingLoading}
                className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {trackingLoading ? 'Tracking...' : 'Track Order'}
              </button>
            </form>
            {trackingMessage && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 mt-4">
                {trackingMessage}
              </div>
            )}
          </div>
        </div>

        {cancelMessage && <div className="rounded-3xl border border-green-200 bg-green-50 p-4 mb-6 text-green-800">{cancelMessage}</div>}
        {returnMessage && <div className="rounded-3xl border border-green-200 bg-green-50 p-4 mb-6 text-green-800">{returnMessage}</div>}

        {trackedOrder && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Tracked Order</h2>
            {renderOrderCard(trackedOrder, { compact: true })}
          </div>
        )}

        {searched && orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Your Orders ({orders.length})</h2>
            {orders.map((order) => renderOrderCard(order))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;
