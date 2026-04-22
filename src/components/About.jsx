import React from 'react';

function About() {
  return (
    <section className="section about">
      <div className="about-text">
        <h2>About Saumya Honey</h2>
        <p>
          Saumya Honey is a small-batch honey brand focused on delivering pure, 
          orchard-sourced honey with honest flavours and natural goodness.
        </p>
        <p>
          Every jar is carefully filled, maintaining hygiene and quality so your family 
          can enjoy honey the way nature intended.
        </p>
        <ul className="about-list">
          <li>Orchard-sourced floral varieties.</li>
          <li>No added sugar or artificial colours.</li>
          <li>Prepared and packed with care in Prayagraj.</li>
        </ul>
      </div>
      <div className="about-highlight">
        <h3>From Saumya Farm to Spoon</h3>
        <p>
          Inspired by Saumya honey farms, the brand combines traditional care 
          with a modern, minimalist presentation ideal for gifting and daily use.
        </p>
      </div>
    </section>
  );
}

export default About;
