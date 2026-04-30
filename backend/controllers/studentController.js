const Section = require('../models/Section');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Join section with join code
// @route   POST /api/student/join-section
// @access  Private (Student)
exports.joinSection = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const studentId = req.user.id;

    // Find section by join code
    const section = await Section.findOne({ 
      joinCode: joinCode.toUpperCase(),
      isActive: true
    }).populate('teacher', 'name email');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Invalid join code or section not found'
      });
    }

    // Check if student is already enrolled
    if (section.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this section'
      });
    }

    // Check if section is full
    if (section.students.length >= section.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Section is full'
      });
    }

    // Add student to section
    section.students.push(studentId);
    await section.save();

    res.status(200).json({
      success: true,
      data: section,
      message: 'Successfully joined the section'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student dashboard
// @route   GET /api/student/dashboard
// @access  Private (Student)
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get sections student belongs to
    const sections = await Section.find({ students: studentId })
      .populate('teacher', 'name email');

    // Get all assignments for these sections
    const sectionIds = sections.map(s => s._id);
    const assignments = await Assignment.find({
      section: { $in: sectionIds },
      status: 'active'
    }).populate('section', 'name');

    // Get submissions
    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'title dueDate maxMarks');

    // Get upcoming deadlines
    const now = new Date();
    const upcomingAssignments = assignments
      .filter(a => new Date(a.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Get recent submissions
    const recentSubmissions = submissions
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);

    // Filter out assignments that are already submitted
    const submittedAssignmentIds = submissions.map(s => s.assignment?._id?.toString());
    const pendingAssignments = upcomingAssignments.filter(a => !submittedAssignmentIds.includes(a._id.toString()));

    // Calculate stats mapped specifically for frontend
    const submittedCount = submissions.length;
    
    let totalScore = 0;
    let totalOriginality = 0;
    let scoredChecks = 0;
    let performanceTrend = [];

    submissions.forEach(sub => {
      if (sub.aiEvaluation) {
        let sc = sub.aiEvaluation.score || 0;
        let orig = sub.aiEvaluation.originalityScore || 0;
        if (sc > 0 || orig > 0) {
          totalScore += sc;
          totalOriginality += orig;
          scoredChecks++;
          
          if (sub.assignment && sub.assignment.title) {
            performanceTrend.push({
              name: sub.assignment.title.substring(0, 8) + '..',
              score: sc
            });
          }
        }
      }
    });

    const averageScore = scoredChecks > 0 ? Math.round(totalScore / scoredChecks) : 0;
    const averageOriginality = scoredChecks > 0 ? Math.round(totalOriginality / scoredChecks) : 0;
    const quizSuccessRate = scoredChecks > 0 ? Math.round(totalScore / scoredChecks) : 0; // Approximate success rate visually

    let aiSuggestion = "Keep up the great work! Excellent originality.";
    if (scoredChecks === 0) aiSuggestion = "Submit assignments and complete verification quizzes to generate AI insights.";
    else if (averageOriginality < 65) aiSuggestion = "Try putting concepts into your own words to boost originality scores.";
    else if (averageScore < 50) aiSuggestion = "Review foundational concepts before quizzes for better AI evaluations.";

    res.status(200).json({
      success: true,
      data: {
        sections,
        submittedCount,
        pendingAssignments,
        recentSubmissions,
        averageScore,
        averageOriginality,
        quizSuccessRate,
        aiSuggestion,
        performanceTrend: performanceTrend.length > 0 ? performanceTrend : [{ name: 'No data', score: 0 }]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's sections
// @route   GET /api/student/sections
// @access  Private (Student)
exports.getSections = async (req, res) => {
  try {
    const sections = await Section.find({ students: req.user.id })
      .populate('teacher', 'name email profilePicture');

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

// @desc    Get student's assignments
// @route   GET /api/student/assignments
// @access  Private (Student)
exports.getAssignments = async (req, res) => {
  try {
    const { status } = req.query;

    // Get student's sections
    const sections = await Section.find({ students: req.user.id });
    const sectionIds = sections.map(s => s._id);

    // Get assignments
    const query = { section: { $in: sectionIds }, status: 'active' };
    if (status === 'upcoming') {
      query.dueDate = { $gt: new Date() };
    } else if (status === 'overdue') {
      query.dueDate = { $lt: new Date() };
    }

    const assignments = await Assignment.find(query)
      .populate('section', 'name')
      .populate('teacher', 'name')
      .sort('dueDate');

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user.id
        });

        return {
          ...assignment.toObject(),
          submissionStatus: submission ? submission.status : 'not_submitted',
          submissionId: submission?._id
        };
      })
    );

    res.status(200).json({
      success: true,
      data: assignmentsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single assignment details
// @route   GET /api/student/assignments/:id
// @access  Private (Student)
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('section', 'name')
      .populate('teacher', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is in this section
    const isEnrolled = assignment.section.students.includes(req.user.id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this section'
      });
    }

    // Get student's submission
    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submission
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's submission history
// @route   GET /api/student/submissions
// @access  Private (Student)
exports.getSubmissionHistory = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title maxMarks')
      .populate('section', 'name')
      .sort('-submittedAt');

    // Calculate overall performance
    const approvedSubmissions = submissions.filter(s => s.status === 'approved');
    const totalMarks = approvedSubmissions.reduce((acc, s) => {
      return acc + (s.teacherReview?.marks || 0);
    }, 0);
    const averageMarks = approvedSubmissions.length > 0
      ? totalMarks / approvedSubmissions.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        submissions,
        stats: {
          total: submissions.length,
          approved: approvedSubmissions.length,
          pending: submissions.filter(s => s.status === 'submitted').length,
          averageMarks: Math.round(averageMarks * 100) / 100
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

// @desc    Get student's profile
// @route   GET /api/student/profile
// @access  Private (Student)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    // Get sections
    const sections = await Section.find({ students: req.user.id })
      .populate('teacher', 'name');

    // Get submission stats
    const submissions = await Submission.find({ student: req.user.id });
    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const averageScore = submissions
      .filter(s => s.teacherReview?.marks)
      .reduce((acc, s) => acc + s.teacherReview.marks, 0) / approvedCount || 0;

    res.status(200).json({
      success: true,
      data: {
        user,
        sections,
        stats: {
          totalSubmissions,
          approvedCount,
          averageScore: Math.round(averageScore * 100) / 100
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

