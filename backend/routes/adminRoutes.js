const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getAllUsers,
  getAllReports,
  resolveReport,
  deactivateUser,
  activateUser,
  getAllSections,
  getStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/stats', getStats);

// Teacher management
router.get('/teachers/pending', getPendingTeachers);
router.put('/teachers/approve/:id', approveTeacher);
router.put('/teachers/reject/:id', rejectTeacher);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);

// Section management
router.get('/sections', getAllSections);

// Reports
router.get('/reports', getAllReports);
router.put('/reports/:id/resolve', resolveReport);

module.exports = router;

