import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../admin/api.js';
import UPIPayment from '../components/UPIPayment.jsx';

function CheckoutPage({ cartItems, onClear }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'COD',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showUPIPayment, setShowUPIPayment] = useState(false);

  // Fetch available coupons on component mount
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/coupons`);
        if (response.ok) {
          const data = await response.json();
          // Filter only active coupons that haven't expired
          const activeCoupons = data.filter(coupon => {
            const expiry = new Date(coupon.expiry_date);
            return coupon.is_active && expiry > new Date();
          });
          setAvailableCoupons(activeCoupons);
        }
      } catch (err) {
        console.log('Could not fetch available coupons');
      }
    };

    fetchAvailableCoupons();
  }, []);

  const getDiscountedPrice = (item) => {
    const discount = item.discount || 0;
    return item.price * (1 - discount / 100);
  };

  const total = cartItems.reduce((sum, item) => sum + getDiscountedPrice(item) * item.quantity, 0);
  const payableTotal = total - couponDiscount;

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          totalAmount: total
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.message}`);
        setAppliedCoupon(null);
        setCouponDiscount(0);
        return;
      }

      setAppliedCoupon(data.coupon);
      setCouponDiscount(data.discount);
      setMessage(`✅ Coupon applied! Discount: ₹${data.discount.toFixed(2)}`);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const applyCouponQuick = async (coupon) => {
    setCouponCode(coupon.code);
    setValidatingCoupon(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon.code,
          totalAmount: total
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.message}`);
        setAppliedCoupon(null);
        setCouponDiscount(0);
        return;
      }

      setAppliedCoupon(data.coupon);
      setCouponDiscount(data.discount);
      setMessage(`✅ Coupon applied! Discount: ₹${data.discount.toFixed(2)}`);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setMessage('');
  };

  const loadRazorpayScript = () => {
    // UPI payment doesn't require script loading
    return Promise.resolve(true);
  };

  const handleUPIPaymentVerified = async (verifyData) => {
    try {
      // Save email to localStorage for invoice access
      localStorage.setItem('userEmail', form.email);

      setMessage(`✅ Payment verified! Order #${verifyData.orderId} has been placed.`);
      onClear();
      setTimeout(() => navigate(`/thank-you?orderId=${verifyData.orderId}`), 2000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setShowUPIPayment(false);
      setIsSubmitting(false);
    }
  };

  const startOnlinePayment = async () => {
    // Show UPI Payment Component
    setShowUPIPayment(true);
    setIsSubmitting(false);
  };

  const handlePaymentMethodChange = (paymentMethod) => {
    setForm({ ...form, paymentMethod });
    setIsSubmitting(false);
    setMessage('');

    if (paymentMethod === 'COD') {
      setShowUPIPayment(false);
    }
  };

  const orderItems = cartItems.map((item) => ({ product_id: item.id, quantity: item.quantity }));

  const validateCheckout = () => {
    if (!cartItems.length) {
      setMessage('Your cart is empty. Please add products before checkout.');
      return false;
    }

    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      setMessage('Please complete all checkout fields.');
      return false;
    }

    return true;
  };

  const placeCodOrder = async () => {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        paymentMethod: 'COD',
        items: orderItems,
        coupon_id: appliedCoupon?.id || null,
        coupon_discount: couponDiscount
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unable to place order');
    }

    // Save email to localStorage for invoice access
    localStorage.setItem('userEmail', form.email);
    
    setMessage(`Order placed successfully! Order #${data.orderId}`);
    onClear();
    setTimeout(() => navigate(`/thank-you?orderId=${data.orderId}`), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCheckout()) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      if (form.paymentMethod === 'COD') {
        await placeCodOrder();
      } else if (form.paymentMethod === 'UPI') {
        await startOnlinePayment();
      }
    } catch (err) {
      setMessage(err.message || 'Unable to connect to order server');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>Checkout – Customer Details</h2>
        <p>Please fill your information to complete the order.</p>
      </div>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h3>Customer Information</h3>
          <label>
            Full Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Your full name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Phone Number
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, phone: digitsOnly });
              }}
              required
              placeholder="10-digit mobile number"
            />
          </label>

          <h3>Shipping Address</h3>
          <label>
            House / Street
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              placeholder="House no, street name"
            />
          </label>
          <label>
            City
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
              placeholder="City"
            />
          </label>
          <label>
            State
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
              placeholder="State"
            />
          </label>
          <label>
            Pincode
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
              placeholder="Pincode"
            />
          </label>

          <h3>Payment Option</h3>
          <label>
            <input
              type="radio"
              name="payment"
              value="COD"
              checked={form.paymentMethod === 'COD'}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
            />
            Cash on Delivery (COD)
          </label>
          <label>
            <input
              type="radio"
              name="payment"
              value="UPI"
              checked={form.paymentMethod === 'UPI'}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
            />
            UPI Payment (Google Pay, PhonePe, etc)
          </label>

          {showUPIPayment && (
            <div className="my-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <UPIPayment
                amount={payableTotal}
                orderId={Date.now()} // Temporary ID, will be replaced with actual order ID
                orderDetails={{
                  ...form,
                  items: orderItems,
                  coupon_id: appliedCoupon?.id || null,
                  coupon_discount: couponDiscount
                }}
                onPaymentVerified={handleUPIPaymentVerified}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '10px' }}
            disabled={isSubmitting || (form.paymentMethod === 'UPI' && showUPIPayment)}
          >
            {isSubmitting
              ? 'Processing...'
              : form.paymentMethod === 'COD'
              ? 'Place Order'
              : `Generate UPI QR - ₹${payableTotal.toFixed(2)}`}
          </button>
          {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
        </form>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {/* COUPON SECTION - AT TOP */}
              <div className="mb-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-md">
                <h4 className="font-semibold mb-3 text-amber-900">💝 Have a Coupon Code?</h4>
                
                {/* AVAILABLE COUPONS DISPLAY */}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mb-4 pb-4 border-b border-amber-200">
                    <p className="text-sm text-amber-800 font-medium mb-2">✨ Available Offers:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableCoupons.slice(0, 4).map((coupon) => (
                        <button
                          key={coupon.id}
                          type="button"
                          onClick={() => applyCouponQuick(coupon)}
                          disabled={validatingCoupon}
                          className="p-2 text-left text-xs sm:text-sm bg-white border border-amber-300 rounded-lg hover:bg-amber-100 hover:border-amber-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="font-semibold text-amber-900">{coupon.code}</div>
                          <div className="text-amber-700">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}% off` 
                              : `₹${coupon.discount_value} off`}
                          </div>
                          {coupon.description && (
                            <div className="text-xs text-amber-600 mt-1">{coupon.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {appliedCoupon ? (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-green-700">✓ Coupon Applied</p>
                        <p className="text-sm text-green-600">{appliedCoupon.code}</p>
                        {appliedCoupon.description && (
                          <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-green-800 font-semibold text-sm"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="flex justify-between font-semibold text-green-700">
                        <span>Discount Saved</span>
                        <span>-₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                      disabled={validatingCoupon}
                    />
                    <button
                      type="button"
                      onClick={validateCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:bg-gray-400 transition"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* ORDER ITEMS */}
              {cartItems.map((item) => (
                <div key={item.id} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                  {item.discount > 0 ? (
                    <>
                      <div className="text-sm text-slate-600">MRP: ₹{Number(item.price).toLocaleString('en-IN')}</div>
                      <div className="text-sm text-slate-600">Discount: {item.discount}%</div>
                      <div className="text-sm font-semibold text-amber-600">Final Price: ₹{getDiscountedPrice(item).toFixed(2)}</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-600">Price: ₹{Number(item.price).toLocaleString('en-IN')}</div>
                  )}
                </div>
              ))}
              
              {/* PRICE BREAKDOWN */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 space-y-2">
                {(() => {
                    const originalTotal = cartItems.reduce((sum, item) => {
                      const discount = item.discount || 0;
                      const originalPrice = discount > 0 ? item.price / (1 - discount / 100) : item.price;
                      return sum + originalPrice * item.quantity;
                    }, 0);
                    const discountAmount = originalTotal - total;
                    
                    return (
                      <>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm bg-green-50 p-2 rounded text-green-700 font-medium mb-3">
                            <span>Product Discount</span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {couponDiscount > 0 && (
                          <div className="flex justify-between text-sm bg-blue-50 p-2 rounded text-blue-700 font-medium mb-3">
                            <span>Coupon Discount</span>
                            <span>-₹{couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2">
                          <span>Subtotal</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                        {couponDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>After Coupon</span>
                            <span>₹{(total - couponDiscount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-amber-700 pt-2 border-t border-slate-200">
                          <span>Total Amount</span>
                          <span>₹{payableTotal.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;
