const Section = require('../models/Section');
const User = require('../models/User');

// @desc    Create new section
// @route   POST /api/sections
// @access  Private (Teacher only)
exports.createSection = async (req, res) => {
  try {
    const { name, description, maxStudents } = req.body;

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create sections'
      });
    }

    const section = await Section.create({
      name,
      description,
      teacher: req.user.id,
      maxStudents: maxStudents || 50
    });

    // Populate teacher info
    await section.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all sections for a teacher
// @route   GET /api/sections/teacher
// @access  Private (Teacher only)
exports.getTeacherSections = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can view their sections'
      });
    }

    const sections = await Section.find({ 
      teacher: req.user.id,
      isActive: true 
    })
    .populate('teacher', 'name email')
    .populate('students', 'name email profilePicture')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all available sections for students to join
// @route   GET /api/sections/available
// @access  Private (Student only)
exports.getAvailableSections = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view available sections'
      });
    }

    const sections = await Section.find({ 
      isActive: true,
      'students': { $ne: req.user.id } // Sections student hasn't joined
    })
    .populate('teacher', 'name email')
    .select('name description joinCode teacher maxStudents students createdAt')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Join a section (for students)
// @route   POST /api/sections/join
// @access  Private (Student only)
exports.joinSection = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can join sections'
      });
    }

    const section = await Section.findOne({ 
      joinCode: joinCode.toUpperCase(),
      isActive: true 
    })
    .populate('teacher', 'name email');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Invalid join code or section not found'
      });
    }

    // Check if student is already in the section
    if (section.students.includes(req.user.id)) {
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
    section.students.push(req.user.id);
    await section.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the section',
      data: section
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sections for a student
// @route   GET /api/sections/student
// @access  Private (Student only)
exports.getStudentSections = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their sections'
      });
    }

    const sections = await Section.find({ 
      students: req.user.id,
      isActive: true 
    })
    .populate('teacher', 'name email profilePicture')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get section details
// @route   GET /api/sections/:id
// @access  Private
exports.getSectionDetails = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('teacher', 'name email profilePicture')
      .populate('students', 'name email profilePicture');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check if user has access to this section
    const isTeacher = section.teacher._id.toString() === req.user.id;
    const isStudent = section.students.some(student => student._id.toString() === req.user.id);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this section'
      });
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove student from section
// @route   DELETE /api/sections/:sectionId/students/:studentId
// @access  Private (Teacher only)
exports.removeStudentFromSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check if user is the teacher of this section
    if (section.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can remove students from this section'
      });
    }

    // Remove student from section
    section.students = section.students.filter(
      student => student.toString() !== req.params.studentId
    );
    await section.save();

    res.status(200).json({
      success: true,
      message: 'Student removed from section successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
