const User = require('../models/User');
const Section = require('../models/Section');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Report = require('../models/Report');
const { sendApprovalEmail, sendRejectionEmail, sendRegistrationConfirmationEmail } = require('../utils/email');

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalSections = await Section.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    
    // Pending teacher approvals (show all unapproved teachers, regardless of isActive)
    const pendingTeachers = await User.find({
      role: 'teacher',
      isApproved: false
    }).select('name email department phone verificationDocument documentName documentType createdAt isActive');

    // Recent registrations
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(10)
      .select('name email role createdAt');

    // Get pending reports
    const pendingReports = await Report.find({ status: 'pending' })
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTeachers,
          totalSections,
          totalAssignments,
          pendingApprovals: pendingTeachers.length
        },
        pendingTeachers,
        recentUsers,
        pendingReports: pendingReports.length,
        reports: pendingReports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all pending teacher registrations
// @route   GET /api/admin/teachers/pending
// @access  Private (Admin)
exports.getPendingTeachers = async (req, res) => {
  try {
    // Show all unapproved teachers, regardless of isActive status
    const teachers = await User.find({
      role: 'teacher',
      isApproved: false
    }).select('name email department phone createdAt verificationDocument documentName documentType isActive');

    res.status(200).json({
      success: true,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve teacher registration
// @route   PUT /api/admin/teachers/approve/:id
// @access  Private (Admin)
exports.approveTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    teacher.isApproved = true;
    teacher.approvedBy = req.user.id;
    teacher.approvedAt = Date.now();

    // Send approval email to teacher
    sendApprovalEmail(teacher.email, teacher.name);
    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Teacher approved successfully. They can now login.',
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject teacher registration
// @route   PUT /api/admin/teachers/reject/:id
// @access  Private (Admin)
exports.rejectTeacher = async (req, res) => {
  try {
    // Get reason from request body
    const { reason } = req.body;

    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Store rejection info but keep the record
    teacher.rejectionReason = reason || 'No reason provided';
    teacher.isActive = false; // Deactivate rejected teacher
    await teacher.save();

    // Send rejection email to teacher
    await sendRejectionEmail(teacher.email, teacher.name, reason);

    res.status(200).json({
      success: true,
      message: 'Teacher registration rejected',
      data: teacher
    });
  } catch (error) {
    console.error('Error rejecting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting teacher'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resolve report
// @route   PUT /api/admin/reports/:id/resolve
// @access  Private (Admin)
exports.resolveReport = async (req, res) => {
  try {
    const { actionTaken, status } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status || 'resolved';
    report.actionTaken = actionTaken;
    report.resolvedBy = req.user.id;
    report.resolvedAt = Date.now();

    await report.save();

    // Optionally take action on reported user
    if (status === 'resolved' && req.body.warnUser) {
      await User.findByIdAndUpdate(report.reportedUser._id, {
        $push: {
          warnings: {
            reason: report.reason,
            description: report.description,
            date: Date.now()
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private (Admin)
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Activate user
// @route   PUT /api/admin/users/:id/activate
// @access  Private (Admin)
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all sections
// @route   GET /api/admin/sections
// @access  Private (Admin)
exports.getAllSections = async (req, res) => {
  try {
    const sections = await Section.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalSections,
      totalAssignments,
      totalSubmissions,
      pendingTeachers
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Section.countDocuments(),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      User.countDocuments({ role: 'teacher', isApproved: false })
    ]);

    // Calculate submission rate
    const assignmentsWithSubmissions = await Assignment.find();
    const submissionsByDate = await Submission.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTeachers,
        totalSections,
        totalAssignments,
        totalSubmissions,
        pendingTeachers,
        submissionsTrend: submissionsByDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

