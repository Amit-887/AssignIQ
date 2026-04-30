const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  getMe,
  logout,
  sendOTP,
  verifyOTPAndRegister,
  updateProfilePicture,
  searchUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, uploadCloudinary } = require('../middleware/upload');

router.post('/send-otp', upload.single('document'), sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/register', upload.single('document'), register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/users/search', protect, searchUsers);
router.patch('/profile-picture', protect, (req, res, next) => {
  uploadCloudinary.single('picture')(req, res, (err) => {
    if (err) {
      console.error('--- MULTER_UPLOAD_ERROR ---');
      console.error(err);
      return res.status(400).json({ 
        success: false, 
        message: 'Upload failed', 
        error: err.message 
      });
    }
    next();
  });
}, updateProfilePicture);

module.exports = router;

