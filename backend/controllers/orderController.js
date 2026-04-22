const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../db.js');

const GST_RATE = 0.05;
const CHECKOUT_TOKEN_TTL_MS = 30 * 60 * 1000;

const getDiscountedUnitPrice = (product) => {
  const price = Number(product.price);
  const discount = Number(product.discount) || 0;
  return Number((price * (1 - discount / 100)).toFixed(2));
};

const getPayableTotal = (subtotal) => Number((subtotal * (1 + GST_RATE)).toFixed(2));
const normalizeTrackingNumber = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed || null;
};

const getCheckoutTokenSecret = () => process.env.CHECKOUT_TOKEN_SECRET || process.env.JWT_SECRET || 'honeybee_checkout_secret';

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
};

const getRazorpayInstance = () => {
  const credentials = getRazorpayCredentials();
  if (!credentials) {
    return null;
  }

  return new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item) => ({
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
  }));
};

const validateCustomerFields = ({ name, email, phone, address, city, state, pincode }) => {
  if (!name || !email || !phone || !address || !city || !state || !pincode) {
    return false;
  }
  
  // Validate phone: only digits, minimum 10 digits
  if (!/^\d{10,}$/.test(phone.toString().trim())) {
    return false;
  }
  
  return true;
};

const fetchProductsMap = async (productIds) => {
  const uniqueIds = [...new Set(productIds)];
  const [products] = await pool.query(
    'SELECT id, price, stock, COALESCE(discount, 0) AS discount FROM products WHERE id IN (?)',
    [uniqueIds]
  );

  return new Map(products.map((product) => [Number(product.id), product]));
};

const buildPricedItems = async (rawItems) => {
  const items = normalizeItems(rawItems);
  if (!items.length) {
    return { error: 'Cart items are required' };
  }

  if (items.some((item) => !Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    return { error: 'Cart items are invalid' };
  }

  const productMap = await fetchProductsMap(items.map((item) => item.product_id));
  const pricedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return { error: `Product not found: ${item.product_id}` };
    }

    if (Number(product.stock) < item.quantity) {
      return { error: `Not enough stock for product ${item.product_id}` };
    }

    const unitPrice = getDiscountedUnitPrice(product);
    pricedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unitPrice,
    });
    subtotal += unitPrice * item.quantity;
  }

  return {
    pricedItems,
    subtotal: Number(subtotal.toFixed(2)),
  };
};

const signCheckoutToken = (payload) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getCheckoutTokenSecret())
    .update(encodedPayload)
    .digest('hex');

  return `${encodedPayload}.${signature}`;
};

const verifyCheckoutToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Checkout session is invalid');
  }

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', getCheckoutTokenSecret())
    .update(encodedPayload)
    .digest('hex');

  if (signature.length !== expectedSignature.length || !/^[a-f0-9]+$/i.test(signature)) {
    throw new Error('Checkout session could not be verified');
  }

  const signatureIsValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!signatureIsValid) {
    throw new Error('Checkout session could not be verified');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (!payload.createdAt || Date.now() - Number(payload.createdAt) > CHECKOUT_TOKEN_TTL_MS) {
    throw new Error('Checkout session has expired. Please try again.');
  }

  return payload;
};

const findOrCreateUser = async (name, email) => {
  const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUsers.length > 0) {
    return existingUsers[0].id;
  }

  const passwordHash = await bcrypt.hash(Date.now().toString(), 10);
  const [userResult] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, 'user']
  );

  return userResult.insertId;
};

const persistOrder = async ({
  name,
  email,
  phone,
  address,
  city,
  state,
  pincode,
  paymentMethod,
  pricedItems,
  subtotal,
  coupon_id = null,
  coupon_discount = 0,
}) => {
  const userId = await findOrCreateUser(name, email);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [products] = await connection.query(
      'SELECT id, stock FROM products WHERE id IN (?) FOR UPDATE',
      [[...new Set(pricedItems.map((item) => item.product_id))]]
    );
    const stockMap = new Map(products.map((product) => [Number(product.id), Number(product.stock)]));

    for (const item of pricedItems) {
      const currentStock = stockMap.get(item.product_id);
      if (currentStock === undefined) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total, status, address, city, state, pincode, phone, paymentMethod, coupon_id, coupon_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, subtotal, 'Pending', address, city, state, pincode, phone, paymentMethod, coupon_id, coupon_discount]
    );

    const orderId = orderResult.insertId;
    const orderItemsData = pricedItems.map((item) => [orderId, item.product_id, item.quantity, item.unitPrice]);

    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [orderItemsData]
    );

    for (const item of pricedItems) {
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    return { orderId, userId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createOrder = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode, paymentMethod, items, coupon_id, coupon_discount } = req.body;

    if (!validateCustomerFields({ name, email, phone, address, city, state, pincode })) {
      return res.status(400).json({ message: 'All order fields are required' });
    }

    if (paymentMethod && paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Use online checkout for UPI, cards, and wallets' });
    }

    const pricing = await buildPricedItems(items);
    if (pricing.error) {
      return res.status(400).json({ message: pricing.error });
    }

    const { orderId } = await persistOrder({
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      paymentMethod: 'COD',
      pricedItems: pricing.pricedItems,
      subtotal: pricing.subtotal,
      coupon_id: coupon_id || null,
      coupon_discount: coupon_discount || 0,
    });

    res.status(201).json({ orderId, total: pricing.subtotal, status: 'Pending' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Unable to create order' });
  }
};

const createPaymentOrder = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode, items, coupon_id, coupon_discount } = req.body;

    if (!validateCustomerFields({ name, email, phone, address, city, state, pincode })) {
      return res.status(400).json({ message: 'All checkout fields are required' });
    }

    const razorpay = getRazorpayInstance();
    const credentials = getRazorpayCredentials();
    if (!razorpay || !credentials) {
      return res.status(503).json({
        message: 'Online payment is not configured yet. Add Razorpay keys in the backend environment.',
      });
    }

    const pricing = await buildPricedItems(items);
    if (pricing.error) {
      return res.status(400).json({ message: pricing.error });
    }

    const payableTotal = getPayableTotal(pricing.subtotal);
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(payableTotal * 100),
      currency: 'INR',
      receipt: `hb_${Date.now()}`,
      notes: {
        customer_email: email,
        customer_phone: phone,
      },
    });

    const checkoutToken = signCheckoutToken({
      createdAt: Date.now(),
      razorpayOrderId: razorpayOrder.id,
      customer: { name, email, phone, address, city, state, pincode },
      pricedItems: pricing.pricedItems,
      subtotal: pricing.subtotal,
      payableTotal,
      coupon_id: coupon_id || null,
      coupon_discount: coupon_discount || 0,
    });

    res.status(201).json({
      keyId: credentials.keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      checkoutToken,
      customer: { name, email, phone },
      totals: {
        subtotal: pricing.subtotal,
        payableTotal,
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Unable to start online payment' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutToken } = req.body;
    const credentials = getRazorpayCredentials();

    if (!credentials) {
      return res.status(503).json({ message: 'Online payment is not configured yet' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !checkoutToken) {
      return res.status(400).json({ message: 'Payment verification details are required' });
    }

    const checkoutData = verifyCheckoutToken(checkoutToken);
    if (checkoutData.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Payment session does not match this order' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', credentials.keySecret)
      .update(`${checkoutData.razorpayOrderId}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const { customer, pricedItems, subtotal, coupon_id, coupon_discount } = checkoutData;
    const { orderId } = await persistOrder({
      ...customer,
      paymentMethod: 'Online (Paid via Razorpay)',
      pricedItems,
      subtotal,
      coupon_id: coupon_id || null,
      coupon_discount: coupon_discount || 0,
    });

    res.status(201).json({
      orderId,
      total: subtotal,
      status: 'Pending',
      paymentId: razorpay_payment_id,
      paymentMethod: 'Online (Paid via Razorpay)',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    const statusCode = /invalid|expired|verify|match|stock|found/i.test(error.message) ? 400 : 500;
    res.status(statusCode).json({ message: error.message || 'Unable to verify payment' });
  }
};

const getOrderItemsForOrder = async (req, orderId) => {
  const [items] = await pool.query(
    `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name AS product_name, p.image AS product_image, COALESCE(p.discount, 0) AS discount
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return items.map((item) => ({
    ...item,
    product_image: item.product_image ? `${req.protocol}://${req.get('host')}${item.product_image}` : null,
  }));
};

const getUserOrders = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total, o.created_at,
              o.address, o.city, o.state, o.pincode, o.phone, o.paymentMethod,
              o.trackingNumber, o.trackingAssignedAt, o.coupon_discount,
              u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE u.email = ?
       ORDER BY o.created_at DESC`,
      [email]
    );

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        return {
          ...order,
          items: await getOrderItemsForOrder(req, order.id),
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load orders' });
  }
};

const trackOrderByTrackingNumber = async (req, res) => {
  try {
    const trackingNumber = normalizeTrackingNumber(req.query.trackingNumber);
    if (!trackingNumber) {
      return res.status(400).json({ message: 'Tracking number is required' });
    }

    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at, o.address, o.city, o.state, o.pincode, o.phone,
              o.paymentMethod, o.trackingNumber, o.trackingAssignedAt, o.coupon_discount,
              u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.trackingNumber = ?
       LIMIT 1`,
      [trackingNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No order found for this tracking number' });
    }

    const order = orders[0];
    res.json({
      ...order,
      items: await getOrderItemsForOrder(req, order.id),
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Unable to track order right now' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!id || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    // Verify order exists and belongs to the user
    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.total
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND u.email = ?`,
      [id, email]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found or does not match your email' });
    }

    const order = orders[0];

    // Only allow cancellation if order is in Pending status
    if (order.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot cancel ${order.status} order. Only Pending orders can be cancelled.` });
    }

    // Get order items to restore stock
    const [orderItems] = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

    // Restore stock for all items
    for (const item of orderItems) {
      await pool.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status to Cancelled
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['Cancelled', id]
    );

    res.json({ message: 'Order cancelled successfully', status: 'Cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Unable to cancel order. Please try again.' });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!id || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    // Verify order exists and belongs to the user
    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.total
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND u.email = ?`,
      [id, email]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found or does not match your email' });
    }

    const order = orders[0];

    // Only allow return if order is in Delivered status
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: `Cannot return ${order.status} order. Only Delivered orders can be returned.` });
    }

    // Get order items to restore stock
    const [orderItems] = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

    // Restore stock for all items
    for (const item of orderItems) {
      await pool.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Update order status to Returned
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['Returned', id]
    );

    res.json({ message: 'Order returned successfully', status: 'Returned' });
  } catch (error) {
    console.error('Return order error:', error);
    res.status(500).json({ message: 'Unable to return order. Please try again.' });
  }
};

const verifyUPI = async (req, res) => {
  try {
    const { transactionId, amount, name, email, phone, address, city, state, pincode, items, coupon_id, coupon_discount, upiId } = req.body;

    console.log('🔍 verifyUPI - Received:', { transactionId, amount, items, name, email });

    // Validate required fields
    if (!transactionId || !amount || !name || !email || !phone) {
      return res.status(400).json({ message: 'Transaction details are required' });
    }

    // Validate transaction ID format (basic validation)
    if (typeof transactionId !== 'string' || transactionId.trim().length < 5) {
      return res.status(400).json({ message: 'Invalid transaction ID format' });
    }

    // Validate amount is a positive number
    const validatedAmount = Number(amount);
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Build priced items from raw items (fetch prices from DB)
    const buildResult = await buildPricedItems(items || []);
    console.log('🔨 buildPricedItems result:', buildResult);
    
    const { pricedItems, subtotal, error } = buildResult;
    if (error) {
      console.log('❌ buildPricedItems error:', error);
      return res.status(400).json({ message: error });
    }

    console.log('✅ pricedItems:', pricedItems);

    // Create order with UPI payment method
    const { orderId, total } = await persistOrder({
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      paymentMethod: 'UPI (Manual Verification)',
      pricedItems,
      subtotal,
      coupon_id: coupon_id || null,
      coupon_discount: coupon_discount || 0,
    });

    // Log UPI payment for records
    console.log(`✅ UPI Payment Verified - Order #${orderId}, Transaction: ${transactionId}, Amount: ₹${validatedAmount}, UPI ID: ${upiId}`);

    res.status(201).json({
      orderId,
      total: subtotal,
      status: 'Pending',
      transactionId,
      paymentMethod: 'UPI',
      message: `Payment verified! Order #${orderId} has been created successfully`,
    });
  } catch (error) {
    console.error('❌ UPI verification error:', error);
    const statusCode = /invalid|not found|already exists/i.test(error.message) ? 400 : 500;
    res.status(statusCode).json({ message: error.message || 'Unable to verify UPI payment' });
  }
};

module.exports = {
  createOrder,
  createPaymentOrder,
  verifyPayment,
  verifyUPI,
  getUserOrders,
  trackOrderByTrackingNumber,
  cancelOrder,
  returnOrder,
};
