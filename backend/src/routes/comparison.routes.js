const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparison.controller');

router.get('/:rfpId', comparisonController.getComparison);

module.exports = router;
