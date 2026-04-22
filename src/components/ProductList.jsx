import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../admin/api.js';

function ProductList({ onAddToCart, limit, showViewAllLink = false }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (!response.ok) {
          setError('Unable to load products');
          return;
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError('Unable to connect to product server');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const list = limit ? products.slice(0, limit) : products;

  const handleBuyNow = (item) => {
    if (onAddToCart) {
      onAddToCart(item);
    }
    navigate('/checkout');
  };

  return (
    <section>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-600">Loading products…</p>
      ) : (
        <>
          <div className="product-grid">
            {list.map((item) => (
              <article key={item.id} className="product-card">
                <div className="product-image-wrapper">
                  <img
                    src={item.image?.startsWith('/uploads') ? `${API_BASE}${item.image}` : item.image}
                    alt={item.name}
                    className="product-image"
                  />
                  {item.stock === 0 && (
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      OUT OF STOCK
                    </span>
                  )}
                  {item.badge && <span className="product-badge">{item.badge}</span>}
                </div>
                <div className="product-body">
                  <h3>{item.name}</h3>
                  <p className="product-size">{item.size}</p>
                  <p className="product-description">{item.description}</p>
                  {item.origin && (
                    <p className="product-meta">
                      <strong>Origin:</strong> {item.origin}
                    </p>
                  )}
                  {item.benefits && (
                    <p className="product-meta">
                      <strong>Benefits:</strong> {item.benefits}
                    </p>
                  )}
                  {item.stockStatus && <p className="product-stock">{item.stockStatus}</p>}
                  {item.stock === 0 && (
                    <p className="text-sm font-semibold text-red-600 mb-2">📦 Out of Stock</p>
                  )}
                  <div className="product-footer">
                    {item.discount && item.discount > 0 ? (
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded w-fit">-{item.discount}%</span>
                        <div className="flex items-center gap-2">
                          <span className="product-price line-through text-slate-400">₹{Number(item.price).toLocaleString('en-IN')}</span>
                          <span className="product-price text-amber-600">₹{(item.price * (1 - item.discount / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <span className="product-price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-small"
                        disabled={item.stock === 0}
                        onClick={() => onAddToCart && onAddToCart(item)}
                        style={{ opacity: item.stock === 0 ? 0.6 : 1, cursor: item.stock === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        Add to Cart
                      </button>
                      <button
                        className="btn btn-small btn-outline"
                        disabled={item.stock === 0}
                        onClick={() => handleBuyNow(item)}
                        style={{ opacity: item.stock === 0 ? 0.6 : 1, cursor: item.stock === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {showViewAllLink && (
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <Link to="/products" className="btn btn-outline">
                View All Products
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ProductList;



