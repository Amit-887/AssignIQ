const express = require('express');
const {
  createSection,
  getTeacherSections,
  getAvailableSections,
  joinSection,
  getStudentSections,
  getSectionDetails,
  removeStudentFromSection
} = require('../controllers/sectionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Teacher routes
router.post('/', createSection);
router.get('/teacher', getTeacherSections);

// Student routes
router.get('/available', getAvailableSections);
router.post('/join', joinSection);
router.get('/student', getStudentSections);

// Common routes
router.get('/:id', getSectionDetails);
router.delete('/:sectionId/students/:studentId', removeStudentFromSection);

module.exports = router;
