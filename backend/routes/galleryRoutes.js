const express = require('express');
const galleryController = require('../controllers/galleryController.js');

const router = express.Router();

router.get('/', galleryController.getGallery);

module.exports = router;
