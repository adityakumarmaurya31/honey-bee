import React from 'react';
import ProductList from '../components/ProductList.jsx';

function ProductsPage({ onAddToCart }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>All Honey Products</h2>
        <p>Browse all Saumya Honey products with full details and easy buying.</p>
      </div>
      <ProductList onAddToCart={onAddToCart} />
    </section>
  );
}

export default ProductsPage;
