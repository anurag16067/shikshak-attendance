const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
const schoolController = require('../controllers/schoolController');

// Create new school (admin only)
router.post('/', auth, authorize('admin'), schoolController.createSchool);

// List all schools (admin only)
router.get('/', auth, authorize('admin'), schoolController.listSchools);

// Debug: List all schools (including inactive) - for troubleshooting
router.get('/debug/all', schoolController.listAllSchools);

// Temporary test route without auth
router.get('/test/list', schoolController.listSchools);

// Get schools for dropdown (public - for registration)
router.get('/dropdown', schoolController.getSchoolsForDropdown);

// Get school details (admin only)
router.get('/:id', auth, authorize('admin'), schoolController.getSchool);

// Update school (admin only)
router.put('/:id', auth, authorize('admin'), schoolController.updateSchool);

// Delete school (admin only)
router.delete('/:id', auth, authorize('admin'), schoolController.deleteSchool);

// Update school boundary radius (admin only)
router.patch('/:id/boundary', auth, authorize('admin'), schoolController.updateBoundaryRadius);

// Send SMS alert (admin only)
router.post('/:id/sms-alert', auth, authorize('admin'), schoolController.sendSMSAlert);

module.exports = router; 