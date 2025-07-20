const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

// Get district-level stats (admin only)
router.get('/stats', auth, authorize('admin'), reportController.getStats);
// Export district report as CSV (admin only)
router.get('/district', auth, authorize('admin'), reportController.exportDistrictReport);

module.exports = router; 