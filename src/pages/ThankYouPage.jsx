import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouPage.css';

function ThankYouPage() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Get orderId from query params or session storage
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    setOrderId(id);

    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="thank-you-container">
      <div className="thank-you-bubble">
        <div className="bubble-content">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
          
          <h1>Thank You!</h1>
          <p className="thank-you-message">
            Your order has been placed successfully 🎉
          </p>
          
          {orderId && (
            <div className="order-id-box">
              <p className="order-id-label">Order Number</p>
              <p className="order-id-value">#{orderId}</p>
            </div>
          )}
          
          <div className="thank-you-details">
            <p>📧 We've sent a confirmation email</p>
            <p>🚚 You can track your order from "My Orders"</p>
            <p>💛 Thank you for your purchase!</p>
          </div>

          <div className="thank-you-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/my-orders')}
            >
              View My Orders
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>

          <p className="redirect-text">Redirecting to home in a few seconds...</p>
        </div>

        {/* Decorative bubbles */}
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
      </div>
    </div>
  );
}

export default ThankYouPage;
