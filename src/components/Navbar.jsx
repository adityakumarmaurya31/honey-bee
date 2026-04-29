import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function Navbar({ cartCount = 0 }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <Link to="/">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="Saumya Honey logo" className="logo" />
            <div className="brand-text">
              <span className="brand-name">Saumya Honey</span>
              <span className="brand-tagline">Pure Raw Honey Collection</span>
            </div>
          </div>
        </Link>
      </div>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
        <NavLink to="/my-orders">My Orders</NavLink>
        <NavLink to="/enquiry">Quick Enquiry</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/cart" className="cart-link">
          Cart
          {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
        </NavLink>
        <NavLink to="/admin/login" style={{ color: '#ff6b00', fontWeight: 'bold' }}>Admin</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;


