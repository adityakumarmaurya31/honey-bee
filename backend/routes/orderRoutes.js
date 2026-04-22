const express = require('express');
const orderController = require('../controllers/orderController.js');

const router = express.Router();

router.post('/payment-order', orderController.createPaymentOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.post('/verify-upi', orderController.verifyUPI);
router.post('/', orderController.createOrder);
router.get('/user', orderController.getUserOrders);
router.get('/track', orderController.trackOrderByTrackingNumber);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/return', orderController.returnOrder);

module.exports = router;
