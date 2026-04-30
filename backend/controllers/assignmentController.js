const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Section = require('../models/Section');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aiService = require('../services/aiService');
const textExtractionService = require('../services/textExtractionService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/assignments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, section, dueDate, maxMarks, instructions, allowedFileTypes, isAiEnabled } = req.body;

    // Verify teacher owns the section
    const sectionData = await Section.findOne({ _id: section, teacher: req.user.id });
    if (!sectionData) {
      return res.status(403).json({
        success: false,
        message: 'You can only create assignments for your sections'
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      section,
      teacher: req.user.id,
      dueDate,
      maxMarks,
      instructions,
      allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
      isAiEnabled: isAiEnabled !== false,
      attachments: req.files ? req.files.map(file => `/uploads/assignments/${file.filename}`) : []
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get assignments for a section
// @route   GET /api/assignments/section/:sectionId
// @access  Private
exports.getSectionAssignments = async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    // Validate sectionId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sectionId) || sectionId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID'
      });
    }
    
    // Verify user has access to this section
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // For now, allow access without auth checks (will fix later)
    const assignments = await Assignment.find({ section: sectionId })
      .populate('teacher', 'name email')
      .sort({ dueDate: 1 });

    // If student is logged in, check for submissions
    const studentId = req.user.id;
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: studentId
        });
        return {
          ...assignment.toObject(),
          hasSubmitted: !!submission,
          submissionScore: submission?.aiEvaluation?.score || 0
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

// @desc    Precheck assignment submission
// @route   POST /api/assignments/:assignmentId/precheck
// @access  Private (Student)
exports.precheckSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    // For now, use a hardcoded student ID until we fix auth
    const studentId = req.user.id;

    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId).populate('section');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    console.log('Precheck for assignment:', assignmentId);
    console.log('Files received:', files);
    console.log('Content:', content);

    // Extract content from files for analysis
    let extractedContent = content || '';
    
    // Use unified text extraction for all file types
    for (const file of files) {
      try {
        console.log(`[PRECHECK_DEBUG] Extracting text from: ${file.originalname} (${file.mimetype})`);
        const text = await textExtractionService.extractText(file.path, file.mimetype);
        if (text) {
          extractedContent += '\n' + text;
        }
      } catch (extractionError) {
        console.error(`[PRECHECK_DEBUG] Extraction failed for ${file.originalname}:`, extractionError.message);
      }
    }

    if (!extractedContent.trim()) {
      console.warn(`[PRECHECK_DEBUG] FAILED. No text extracted from any of the ${files.length} files.`);
      return res.status(400).json({
        success: false,
        message: 'No readable content found in your documents. Please ensure your photos or files contain clear, legible text for analysis.'
      });
    }

    console.log(`[PRECHECK_DEBUG] Total text length: ${extractedContent.length}`);

    // Perform AI analysis with assignment context
    const typeMapping = {
      'pdf': 'pdf',
      'docx': 'docx',
      'doc': 'doc',
      'txt': 'txt',
      'jpg': 'jpg',
      'jpeg': 'jpeg',
      'png': 'png',
      'heic': 'heic',
      'webp': 'webp'
    };
    const fileType = files.length > 0 ? (typeMapping[path.extname(files[0].originalname).slice(1).toLowerCase()] || 'txt') : 'txt';
    
    console.log(`[PRECHECK_DEBUG] Performing context-aware analysis for topic: ${assignment.title}`);
    const analysis = await aiService.analyzeContent(extractedContent, fileType, {
      topic: assignment.title,
      description: assignment.description
    });
    
    console.log('Precheck analysis results:', { 
      relevance: analysis.relevanceScore, 
      originality: analysis.originalityScore 
    });

    // Generate suggestions
    const suggestions = [
      ...analysis.suggestions,
      ...(analysis.plagiarismScore > 20 ? ['Consider reducing similarity to existing sources'] : []),
      ...(analysis.aiGeneratedProbability > 30 ? ['Add more personal insights and original thinking'] : [])
    ];

    res.status(200).json({
      success: true,
      data: {
        analysis: {
          originalityScore: analysis.originalityScore,
          relevanceScore: analysis.relevanceScore,
          plagiarismScore: Math.round(analysis.plagiarismScore),
          aiGeneratedProbability: Math.round(analysis.aiGeneratedProbability),
          suggestions: analysis.suggestions,
          issues: analysis.issues,
          topicMatchFeedback: analysis.topicMatchFeedback
        },
        overallScore: Math.round(analysis.originalityScore * 0.4 + (analysis.relevanceScore || 100) * 0.4 + (100 - analysis.plagiarismScore) * 0.2),
        extractedContent: extractedContent.substring(0, 1000) + (extractedContent.length > 1000 ? '...' : '')
      }
    });
  } catch (error) {
    console.error('Precheck error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit assignment with files
// @route   POST /api/assignments/:assignmentId/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;

    // For now, use a hardcoded student ID until we fix auth
    const studentId = req.user.id;

    // Verify assignment exists and student has access
    const assignment = await Assignment.findById(assignmentId).populate('section');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if submission is late
    const isLate = new Date() > new Date(assignment.dueDate);

    // Check if already submitted and if re-submission is allowed (before deadline)
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (existingSubmission && isLate) {
      return res.status(400).json({
        success: false,
        message: 'Deadline has passed. You cannot re-submit after the due date.'
      });
    }

    // Process uploaded files
    const files = req.files ? req.files.map(file => ({
      fileUrl: `uploads/assignments/${file.filename}`,
      fileName: file.originalname,
      fileType: path.extname(file.originalname).slice(1).toLowerCase(),
      fileSize: file.size
    })) : [];

    // Create or Update submission
    let submission;
    if (existingSubmission) {
      existingSubmission.files = files;
      existingSubmission.content = content;
      existingSubmission.isLate = isLate;
      existingSubmission.submittedAt = new Date();
      existingSubmission.status = 'under_review';
      submission = await existingSubmission.save();
      console.log('Re-submission processed for:', assignmentId);
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        files,
        content,
        isLate,
        submittedAt: new Date()
      });
      console.log('New submission created for:', assignmentId);
    }

    // If AI is enabled, perform analysis
    if (assignment.isAiEnabled && files.length > 0) {
      try {
        console.log('Starting AI analysis for assignment:', assignmentId);
        console.log('Files:', files);
        console.log('Content:', content);
        
        // Extract content from files for analysis
        let extractedContent = content || '';
        
        // For image files, perform OCR
        for (const file of files) {
          if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(file.fileType)) {
            try {
              const imagePath = path.join(__dirname, '..', 'uploads', 'assignments', path.basename(file.fileUrl));
              console.log('Performing OCR on image:', imagePath);
              const ocrText = await aiService.extractTextFromImage(imagePath);
              extractedContent += '\n' + ocrText;
              console.log('OCR extracted text:', ocrText);
            } catch (ocrError) {
              console.error('OCR failed for image:', file.fileName, ocrError);
            }
          }
        }
        
        // Perform AI analysis on extracted content
        const analysis = await aiService.analyzeContent(extractedContent, files[0].fileType);
        
        console.log('AI Analysis result:', analysis);
        
        // Generate questions for understanding assessment
        const questions = await aiService.generateQuestions(extractedContent);
        
        console.log('Generated questions:', questions);
        
        // Update submission with AI data
        submission.aiEvaluation = {
          ...analysis,
          questions: questions.map(q => ({
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            points: q.points
          })),
          evaluationDate: new Date()
        };
        
        await submission.save();
        console.log('Submission updated with AI data');
      } catch (error) {
        console.error('AI Analysis failed:', error);
        // Continue without AI analysis
      }
    } else {
      console.log('AI analysis skipped - isAiEnabled:', assignment.isAiEnabled, 'files.length:', files.length);
    }

    res.status(201).json({
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

// @desc    Submit answers to AI-generated questions
// @route   POST /api/assignments/:assignmentId/questions
// @access  Private (Student)
exports.submitAnswers = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { answers } = req.body;

    // For now, use a hardcoded student ID until we fix auth
    const studentId = req.user.id;

    // Find submission
    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    }).populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Evaluate answers
    const evaluation = await aiService.evaluateAnswers(
      submission.aiEvaluation.questions,
      answers
    );

    console.log('Answer evaluation result:', evaluation);

    // Update submission with evaluation results
    submission.aiEvaluation = {
      ...submission.aiEvaluation,
      ...evaluation,
      evaluationDate: new Date()
    };

    await submission.save();

    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all submissions for an assignment (Teacher view)
// @route   GET /api/assignments/:assignmentId/submissions
// @access  Private (Teacher)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    console.log(`[GET_SUBMISSIONS_DEBUG] User ID: ${req.user.id}, Role: ${req.user.role}, Assignment ID: ${assignmentId}`);

    // Verify assignment belongs to teacher or user is admin
    let query = { _id: assignmentId };
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      query.teacher = req.user.id;
    }
    const assignment = await Assignment.findOne(query);
    if (!assignment) {
      console.log(`[GET_SUBMISSIONS_DEBUG] Returning 403. Found assignment: ${!!assignment}`);
      return res.status(403).json({
        success: false,
        message: 'You can only view submissions for your assignments'
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .populate('assignment', 'title maxMarks dueDate')
      .sort({ submittedAt: -1 });

    // Calculate performance statistics
    const stats = {
      totalSubmissions: submissions.length,
      averageScore: 0,
      averageOriginality: 0,
      averagePlagiarism: 0,
      performanceDistribution: {
        excellent: 0, // 90-100
        good: 0,       // 80-89
        average: 0,    // 70-79
        belowAverage: 0, // 60-69
        poor: 0        // <60
      }
    };

    submissions.forEach(submission => {
      if (submission.aiEvaluation.score) {
        stats.averageScore += submission.aiEvaluation.score;
        
        // Categorize performance
        const score = submission.aiEvaluation.score;
        if (score >= 90) stats.performanceDistribution.excellent++;
        else if (score >= 80) stats.performanceDistribution.good++;
        else if (score >= 70) stats.performanceDistribution.average++;
        else if (score >= 60) stats.performanceDistribution.belowAverage++;
        else stats.performanceDistribution.poor++;
      }
      
      if (submission.aiEvaluation.originalityScore) {
        stats.averageOriginality += submission.aiEvaluation.originalityScore;
      }
      
      if (submission.aiEvaluation.plagiarismScore) {
        stats.averagePlagiarism += submission.aiEvaluation.plagiarismScore;
      }
    });

    // Calculate averages
    const submissionCount = submissions.length;
    if (submissionCount > 0) {
      stats.averageScore = Math.round(stats.averageScore / submissionCount);
      stats.averageOriginality = Math.round(stats.averageOriginality / submissionCount);
      stats.averagePlagiarism = Math.round(stats.averagePlagiarism / submissionCount);
    }

    res.status(200).json({
      success: true,
      data: {
        submissions,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's assignment performance
// @route   GET /api/assignments/student/performance
// @access  Private (Student)
exports.getStudentPerformance = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title maxMarks dueDate section')
      .populate('assignment.section', 'name')
      .sort({ submittedAt: -1 });

    const performance = submissions.map(submission => ({
      _id: submission._id,
      assignment: {
        title: submission.assignment.title,
        section: submission.assignment.section.name,
        maxMarks: submission.assignment.maxMarks,
        dueDate: submission.assignment.dueDate
      },
      files: submission.files,
      extractedText: submission.extractedText,
      submittedAt: submission.submittedAt,
      isLate: submission.isLate,
      score: submission.aiEvaluation.score || 0,
      originalityScore: submission.aiEvaluation.originalityScore || 0,
      plagiarismScore: submission.aiEvaluation.plagiarismScore || 0,
      status: submission.status,
      feedback: submission.aiEvaluation.feedback || '',
      aiQuestions: submission.aiEvaluation.questions || []
    }));

    // Calculate overall statistics
    const overallStats = {
      totalAssignments: submissions.length,
      averageScore: 0,
      onTimeSubmissions: submissions.filter(s => !s.isLate).length,
      averageOriginality: 0
    };

    submissions.forEach(submission => {
      if (submission.aiEvaluation.score) {
        overallStats.averageScore += submission.aiEvaluation.score;
      }
      if (submission.aiEvaluation.originalityScore) {
        overallStats.averageOriginality += submission.aiEvaluation.originalityScore;
      }
    });

    if (submissions.length > 0) {
      overallStats.averageScore = Math.round(overallStats.averageScore / submissions.length);
      overallStats.averageOriginality = Math.round(overallStats.averageOriginality / submissions.length);
    }

    res.status(200).json({
      success: true,
      data: {
        performance,
        overallStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all assignments for a student (from all their sections)
// @route   GET /api/assignments/student/all
// @access  Private (Student)
exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all sections where the student is enrolled
    const sections = await Section.find({ 
      students: studentId,
      isActive: true 
    }).select('_id name teacher');

    if (sections.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const sectionIds = sections.map(section => section._id);

    // Find all assignments in these sections
    const assignments = await Assignment.find({ 
      section: { $in: sectionIds },
      status: 'active'
    })
    .populate('section', 'name')
    .populate('teacher', 'name email')
    .sort({ dueDate: 1 });

    // Check if student has already submitted each assignment
    const assignmentsWithSubmissionStatus = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const submission = await Submission.findOne({
            assignment: assignment._id,
            student: studentId
          });
          
          return {
            ...assignment.toObject(),
            hasSubmitted: !!submission,
            submissionDate: submission?.submittedAt,
            score: submission?.aiEvaluation?.score || 0
          };
        } catch (error) {
          return {
            ...assignment.toObject(),
            hasSubmitted: false,
            submissionDate: null,
            score: 0
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: assignmentsWithSubmissionStatus
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export upload middleware for use in routes
exports.upload = upload;
