const express = require('express');
const rfpRoutes = require('./rfp.routes');
const vendorRoutes = require('./vendor.routes');
const proposalRoutes = require('./proposal.routes');
const comparisonRoutes = require('./comparison.routes');

const router = express.Router();

router.use('/rfp', rfpRoutes);
router.use('/vendors', vendorRoutes);
router.use('/proposals', proposalRoutes);
router.use('/comparison', comparisonRoutes);

module.exports = router;
