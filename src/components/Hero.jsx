import React from "react";

function Hero() {
  return (
    <section className="hero">
      <div className="bee bee1">🐝</div>
      <div className="bee bee2">🐝</div>
      <div className="bee bee3">🐝</div>
      <div className="butterfly butterfly1">🦋</div>
      <div className="butterfly butterfly2">🦋</div>

      <div className="hero-content">
        <h1>Natural Raw Honey : Bee To Bottle</h1>

        <p>
          Experience pure, aromatic honey crafted from carefully nurtured
          orchards, straight from the hive to your home.
        </p>

        <div className="hero-actions">
          <a href="/products" className="btn btn-primary">Shop Honey</a>
          <a href="/about" className="btn btn-outline">Know Our Story</a>
        </div>

        <div className="hero-badges">
          <span>100% Pure</span>
          <span>Crafted in Prayagraj</span>
        </div>
      </div>

      <div className="hero-image-wrapper">
        <img
          src="/hero-honey.jpg"
          alt="Honey jars"
          className="hero-image"
        />
      </div>
    </section>
  );
}

export default Hero;
