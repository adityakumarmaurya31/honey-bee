import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders, handleAuthError } from './api.js';

const Invoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setMessage('');

      try {
        const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
          headers: getAuthHeaders(),
        });

        if (handleAuthError(response, navigate)) return;

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'Unable to load order');
          return;
        }

        setOrder(data);
      } catch (err) {
        setMessage('Unable to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, navigate]);

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (message || !order) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
          {message || 'Order not found'}
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = order.coupon_discount || 0;
  
  // Calculate original MRP and discount
  let originalMRP = 0;
  let totalDiscount = 0;
  order.items.forEach((item) => {
    if (item.discount && item.discount > 0) {
      // Original price (MRP) = Final price / (1 - discount%)
      const originalPrice = item.price / (1 - item.discount / 100);
      originalMRP += originalPrice * item.quantity;
      const discountAmount = (originalPrice - item.price) * item.quantity;
      totalDiscount += discountAmount;
    } else {
      originalMRP += item.price * item.quantity;
    }
  });

  const totalWithGST = subtotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice #{order.id}</h1>
          <p className="mt-2 text-slate-500">Order details and billing information</p>
        </div>
        <button
          onClick={printInvoice}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Print Invoice
        </button>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200" id="invoice-content">
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Honey Bee Store</h2>
              <p className="text-slate-600 mt-1">Premium Honey Products</p>
              <p className="text-slate-500 text-sm mt-2">Prayagraj, Uttar Pradesh</p>
              <p className="text-slate-500 text-sm">Email: mithilesh7309@gmail.com</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-semibold text-slate-900">INVOICE</h3>
              <p className="text-slate-600 mt-2">Invoice #: {order.id}</p>
              <p className="text-slate-600">Date: {new Date(order.created_at).toLocaleDateString()}</p>
              <p className="text-slate-600">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>{order.status}</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Bill To:</h4>
            <div className="text-slate-700">
              <p className="font-medium">{order.user_name}</p>
              <p>{order.user_email}</p>
              <p className="mt-2">{order.address}</p>
              <p>{order.city}, {order.state} {order.pincode}</p>
              <p className="mt-2">Phone: {order.phone}</p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Payment Details:</h4>
            <div className="text-slate-700">
              <p>Payment Method: {order.paymentMethod || 'Cash on Delivery'}</p>
              <p>Order Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Order Items:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 px-4 text-slate-900 font-semibold">Product</th>
                  <th className="py-3 px-4 text-slate-900 font-semibold text-center">Qty</th>
                  <th className="py-3 px-4 text-slate-900 font-semibold text-right">MRP</th>
                  <th className="py-3 px-4 text-slate-900 font-semibold text-right">Discount</th>
                  <th className="py-3 px-4 text-slate-900 font-semibold text-right">Final Price</th>
                  <th className="py-3 px-4 text-slate-900 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const discountPercent = item.discount || 0;
                  const originalPrice = discountPercent > 0 ? item.price / (1 - discountPercent / 100) : item.price;
                  const discountPerUnit = originalPrice - item.price;
                  
                  return (
                    <tr key={item.product_id} className="border-b border-slate-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img
                              src={item.product_image.startsWith('/uploads') ? `${API_BASE}${item.product_image}` : item.product_image}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{item.product_name}</p>
                            {discountPercent > 0 && (
                              <p className="text-xs text-white bg-green-600 rounded px-2 py-1 w-fit mt-1">Save {discountPercent}%</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                      <td className="py-4 px-4 text-right text-slate-600">
                        {discountPercent > 0 ? <span className="line-through">₹{Number(originalPrice).toFixed(2)}</span> : `₹${Number(item.price).toFixed(2)}`}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {discountPercent > 0 ? (
                          <span className="text-green-600 font-medium">-₹{discountPerUnit.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-amber-700">₹{Number(item.price).toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Invoice Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div></div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h4 className="text-lg font-bold text-slate-900 mb-4">Invoice Summary</h4>
              
              <div className="space-y-3">
                {/* Show Original MRP */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700">Total MRP:</span>
                  <span className="font-semibold text-slate-900">₹{originalMRP.toFixed(2)}</span>
                </div>
                
                {/* Show Discount if any */}
                {totalDiscount > 0 && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 bg-green-50 p-2 rounded">
                    <span className="text-green-800 font-medium">Product Discount:</span>
                    <span className="font-bold text-green-700">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700">Subtotal (After Discount):</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>

                {/* Show Coupon Discount if any */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 bg-blue-50 p-2 rounded">
                    <span className="text-blue-800 font-medium">Coupon Discount:</span>
                    <span className="font-bold text-blue-700">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 bg-amber-100 p-3 rounded-lg border-2 border-amber-300">
                  <span className="text-lg font-bold text-amber-900">Final Amount Payable:</span>
                  <span className="text-2xl font-bold text-amber-700">₹{(totalWithGST - couponDiscount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Terms & Conditions:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Payment is due within 30 days of invoice date</li>
                <li>• All goods remain property of Honey Bee Store until paid</li>
                <li>• Returns accepted within 7 days with original packaging</li>
                <li>• For COD orders, payment due on delivery</li>
              </ul>
            </div>
            <div className="text-right">
              <div className="mb-8">
                <p className="text-slate-600">Thank you for your business!</p>
                <p className="text-slate-500 text-sm mt-2">Honey Bee Store Team</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;