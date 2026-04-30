const Section = require('../models/Section');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get teacher dashboard data
// @route   GET /api/teacher/dashboard
// @access  Private (Teacher)
exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get all sections for this teacher
    const sections = await Section.find({ teacher: teacherId });
    
    // Get total counts
    const totalSections = sections.length;
    const totalStudents = sections.reduce((acc, section) => acc + section.students.length, 0);
    
    // Get all assignments
    const assignments = await Assignment.find({ teacher: teacherId });
    const totalAssignments = assignments.length;
    
    // Get pending submissions
    const pendingSubmissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) },
      status: 'submitted'
    }).populate('assignment', 'title dueDate').populate('student', 'name email');

    // Get recent submissions
    const recentSubmissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) }
    })
    .sort('-createdAt')
    .limit(10)
    .populate('assignment', 'title')
    .populate('student', 'name');

    res.status(200).json({
      success: true,
      data: {
        totalSections,
        totalStudents,
        totalAssignments,
        pendingSubmissions: pendingSubmissions.length,
        sections,
        recentSubmissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new section
// @route   POST /api/teacher/sections
// @access  Private (Teacher)
exports.createSection = async (req, res) => {
  try {
    const { name, description } = req.body;

    // For now, use a hardcoded teacher ID until we fix auth
    const teacherId = req.user?.id || '697bbb54c622d14b71a31348';

    // Generate a unique join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const section = await Section.create({
      name,
      description,
      teacher: teacherId,
      students: [],
      joinCode
    });

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all sections for teacher
// @route   GET /api/teacher/sections
// @access  Private (Teacher)
exports.getSections = async (req, res) => {
  try {
    // For now, use a hardcoded teacher ID until we fix auth
    const teacherId = req.user?.id || '697bbb54c622d14b71a31348';
    
    const sections = await Section.find({ teacher: teacherId })
      .populate('students', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single section
// @route   GET /api/teacher/sections/:id
// @access  Private (Teacher)
exports.getSection = async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      teacher: req.user.id
    }).populate('students', 'name email profilePicture');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Get assignments for this section
    const assignments = await Assignment.find({ section: section._id });

    res.status(200).json({
      success: true,
      data: {
        section,
        assignments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add students to section
// @route   POST /api/teacher/sections/:id/students
// @access  Private (Teacher)
exports.addStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    const section = await Section.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Add students to section
    section.students = [...new Set([...section.students, ...studentIds])];
    await section.save();

    // Populate the updated students
    await section.populate('students', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove student from section
// @route   DELETE /api/teacher/sections/:id/students/:studentId
// @access  Private (Teacher)
exports.removeStudent = async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    section.students = section.students.filter(
      student => student.toString() !== req.params.studentId
    );
    await section.save();

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete section
// @route   DELETE /api/teacher/sections/:id
// @access  Private (Teacher)
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Remove section reference from all students in this section
    await User.updateMany(
      { sections: req.params.id },
      { $pull: { sections: req.params.id } }
    );

    // Delete all assignments in this section
    await Assignment.deleteMany({ section: req.params.id });

    // Delete all submissions for assignments in this section
    const assignments = await Assignment.find({ section: req.params.id });
    const assignmentIds = assignments.map(a => a._id);
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });

    // Finally delete the section
    await section.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create assignment
// @route   POST /api/teacher/assignments
// @access  Private (Teacher)
exports.createAssignment = async (req, res) => {
  try {
    console.log('Create assignment request body:', req.body);
    console.log('User from request:', req.user);
    
    const {
      title,
      description,
      sectionId,
      dueDate,
      maxMarks,
      instructions,
      allowedFileTypes,
      maxFileSize,
      isAiEnabled
    } = req.body;

    // For now, use a hardcoded teacher ID until we fix auth
    const teacherId = req.user?.id || '697bbb54c622d14b71a31348';

    if (!sectionId || sectionId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please select a Section to assign this to.' });
    }
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Missing Assignment Title' });
    }
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Missing Due Date' });
    }

    // Verify section belongs to teacher
    const section = await Section.findOne({
      _id: sectionId,
      teacher: teacherId
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      section: sectionId,
      teacher: teacherId,
      dueDate,
      maxMarks,
      instructions,
      allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx', 'txt'],
      maxFileSize: maxFileSize || 10485760,
      isAiEnabled: isAiEnabled !== false
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all assignments for teacher
// @route   GET /api/teacher/assignments
// @access  Private (Teacher)
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user.id })
      .populate('section', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get assignment submissions
// @route   GET /api/teacher/assignments/:id/submissions
// @access  Private (Teacher)
exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Review submission and assign marks
// @route   PUT /api/teacher/submissions/:id/review
// @access  Private (Teacher)
exports.reviewSubmission = async (req, res) => {
  try {
    const { marks, feedback, isApproved } = req.body;

    const submission = await Submission.findById(req.params.id)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify teacher owns the assignment
    const assignment = await Assignment.findById(submission.assignment._id);
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this submission'
      });
    }

    // Update submission
    submission.teacherReview = {
      marks,
      feedback,
      reviewedBy: req.user.id,
      reviewedAt: Date.now(),
      isApproved
    };

    submission.status = isApproved ? 'approved' : 'returned';
    await submission.save();

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

