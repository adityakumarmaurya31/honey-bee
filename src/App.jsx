 import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartPage from './components/CartPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import QuickEnquiry from './pages/QuickEnquiry.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import UserInvoice from './pages/UserInvoice.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Products from './admin/Products.jsx';
import Orders from './admin/Orders.jsx';
import Users from './admin/Users.jsx';
import Enquiries from './admin/Enquiries.jsx';
import Gallery from './admin/Gallery.jsx';
import Invoice from './admin/Invoice.jsx';
import Coupons from './admin/Coupons.jsx';

function App() {
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartCount={cartCount} />
      <main>
        <Routes>
          <Route
            path="/"
            element={<HomePage onAddToCart={handleAddToCart} />}
          />
          <Route
            path="/products"
            element={<ProductsPage onAddToCart={handleAddToCart} />}
          />
          <Route path="/about" element={<AboutPage />} />
        
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onClear={clearCart}
              />
            }
          />
          <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} onClear={clearCart} />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/invoice/:orderId" element={<UserInvoice />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/enquiry" element={<QuickEnquiry />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="invoice/:orderId" element={<Invoice />} />
            <Route path="users" element={<Users />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="coupons" element={<Coupons />} />
          </Route>
        </Routes>
       </main>
      <Footer />
    </>
  );
}

export default App;


