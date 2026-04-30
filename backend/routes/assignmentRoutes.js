const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAssignment,
  getSectionAssignments,
  precheckSubmission,
  submitAssignment,
  submitAnswers,
  getAssignmentSubmissions,
  getStudentPerformance,
  getStudentAssignments,
  upload
} = require('../controllers/assignmentController');

// Protect all routes
router.use(protect);

// Assignment creation and management
router.post('/', upload.array('attachments', 5), createAssignment);
router.get('/section/:sectionId', getSectionAssignments);
router.get('/student/all', getStudentAssignments); // New endpoint for students

// Submission and AI features
router.post('/:assignmentId/precheck', upload.array('files', 5), precheckSubmission);
router.post('/:assignmentId/submit', upload.array('files', 5), submitAssignment);
router.post('/:assignmentId/questions', submitAnswers);

// Teacher view of submissions
router.get('/:assignmentId/submissions', getAssignmentSubmissions);

// Student performance tracking
router.get('/student/performance', getStudentPerformance);

module.exports = router;
