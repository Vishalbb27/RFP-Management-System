const comparisonService = require('../services/comparison.service');

exports.getComparison = async (req, res, next) => {
  try {
    const comparison = await comparisonService.compareAndRecommend(req.params.rfpId);
    res.json(comparison);
  } catch (error) {
    next(error);
  }
};
