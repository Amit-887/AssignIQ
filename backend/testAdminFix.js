const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  verificationDocument: String,
  documentName: String,
  documentType: String,
  isApproved: Boolean,
  isActive: Boolean,
  department: String,
  phone: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

const testAdminDashboard = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assigniq';
    
    await mongoose.connect(MONGODB_URI);
    console.log('=== Testing Admin Dashboard Query Results ===\n');

    // This is the FIXED query from adminController.js
    const pendingTeachers = await User.find({
      role: 'teacher',
      isApproved: false
    }).select('name email department phone verificationDocument documentName documentType createdAt isActive');

    console.log(`Found ${pendingTeachers.length} pending teachers:\n`);
    
    pendingTeachers.forEach((teacher, index) => {
      console.log(`--- Teacher ${index + 1} ---`);
      console.log(`Name: ${teacher.name}`);
      console.log(`Email: ${teacher.email}`);
      console.log(`Department: ${teacher.department || 'Not specified'}`);
      console.log(`Phone: ${teacher.phone || 'Not specified'}`);
      console.log(`Document Name: ${teacher.documentName || 'NONE'}`);
      console.log(`Document Type: ${teacher.documentType || 'NONE'}`);
      console.log(`Verification Document Path: ${teacher.verificationDocument || 'NONE'}`);
      console.log(`isActive: ${teacher.isActive}`);
      console.log(`Created At: ${teacher.createdAt}`);
      
      // Check if document would be visible in frontend
      if (teacher.verificationDocument) {
        console.log(`✓ Document IS available for display`);
      } else {
        console.log(`✗ Document NOT available for display`);
      }
      console.log('');
    });

    console.log('\n=== Frontend Display Check ===');
    pendingTeachers.forEach((teacher, index) => {
      const hasDocument = teacher.verificationDocument && teacher.documentName;
      console.log(`Teacher ${index + 1} (${teacher.name}): ${hasDocument ? '✓ Will show document info' : '✗ No document to show'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testAdminDashboard();

