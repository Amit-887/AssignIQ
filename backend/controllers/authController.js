const User = require('../models/User');
const Section = require('../models/Section');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { OAuth2Client } = require('google-auth-library');
const { sendOTPEmail, generateOTP, storeOTP, verifyOTP, sendRegistrationConfirmationEmail } = require('../utils/email');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Send OTP for teacher registration
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, documentType } = req.body;
    
    console.log('=== SendOTP Request ===');
    console.log('Body:', JSON.stringify(req.body));
    console.log('File:', req.file);
    console.log('Email from request:', email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // For teachers, require document upload
    if (role === 'teacher') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a verification document (degree, certificate, or ID card)'
        });
      }
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Please select document type'
        });
      }
    }

    // Generate and send OTP
    const otp = generateOTP();
    const emailSent = await sendOTPEmail(email, name, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    // Store OTP and temporary user data
    storeOTP(email, otp);
    console.log('=== OTP Sent Debug ===');
    console.log('Email:', email);
    console.log('OTP Generated:', otp);
    console.log('OTP stored in memory');
    
    // Store user data temporarily (in production, use Redis)
    req.app.set('tempUserData_' + email, {
      name,
      email,
      password,
      role: role || 'student',
      department,
      phone,
      verificationDocument: req.file ? req.file.path : '',
      documentName: req.file ? req.file.originalname : '',
      documentType: documentType || 'other'
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('=== OTP Verification Debug ===');
    console.log('Email:', email);
    console.log('OTP Received:', otp);
    console.log('OTP Length:', otp ? otp.length : 0);

    // Verify OTP
    const otpResult = verifyOTP(email, otp);
    console.log('OTP Result:', otpResult);
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Get temporary user data
    const userData = req.app.get('tempUserData_' + email);
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please try again.'
      });
    }

    // Create user
    userData.isApproved = userData.role === 'teacher' ? false : true;
    const user = await User.create(userData);

    // Clean up temporary data
    req.app.delete('tempUserData_' + email);

    // Send registration confirmation email for teachers
    if (user.role === 'teacher') {
      await sendRegistrationConfirmationEmail(user.email, user.name);
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, documentType } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // For teachers, require document upload
    if (role === 'teacher') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a verification document (degree, certificate, or ID card)'
        });
      }
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Please select document type'
        });
      }
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'student',
      department,
      phone,
      isApproved: role === 'teacher' ? false : true,
      verificationDocument: req.file ? req.file.path : '',
      documentName: req.file ? req.file.originalname : '',
      documentType: documentType || 'other'
    };

    const user = await User.create(userData);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(`--- [LOGIN_DEBUG] Attempting login for: ${email}, Role: ${role} ---`);

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[LOGIN_DEBUG] User with email ${email} NOT found in database`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`[LOGIN_DEBUG] User found! Real Role: ${user.role}, Requested Role: ${role}`);

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    console.log('[LOGIN_DEBUG] Comparing passwords...');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('[LOGIN_DEBUG] Password mismatch! bcrypt.compare returned false.');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    console.log('[LOGIN_DEBUG] Password match successful!');

    // Check role if specified
    if (role && user.role !== role) {
      console.log(`[LOGIN_DEBUG] Role mismatch! User is ${user.role}, but tried to log in as ${role}`);
      return res.status(401).json({
        success: false,
        message: `This account is not registered as a ${role}`
      });
    }

    // Check if teacher is approved
    if (user.role === 'teacher' && !user.isApproved) {
      console.log('[LOGIN_DEBUG] Teacher account pending approval');
      return res.status(401).json({
        success: false,
        message: 'Your teacher account is pending approval from admin'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    console.log('[LOGIN_DEBUG] Login successful! Sending token response...');
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('[LOGIN_DEBUG] Unexpected Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Google OAuth Login/Register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, role, department } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      sendTokenResponse(user, 200, res);
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId: payload.sub,
        profilePicture: picture,
        password: Math.random().toString(36).slice(-8), // Random password
        role: role || 'student',
        department,
        isApproved: role === 'teacher' ? false : true
      });

      sendTokenResponse(user, 201, res);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let stats = {};
    let recentSubmissions = [];
    let sections = [];

    if (user.role === 'student') {
      // Get student stats
      const submissions = await Submission.find({ student: user._id });
      const approved = submissions.filter(s => ['approved', 'reviewed'].includes(s.status)).length;
      const pending = submissions.filter(s => ['submitted', 'under_review'].includes(s.status)).length;
      
      const scoredSubmissions = submissions.filter(s => s.teacherReview && s.teacherReview.marks !== undefined);
      const totalScore = scoredSubmissions.reduce((acc, s) => acc + s.teacherReview.marks, 0);
      const averageScore = scoredSubmissions.length > 0 ? (totalScore / scoredSubmissions.length).toFixed(1) : 0;

      stats = {
        totalSubmissions: submissions.length,
        approved,
        pending,
        averageScore
      };

      // Get recent submissions
      recentSubmissions = await Submission.find({ student: user._id })
        .populate('assignment', 'title maxMarks')
        .sort('-submittedAt')
        .limit(5);

      // Get enrolled sections
      sections = await Section.find({ students: user._id })
        .populate('teacher', 'name');

    } else if (user.role === 'teacher') {
      // Get teacher stats
      const ownedSections = await Section.find({ teacher: user._id });
      const ownedAssignments = await Assignment.find({ teacher: user._id });
      const allSubmissions = await Submission.find({ 
        assignment: { $in: ownedAssignments.map(a => a._id) } 
      });
      
      const pendingReviews = allSubmissions.filter(s => s.status === 'submitted').length;

      stats = {
        totalSections: ownedSections.length,
        totalAssignments: ownedAssignments.length,
        pendingReviews,
        totalStudents: ownedSections.reduce((acc, s) => acc + (s.students?.length || 0), 0)
      };

      // Get recent submissions for teacher to review
      recentSubmissions = await Submission.find({ 
        assignment: { $in: ownedAssignments.map(a => a._id) } 
      })
        .populate('student', 'name email')
        .populate('assignment', 'title')
        .sort('-submittedAt')
        .limit(5);

      sections = ownedSections;
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats,
        recentSubmissions,
        sections
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update profile picture
// @route   PATCH /api/auth/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user profile picture with Cloudinary URL
    user.profilePicture = req.file.path;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('CLOUDINARY_UPDATE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search for users
// @route   GET /api/auth/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Base criteria: Not self, active, and (student OR approved teacher OR admin)
    const baseCriteria = [
      { _id: { $ne: req.user.id } },
      { isActive: true },
      {
        $or: [
          { role: 'student' },
          { role: 'teacher', isApproved: true },
          { role: 'admin' }
        ]
      }
    ];

    let findQuery = { $and: [...baseCriteria] };

    if (query && query.trim() !== '') {
      findQuery.$and.push({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
    }

    const users = await User.find(findQuery)
    .select('name email profilePicture role')
    .sort('name')
    .limit(30);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      isApproved: user.isApproved
    }
  });
};

