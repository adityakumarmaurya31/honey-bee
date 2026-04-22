const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth.js');
const {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCouponToOrder
} = require('../controllers/couponController.js');

// Public route to validate coupon
router.post('/validate', validateCoupon);

// Admin routes
router.get('/', adminAuth, getAllCoupons);
router.post('/', adminAuth, createCoupon);
router.put('/:id', adminAuth, updateCoupon);
router.delete('/:id', adminAuth, deleteCoupon);
router.post('/apply', adminAuth, applyCouponToOrder);

module.exports = router;
