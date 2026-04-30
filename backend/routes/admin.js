const express = require('express');
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController.js');
const enquiryController = require('../controllers/enquiryController.js');
const galleryController = require('../controllers/galleryController.js');
const adminAuth = require('../middleware/adminAuth.js');

const router = express.Router();

// Use memory storage so controllers can decide to persist locally or to S3
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/login', adminController.login);

router.use(adminAuth);

router.get('/dashboard-stats', adminController.dashboardStats);
router.get('/products', adminController.getProducts);
router.post('/products', upload.single('image'), adminController.createProduct);
router.put('/products/:id', upload.single('image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrder);
router.put('/orders/:id', adminController.updateOrderStatus);

router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

router.get('/enquiries', enquiryController.getEnquiries);
router.get('/enquiries/:id', enquiryController.getEnquiryById);
router.put('/enquiries/:id', enquiryController.updateEnquiry);
router.delete('/enquiries/:id', enquiryController.deleteEnquiry);

router.post('/gallery', upload.single('media'), galleryController.createGalleryItem);
router.delete('/gallery/:id', galleryController.deleteGalleryItem);
router.put('/gallery/:id', galleryController.updateGalleryItem);

module.exports = router;
