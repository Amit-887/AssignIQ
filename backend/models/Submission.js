const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'heic', 'webp', 'pptx']
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  content: {
    type: String,
    default: ''
  },
  extractedText: {
    type: String,
    default: ''
  },
  quizStartTime: {
    type: Date
  },
  quizCompletedAt: {
    type: Date
  },
  precheckData: {
    originalityScore: {
      type: Number,
      default: 0
    },
    plagiarismScore: {
      type: Number,
      default: 0
    },
    aiGeneratedProbability: {
      type: Number,
      default: 0
    },
    suggestions: [{
      type: String
    }],
    issues: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    precheckDate: {
      type: Date
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  aiEvaluation: {
    score: {
      type: Number,
      default: 0
    },
    suggestedMarks: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    originalityScore: {
      type: Number,
      default: 0
    },
    plagiarismScore: {
      type: Number,
      default: 0
    },
    aiGeneratedProbability: {
      type: Number,
      default: 0
    },
    questions: [{
      question: String,
      options: [String],
      type: {
        type: String,
        enum: ['mcq', 'text', 'theory'],
        default: 'mcq'
      },
      expectedAnswer: String,
      studentAnswer: String,
      isCorrect: Boolean,
      points: Number
    }],
    evaluationDate: {
      type: Date
    },
    strengths: [{
      type: String
    }],
    weaknesses: [{
      type: String
    }],
    recommendations: [{
      type: String
    }]
  },
  teacherReview: {
    marks: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'reviewed', 'returned', 'approved'],
    default: 'submitted'
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);

