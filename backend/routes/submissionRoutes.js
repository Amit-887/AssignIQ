const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  getSubmission,
  addComment,
  aiEvaluate,
  startQuiz,
  answerVerification
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.post('/', upload.array('files', 10), submitAssignment);
router.get('/:id', getSubmission);
router.post('/:id/comments', addComment);
router.post('/:id/evaluate', authorize('teacher'), aiEvaluate);
router.post('/:id/start-quiz', startQuiz);
router.post('/:id/verify', answerVerification);

module.exports = router;

