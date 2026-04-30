const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide section name'],
    trim: true,
    maxlength: [50, 'Section name cannot be more than 50 characters']
  },
  description: {
    type: String,
    default: ''
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  joinCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique join code before saving
sectionSchema.pre('save', async function(next) {
  if (!this.isModified('joinCode') || !this.joinCode) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingSection = await this.constructor.findOne({ joinCode: code });
      if (!existingSection) {
        isUnique = true;
      }
    }
    
    this.joinCode = code;
  }
  next();
});

sectionSchema.index({ name: 1, teacher: 1 });

module.exports = mongoose.model('Section', sectionSchema);

