const express = require('express');
const enquiryController = require('../controllers/enquiryController.js');
const adminAuth = require('../middleware/adminAuth.js');

const router = express.Router();

// Public route - user can submit enquiry without authentication
router.post('/', enquiryController.createEnquiry);

// Admin routes
router.get('/', adminAuth, enquiryController.getEnquiries);
router.get('/:id', adminAuth, enquiryController.getEnquiryById);
router.put('/:id', adminAuth, enquiryController.updateEnquiry);
router.delete('/:id', adminAuth, enquiryController.deleteEnquiry);

module.exports = router;
