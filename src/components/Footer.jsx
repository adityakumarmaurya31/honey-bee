import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Saumya Honey. All rights reserved.</p>
      <p className="footer-mini">
        Inspired by Saumya Natural Raw Honey.
      </p>
    </footer>
  );
}

export default Footer;
