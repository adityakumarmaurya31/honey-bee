const pool = require('../db.js');

const getProductImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('/uploads')) {
    return `${req.protocol}://${req.get('host')}${imagePath}`;
  }
  return imagePath;
};

const getProducts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const [products] = await pool.query(
      'SELECT id, name, price, COALESCE(discount, 0) as discount, description, stock, image, created_at FROM products ORDER BY created_at DESC'
    );
    const result = products.map((product) => ({
      ...product,
      image: getProductImageUrl(req, product.image),
    }));
    res.json(result);
  } catch (error) {
    console.error('Product fetch error:', error.message);
    // Return empty array if database not available (graceful fallback)
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      return res.json([]);
    }
    res.status(500).json({ message: 'Unable to load products', error: error.message });
  }
};

module.exports = { getProducts };
