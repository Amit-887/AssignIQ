const express = require('express');
const router = express.Router();
const {
  getDashboard,
  createSection,
  getSections,
  getSection,
  addStudents,
  removeStudent,
  deleteSection,
  createAssignment,
  getAssignments,
  getSubmissions,
  reviewSubmission
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Temporary middleware to set default user for testing
router.use((req, res, next) => {
  req.user = {
    id: '697bbb54c622d14b71a31348',
    role: 'teacher'
  };
  next();
});

// router.use(protect);

router.get('/dashboard', getDashboard);

// Section routes
router.route('/sections')
  .get(getSections)
  .post(createSection);

router.route('/sections/:id')
  .get(getSection)
  .delete(deleteSection);

router.post('/sections/:id/students', addStudents);
router.delete('/sections/:id/students/:studentId', removeStudent);

// Assignment routes
router.route('/assignments')
  .get(getAssignments)
  .post(createAssignment);

router.get('/assignments/:id/submissions', getSubmissions);

// Submission routes
router.put('/submissions/:id/review', reviewSubmission);

module.exports = router;

