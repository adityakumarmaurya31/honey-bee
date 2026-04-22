const express = require('express');
const productController = require('../controllers/productController.js');

const router = express.Router();

router.get('/', productController.getProducts);

module.exports = router;