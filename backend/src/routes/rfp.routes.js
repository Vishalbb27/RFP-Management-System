const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfp.controller');

// Create RFP from natural language
router.post('/create-from-text', rfpController.createFromNaturalLanguage);

// Get all RFPs
router.get('/', rfpController.getRfps);

// // Get single RFP
router.get('/:id', rfpController.getRfpById);

// // Send RFP to vendors
router.post('/:id/send-to-vendors', rfpController.sendToVendors);

module.exports = router;
