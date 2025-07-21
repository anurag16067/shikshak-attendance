const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
const attendanceController = require('../controllers/attendanceController');

// Teacher/Principal check-in
router.post('/', auth, authorize('teacher', 'principal'), attendanceController.checkIn);
// Teacher/Principal check-out
router.post('/checkout', auth, authorize('teacher', 'principal'), attendanceController.checkOut);
// Teacher/Principal: get today's attendance status
router.get('/today', auth, authorize('teacher', 'principal'), attendanceController.getTodayAttendanceStatus);
// Teacher/Principal: get attendance history
router.get('/history', auth, authorize('teacher', 'principal'), attendanceController.getTeacherAttendanceHistory);
// Principal: get all attendance for their school
router.get('/school', auth, authorize('principal'), attendanceController.getSchoolAttendance);
// Principal: approve attendance
router.put('/:id/approve', auth, authorize('principal'), attendanceController.approveAttendance);
// Principal: reject attendance
router.put('/:id/reject', auth, authorize('principal'), attendanceController.rejectAttendance);
// Principal: export CSV
router.get('/export', auth, authorize('principal'), attendanceController.exportCSV);
// Admin: get attendance stats
router.get('/stats', auth, authorize('admin'), attendanceController.getAttendanceStats);
// Admin: get all principal attendance for approval
router.get('/principals', auth, authorize('admin'), attendanceController.getPrincipalAttendance);
// Admin: approve principal attendance
router.put('/principals/:id/approve', auth, authorize('admin'), attendanceController.approvePrincipalAttendance);
// Admin: reject principal attendance
router.put('/principals/:id/reject', auth, authorize('admin'), attendanceController.rejectPrincipalAttendance);
// Admin: export all principal attendance as CSV
router.get('/principals/export', auth, authorize('admin'), attendanceController.exportPrincipalCSV);

module.exports = router; 