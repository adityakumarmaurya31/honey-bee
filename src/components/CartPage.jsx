import React from 'react';
import { useNavigate } from 'react-router-dom';

function CartPage({ cartItems, onIncrease, onDecrease, onClear }) {
  const navigate = useNavigate();

  const getDiscountedPrice = (item) => {
    const discount = Number(item.discount) || 0;
    return Number(item.price) * (1 - discount / 100);
  };

  const originalTotal = cartItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  const discountedTotal = cartItems.reduce((sum, item) => {
    return sum + getDiscountedPrice(item) * item.quantity;
  }, 0);

  const totalDiscount = originalTotal - discountedTotal;

  return (
    <section className="section">
      <div className="section-header">
        <h2>Your Cart</h2>
        <p>Review the items you have added.</p>
      </div>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-size">{item.size}</p>
                  {item.discount && item.discount > 0 ? (
                    <>
                      <p className="text-xs font-semibold text-green-700">Save {item.discount}%</p>
                      <p className="cart-item-price text-slate-400 line-through">
                        ₹{Number(item.price).toFixed(2)}
                      </p>
                      <p className="cart-item-price text-amber-600">
                        ₹{getDiscountedPrice(item).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="cart-item-price">₹{Number(item.price).toFixed(2)}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    Item Total: ₹{(getDiscountedPrice(item) * item.quantity).toFixed(2)}
                  </p>
                  <div className="cart-item-actions">
                    <button onClick={() => onDecrease(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onIncrease(item.id)}>+</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="cart-summary">
            {totalDiscount > 0 && (
              <p>
                <strong>Discount:</strong> -₹{totalDiscount.toFixed(2)}
              </p>
            )}
            <p>
              <strong>Total:</strong> ₹{discountedTotal.toFixed(2)}
            </p>
            <div className="cart-summary-actions">
              <button className="btn btn-outline" onClick={onClear}>
                Clear Cart
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/checkout')}
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default CartPage;
