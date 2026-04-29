const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'honeybee_secret';

const getDatabaseErrorMessage = (error) => {
  if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'Database credentials are invalid. Update backend/.env and restart the backend.';
  }

  if (error?.code === 'ECONNREFUSED') {
    return 'MySQL is not running. Start MySQL and try again.';
  }

  return 'Database unavailable. Check the backend database configuration.';
};

const getProductImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('/uploads')) {
    return `${req.protocol}://${req.get('host')}${imagePath}`;
  }
  return imagePath;
};

const normalizeTrackingNumber = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed || null;
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      // Only allow users with 'admin' role to login
      const [rows] = await pool.query(
        'SELECT id, name, email, password, role FROM users WHERE email = ? AND role = ?',
        [email, 'admin']
      );

      const adminUser = rows[0];
      if (!adminUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, user: { id: adminUser.id, name: adminUser.name, email: adminUser.email } });
    } catch (dbError) {
      // If database fails, reject login
      console.warn('Database login failed:', dbError.message);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(503).json({ message: getDatabaseErrorMessage(error) });
  }
};

const dashboardStats = async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalRevenue }]] = await pool.query('SELECT IFNULL(SUM(total), 0) AS totalRevenue FROM orders');

    res.json({
      totalProducts: Number(totalProducts) || 0,
      totalOrders: Number(totalOrders) || 0,
      totalUsers: Number(totalUsers) || 0,
      totalRevenue: Number(totalRevenue) || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load dashboard stats' });
  }
};

const getProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT id, name, price, COALESCE(discount, 0) as discount, description, stock, image, created_at FROM products ORDER BY created_at DESC'
    );
    const result = products.map((product) => ({
      ...product,
      image: getProductImageUrl(req, product.image),
    }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, description, stock, discount } = req.body;
    if (!name || !price || !description || !stock) {
      return res.status(400).json({ message: 'All product fields are required' });
    }

    const discountValue = discount ? Math.min(Math.max(parseFloat(discount), 0), 100) : 0;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO products (name, price, description, stock, discount, image) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, description, stock, discountValue, imagePath]
    );

    const [createdRows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(createdRows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock, discount } = req.body;
    const productQuery = 'SELECT * FROM products WHERE id = ?';
    const [[existingProduct]] = await pool.query(productQuery, [id]);

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const discountValue = discount !== undefined ? Math.min(Math.max(parseFloat(discount), 0), 100) : (existingProduct.discount || 0);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : existingProduct.image;
    await pool.query(
      'UPDATE products SET name = ?, price = ?, description = ?, stock = ?, discount = ?, image = ? WHERE id = ?',
      [name || existingProduct.name, price || existingProduct.price, description || existingProduct.description, stock || existingProduct.stock, discountValue, imagePath, id]
    );

    const [[updated]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete product' });
  }
};

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email, o.status, o.total, o.created_at,
              o.address, o.city, o.state, o.pincode, o.phone, o.paymentMethod,
              o.trackingNumber, o.trackingAssignedAt, o.coupon_discount
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];
    const [itemsRows] = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.image AS product_image, COALESCE(p.discount, 0) AS discount
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const result = {
      ...order,
      items: itemsRows.map(item => ({
        ...item,
        product_image: item.product_image ? getProductImageUrl(req, item.product_image) : null,
      })),
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    if (!['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
    if (status === 'Shipped' && !normalizedTrackingNumber) {
      return res.status(400).json({ message: 'Tracking number is required before marking an order as shipped' });
    }

    if (normalizedTrackingNumber) {
      const [existingOrders] = await pool.query(
        'SELECT id FROM orders WHERE trackingNumber = ? AND id <> ? LIMIT 1',
        [normalizedTrackingNumber, id]
      );

      if (existingOrders.length > 0) {
        return res.status(400).json({ message: 'Tracking number is already assigned to another order' });
      }
    }

    await pool.query(
      `UPDATE orders
       SET status = ?,
           trackingNumber = ?,
           trackingAssignedAt = CASE
             WHEN ? IS NULL THEN NULL
             WHEN trackingNumber <> ? OR trackingAssignedAt IS NULL THEN CURRENT_TIMESTAMP
             ELSE trackingAssignedAt
           END
       WHERE id = ?`,
      [status, normalizedTrackingNumber, normalizedTrackingNumber, normalizedTrackingNumber, id]
    );

    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update order status' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load users' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete user' });
  }
};

const getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email, o.status, o.total, o.paymentMethod,
              o.trackingNumber, o.trackingAssignedAt, o.created_at, o.coupon_discount
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load orders' });
  }
};

module.exports = {
  login,
  dashboardStats,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrder,
  updateOrderStatus,
  getUsers,
  deleteUser,
};
