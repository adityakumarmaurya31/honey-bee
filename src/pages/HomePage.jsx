import React from 'react';
import Hero from '../components/Hero.jsx';
import ProductList from '../components/ProductList.jsx';
import About from '../components/About.jsx';


function HomePage({ onAddToCart }) {
  return (
    <>
      <section id="home">
        <Hero />
      </section>
      <section>
        <ProductList onAddToCart={onAddToCart} limit={3} showViewAllLink />
      </section>
      <section>
        <About />
      </section>
      
    </>
  );
}

export default HomePage;
