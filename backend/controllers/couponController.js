const pool = require('../db.js');

// Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const [coupons] = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    res.json(coupons);
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Unable to load coupons' });
  }
};

// Validate coupon code
const validateCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    const coupon = coupons[0];

    // Check if coupon is expired
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Check if coupon has usage limit
    if (coupon.usage_limit) {
      const [usageCount] = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?',
        [coupon.id]
      );

      if (usageCount[0].count >= coupon.usage_limit) {
        return res.status(400).json({ message: 'Coupon usage limit exceeded' });
      }
    }

    // Check minimum amount requirement
    if (coupon.min_amount && totalAmount < coupon.min_amount) {
      return res.status(400).json({
        message: `Minimum order amount ₹${coupon.min_amount} required for this coupon`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.min(
        (totalAmount * coupon.discount_value) / 100,
        coupon.max_discount || Infinity
      );
    } else {
      discount = coupon.discount_value;
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        description: coupon.description
      },
      discount: Math.round(discount * 100) / 100
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Unable to validate coupon' });
  }
};

// Create new coupon (admin only)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      description,
      expiry_date,
      usage_limit,
      min_amount,
      max_discount,
      is_active
    } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({
        message: 'Code, discount type, and discount value are required'
      });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }

    const [result] = await pool.query(
      `INSERT INTO coupons 
       (code, discount_type, discount_value, description, expiry_date, usage_limit, min_amount, max_discount, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        description || null,
        expiry_date || null,
        usage_limit || null,
        min_amount || null,
        max_discount || null,
        is_active !== false ? 1 : 0
      ]
    );

    res.status(201).json({
      id: result.insertId,
      code,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Unable to create coupon' });
  }
};

// Update coupon (admin only)
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      description,
      expiry_date,
      usage_limit,
      min_amount,
      max_discount,
      is_active
    } = req.body;

    const [result] = await pool.query(
      `UPDATE coupons SET 
       code = ?, discount_type = ?, discount_value = ?, description = ?,
       expiry_date = ?, usage_limit = ?, min_amount = ?, max_discount = ?, is_active = ?
       WHERE id = ?`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        description || null,
        expiry_date || null,
        usage_limit || null,
        min_amount || null,
        max_discount || null,
        is_active !== false ? 1 : 0,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Unable to update coupon' });
  }
};

// Delete coupon (admin only)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM coupons WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Unable to delete coupon' });
  }
};

// Apply coupon to order
const applyCouponToOrder = async (req, res) => {
  try {
    const { coupon_id, order_id } = req.body;

    const [result] = await pool.query(
      'INSERT INTO coupon_usage (coupon_id, order_id) VALUES (?, ?)',
      [coupon_id, order_id]
    );

    res.status(201).json({
      message: 'Coupon applied to order'
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Unable to apply coupon' });
  }
};

module.exports = {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCouponToOrder
};
