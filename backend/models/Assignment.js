const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide assignment title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide assignment description']
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide due date']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Please provide maximum marks'],
    min: [1, 'Maximum marks must be at least 1']
  },
  instructions: {
    type: String,
    default: ''
  },
  attachments: [{
    type: String
  }],
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'txt']
  },
  maxFileSize: {
    type: Number,
    default: 10485760 // 10MB in bytes
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'active'
  },
  isAiEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

assignmentSchema.index({ section: 1, dueDate: 1 });
assignmentSchema.index({ teacher: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);

