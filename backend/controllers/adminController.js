const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

dotenv.config();

// Configure S3 client if environment variables are present
let s3Client = null;
if (process.env.AWS_S3_BUCKET) {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
  });
}

const uploadBufferToS3 = async (buffer, originalName, mimeType, folder = 'products') => {
  if (!s3Client) throw new Error('S3 client not configured');
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${sanitized}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read'
  };
  await s3Client.send(new PutObjectCommand(params));
  const region = process.env.AWS_S3_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const saveUploadedImage = async (file, folder = 'products') => {
  if (!file) {
    return null;
  }

  if (process.env.AWS_S3_BUCKET) {
    return uploadBufferToS3(file.buffer, file.originalname, file.mimetype, folder);
  }

  if (process.env.VERCEL) {
    const error = new Error('Image upload storage is not configured. Use the Render backend URL or set AWS_S3_BUCKET for Vercel uploads.');
    error.statusCode = 503;
    throw error;
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

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
  // Return just the path - frontend will handle URL construction
  // This ensures the path is consistent whether called from different domains
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads')) {
    return imagePath;
  }
  // If it starts with /, it's a public static path (like /hero-honey.jpg from public/ folder)
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  // Otherwise, treat as filename and add /uploads/ prefix (legacy support)
  return `/uploads/${imagePath}`;
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
    console.log('[LOGIN] Attempt for email:', email);
    console.log('[LOGIN] Request body:', { email, password: password ? 'provided' : 'missing' });
    
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      // Only allow users with 'admin' role to login
      console.log('[LOGIN] Querying for admin user with email:', email);
      const [rows] = await pool.query(
        'SELECT id, name, email, password, role FROM users WHERE email = ? AND role = ?',
        [email, 'admin']
      );

      console.log('[LOGIN] Query returned', rows.length, 'rows');
      if (rows.length > 0) {
        console.log('[LOGIN] Admin user found:', rows[0].email, 'with role:', rows[0].role);
      }
      
      const adminUser = rows[0];
      if (!adminUser) {
        console.log('[LOGIN] No admin user found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('[LOGIN] Admin user found, comparing password');
      console.log('[LOGIN] Stored password hash (first 20 chars):', adminUser.password.substring(0, 20));
      
      // Use bcrypt for password comparison
      const isMatch = await bcrypt.compare(password, adminUser.password);
      console.log('[LOGIN] bcrypt.compare result:', isMatch);
      
      if (!isMatch) {
        console.log('[LOGIN] Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('[LOGIN] Password matched, generating token');
      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      console.log('[LOGIN] Token generated successfully for:', adminUser.email);
      res.json({ token, user: { id: adminUser.id, name: adminUser.name, email: adminUser.email } });
    } catch (dbError) {
      // If database fails, reject login
      console.error('[LOGIN] Database error:', dbError.message);
      console.error('[LOGIN] Database error stack:', dbError.stack);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('[LOGIN] Unexpected error:', error);
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
    
    console.log('[createProduct] Request - File:', req.file?.originalname || req.file?.filename);
    console.log('[createProduct] Request - Files:', Array.isArray(req.files) ? req.files.map((file) => file.fieldname) : []);
    console.log('[createProduct] Body:', { name, price, description, stock, discount });

    // Validate all required fields
    if (!name || name.toString().trim() === '' || !price || !description || description.toString().trim() === '' || !stock) {
      return res.status(400).json({ 
        message: 'Name, price, description, stock, and image are all required',
        received: { name, price, description, stock, file: req.file?.filename }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Image file is required. Please choose an image again and submit.',
        receivedFileFields: Array.isArray(req.files) ? req.files.map((file) => file.fieldname) : [],
      });
    }

    // Parse and validate numeric values
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedDiscount = discount !== undefined && discount !== '' && discount !== null ? parseFloat(discount) : 0;

    console.log('[createProduct] Parsed values - Price:', parsedPrice, 'Stock:', parsedStock, 'Discount:', parsedDiscount);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
    }

    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return res.status(400).json({ message: 'Discount must be between 0 and 100' });
    }

    let imagePath = null;
    try {
      imagePath = await saveUploadedImage(req.file, 'products');
    } catch (e) {
      console.error('[createProduct] Image upload failed:', e);
      return res.status(e.statusCode || 500).json({ message: e.message || 'Failed to upload image' });
    }
    console.log('[createProduct] Image path:', imagePath);
    
    // Insert the product
    const insertQuery = 'INSERT INTO products (name, price, description, stock, discount, image) VALUES (?, ?, ?, ?, ?, ?)';
    const insertParams = [
      name.toString().trim(),
      parsedPrice,
      description.toString().trim(),
      parsedStock,
      parsedDiscount,
      imagePath
    ];
    
    console.log('[createProduct] Executing insert with params:', { name: insertParams[0], price: insertParams[1], stock: insertParams[3] });
    
    const [result] = await pool.query(insertQuery, insertParams);

    if (!result.insertId) {
      console.error('[createProduct] Insert failed: No insertId returned');
      return res.status(500).json({ message: 'Product creation failed: Unable to insert product' });
    }

    console.log('[createProduct] Insert successful - new ID:', result.insertId);

    // Fetch the created product
    const [createdRows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    if (!createdRows || createdRows.length === 0) {
      console.error('[createProduct] Product not found after insertion, id:', result.insertId);
      return res.status(500).json({ message: 'Product creation failed: Unable to retrieve created product' });
    }

    const product = createdRows[0];
    console.log('[createProduct] Product from DB - image:', product.image);
    
    if (product.image) {
      product.image = getProductImageUrl(req, product.image);
    }

    console.log('[createProduct] Success - created product:', product.id, product.name, 'image:', product.image);
    console.log('[createProduct] Full response:', JSON.stringify(product));
    res.status(201).json(product);
    
  } catch (error) {
    console.error('[createProduct] Caught error:', error.message);
    console.error('[createProduct] Error code:', error.code);
    console.error('[createProduct] Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Unable to create product';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Product name already exists';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database schema mismatch - contact administrator';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message,
      code: error.code
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, price, description, stock, discount } = req.body;
    
    console.log('[updateProduct] Request - ID:', id, 'File:', req.file?.filename);
    console.log('[updateProduct] Body keys:', Object.keys(req.body));
    console.log('[updateProduct] Body:', { name, price, description, stock, discount });

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Trim strings to handle whitespace
    if (typeof name === 'string') name = name.trim();
    if (typeof description === 'string') description = description.trim();

    // Validate that required fields are provided and not empty
    if (!name || name === '' || !price || price === '' || !description || description === '' || !stock || stock === '') {
      console.log('[updateProduct] Validation failed - missing fields');
      return res.status(400).json({ 
        message: 'Name, price, description, and stock are all required',
        received: { name, price, description, stock }
      });
    }

    // Check if product exists
    const [existingProducts] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (!existingProducts || existingProducts.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingProduct = existingProducts[0];
    console.log('[updateProduct] Found existing product:', existingProduct.id, existingProduct.name);
    
    // Parse and validate numeric values
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedDiscount = discount !== undefined && discount !== '' && discount !== null ? parseFloat(discount) : 0;
    
    console.log('[updateProduct] Parsed values - Price:', parsedPrice, 'Stock:', parsedStock, 'Discount:', parsedDiscount);
    
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }
    
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Stock must be a valid non-negative number' });
    }
    
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return res.status(400).json({ message: 'Discount must be between 0 and 100' });
    }

    let imagePath = existingProduct.image;
    if (req.file) {
      try {
        imagePath = await saveUploadedImage(req.file, 'products');
      } catch (e) {
        console.error('[updateProduct] Image upload failed:', e);
        return res.status(e.statusCode || 500).json({ message: e.message || 'Failed to upload image' });
      }
    }
    console.log('[updateProduct] Image handling - new file:', !!req.file, 'path:', imagePath);
    
    // Update the product
    const updateQuery = 'UPDATE products SET name = ?, price = ?, description = ?, stock = ?, discount = ?, image = ? WHERE id = ?';
    const updateParams = [
      name,
      parsedPrice,
      description,
      parsedStock,
      parsedDiscount,
      imagePath,
      id
    ];
    
    console.log('[updateProduct] Executing update query with params:', updateParams);
    
    const [updateResult] = await pool.query(updateQuery, updateParams);
    console.log('[updateProduct] Update result - affected rows:', updateResult.affectedRows);

    if (updateResult.affectedRows === 0) {
      console.error('[updateProduct] No rows affected by update');
      return res.status(500).json({ message: 'Failed to update product' });
    }

    // Fetch updated product
    const [updatedProducts] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!updatedProducts || updatedProducts.length === 0) {
      console.error('[updateProduct] Product not found after update, id:', id);
      return res.status(500).json({ message: 'Unable to retrieve updated product' });
    }

    const product = updatedProducts[0];
    console.log('[updateProduct] Product from DB - id:', product.id, 'image:', product.image);
    
    if (product.image) {
      product.image = getProductImageUrl(req, product.image);
    }

    console.log('[updateProduct] Success - updated product:', product.id, product.name, 'image:', product.image);
    res.status(200).json(product);
    
  } catch (error) {
    console.error('[updateProduct] Caught error:', error.message);
    console.error('[updateProduct] Error code:', error.code);
    console.error('[updateProduct] Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Unable to update product';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Product name already exists';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database schema mismatch - contact administrator';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      code: error.code 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Check if product exists first
    const [existingProducts] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!existingProducts || existingProducts.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete the product
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to delete product' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[deleteProduct] Error:', error.message);
    console.error('[deleteProduct] Error details:', error);
    res.status(500).json({ message: 'Unable to delete product', error: error.message });
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
