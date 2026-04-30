const express = require('express');
const router = express.Router();
const {
  compileCode,
  runCode,
  detectAICode,
  generateCode,
  getSupportedLanguages
} = require('../controllers/codegenController');
const { protect } = require('../middleware/auth');

router.get('/languages', getSupportedLanguages);
router.post('/compile', protect, compileCode);
router.post('/run', protect, runCode);
router.post('/detect-ai', protect, detectAICode);
router.post('/generate', protect, generateCode);

module.exports = router;

