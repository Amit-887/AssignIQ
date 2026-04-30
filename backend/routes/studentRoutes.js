const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getSections,
  getAssignments,
  getAssignment,
  getSubmissionHistory,
  getProfile,
  joinSection
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/sections', getSections);
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignment);
router.get('/submissions', getSubmissionHistory);
router.get('/profile', getProfile);
router.post('/join-section', joinSection);

module.exports = router;

