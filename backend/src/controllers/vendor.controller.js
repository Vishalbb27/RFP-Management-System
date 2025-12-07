const vendorService = require('../services/vendor.service');

exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await vendorService.findAll();
    res.json({ vendors });
  } catch (error) {
    next(error);
  }
};

exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.create(req.body);
    res.status(201).json({ vendor });
  } catch (error) {
    next(error);
  }
};
