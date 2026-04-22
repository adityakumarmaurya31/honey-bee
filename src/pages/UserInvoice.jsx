import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../admin/api.js';

const UserInvoice = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        .min-h-screen {
          min-height: auto;
          padding: 0;
        }
        #invoice-content {
          box-shadow: none;
          border: none;
        }
        .rounded-2xl, .rounded-3xl {
          border-radius: 4px;
        }
        .bg-gradient-to-br, .bg-gradient-to-r {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
        }
        .text-amber-700, .text-amber-900 {
          color: #b45309 !important;
        }
        .text-white {
          color: white !important;
        }
        button {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const loadOrder = async () => {
      console.log('🔍 UserInvoice - Starting load, orderId:', orderId);
      setLoading(true);
      setMessage('');

      try {
        // Get email from localStorage or URL params
        const userEmail = localStorage.getItem('userEmail');
        console.log('📧 UserInvoice - Email from localStorage:', userEmail);
        
        if (!userEmail) {
          setMessage('Please provide your email to view invoices');
          setLoading(false);
          return;
        }

        if (!orderId) {
          console.error('❌ UserInvoice - orderId is missing:', orderId);
          setMessage('Order ID is missing. Please go back and try again.');
          setLoading(false);
          return;
        }

        console.log('🔄 UserInvoice - Fetching orders for email:', userEmail);
        // Fetch all user orders
        const response = await fetch(`${API_BASE}/api/orders/user?email=${encodeURIComponent(userEmail)}`);
        console.log('📡 UserInvoice - API Response status:', response.status);
        
        const data = await response.json();
        console.log('📋 UserInvoice - API Response data:', data);

        if (!response.ok) {
          setMessage(data.message || 'Unable to load order');
          setLoading(false);
          return;
        }

        // Find the specific order
        const orderIdInt = parseInt(orderId);
        console.log('🔎 UserInvoice - Looking for order ID:', orderIdInt, 'from orders:', data.map(o => o.id));
        
        const foundOrder = data.find(o => o.id === orderIdInt);
        console.log('✅ UserInvoice - Found order:', foundOrder);
        
        if (!foundOrder) {
          setMessage(`Order #${orderId} not found`);
          setLoading(false);
          return;
        }

        // Check if order is delivered
        if (foundOrder.status !== 'Delivered') {
          setMessage(`Invoice is only available for delivered orders. Current status: ${foundOrder.status}`);
          setLoading(false);
          return;
        }

        setOrder(foundOrder);
        console.log('✅ UserInvoice - Order loaded successfully');
      } catch (err) {
        console.error('❌ UserInvoice - Error:', err);
        setMessage('Unable to load invoice details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    } else {
      console.error('❌ UserInvoice - orderId not found in URL params');
      setMessage('Invalid order ID');
      setLoading(false);
    }
  }, [orderId]);

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
            Loading invoice...
          </div>
        </div>
      </div>
    );
  }

  if (message || !order) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-200">
            <div className="text-lg font-semibold text-slate-900 mb-2">{message || 'Order not found'}</div>
            {message && (
              <p className="text-sm text-slate-600 mt-4">
                Please check back after your order has been delivered.
              </p>
            )}
            <p className="text-sm text-slate-500 mt-4">Status: {order?.status || 'Unknown'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log order data
  console.log('Invoice page - Order data:', { order, hasItems: order?.items?.length, couponDiscount: order?.coupon_discount });

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const couponDiscount = Number(order.coupon_discount) || 0;
  
  // Calculate original MRP and discount
  let originalMRP = 0;
  let totalDiscount = 0;
  order.items.forEach((item) => {
    const itemPrice = Number(item.price);
    const itemDiscount = Number(item.discount) || 0;
    const itemQuantity = Number(item.quantity);
    
    if (itemDiscount && itemDiscount > 0) {
      // Original price (MRP) = Final price / (1 - discount%)
      const originalPrice = itemPrice / (1 - itemDiscount / 100);
      originalMRP += originalPrice * itemQuantity;
      const discountAmount = (originalPrice - itemPrice) * itemQuantity;
      totalDiscount += discountAmount;
    } else {
      originalMRP += itemPrice * itemQuantity;
    }
  });

  const totalWithGST = subtotal;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoice #{order.id}</h1>
            <p className="mt-2 text-slate-600">Order details and billing information</p>
          </div>
          <button
            onClick={printInvoice}
            className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
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
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => {
                      const itemPrice = Number(item.price);
                      const itemQuantity = Number(item.quantity);
                      const discountPercent = Number(item.discount) || 0;
                      const originalPrice = discountPercent > 0 ? itemPrice / (1 - discountPercent / 100) : itemPrice;
                      const discountPerUnit = originalPrice - itemPrice;
                      
                      return (
                        <tr key={item.product_id} className="border-b border-slate-100">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {item.product_image && (
                                <img
                                  src={item.product_image}
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
                          <td className="py-4 px-4 text-center font-medium">{itemQuantity}</td>
                          <td className="py-4 px-4 text-right text-slate-600">
                            {discountPercent > 0 ? <span className="line-through">₹{originalPrice.toFixed(2)}</span> : `₹${itemPrice.toFixed(2)}`}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {discountPercent > 0 ? (
                              <span className="text-green-600 font-medium">-₹{discountPerUnit.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-amber-700">₹{itemPrice.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-bold">₹{(itemPrice * itemQuantity).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 text-center text-slate-500">
                        No items found in this order
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Invoice Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div></div>
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-300 shadow-md">
                <h4 className="text-lg font-bold text-slate-900 mb-5 border-b-2 border-amber-300 pb-3">BILL SUMMARY</h4>
                
                <div className="space-y-4">
                  {/* Show original MRP */}
                  <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                    <span className="text-slate-700 font-medium">Original MRP:</span>
                    <span className="font-semibold text-slate-900">₹{originalMRP.toFixed(2)}</span>
                  </div>

                  {/* Show discount if any */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-amber-200 bg-green-100 p-3 rounded-lg">
                      <span className="text-green-800 font-bold">Product Discount:</span>
                      <span className="font-bold text-green-700 text-lg">-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Show subtotal after product discount */}
                  <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                    <span className="text-slate-700 font-medium">Subtotal (After Discount):</span>
                    <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Show coupon discount if any */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-amber-200 bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-800 font-bold">Coupon Discount:</span>
                      <span className="font-bold text-blue-700 text-lg">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Final Amount - PROMINENT */}
                  <div className="flex justify-between items-center mt-4 bg-gradient-to-r from-amber-400 to-amber-500 p-4 rounded-xl border-2 border-amber-600 shadow-lg">
                    <span className="text-lg font-bold text-white">TOTAL PAYABLE:</span>
                    <span className="text-3xl font-bold text-white">₹{(totalWithGST - couponDiscount).toFixed(2)}</span>
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
    </div>
  );
};

export default UserInvoice;
