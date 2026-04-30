const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  verificationDocument: String,
  documentName: String,
  documentType: String,
  isApproved: Boolean,
  isActive: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

const checkTeachers = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assigniq';
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all teachers
    const teachers = await User.find({ role: 'teacher' }).sort('-createdAt');
    
    console.log('=== All Teachers in Database ===\n');
    console.log(`Total teachers: ${teachers.length}\n`);
    
    teachers.forEach((teacher, index) => {
      console.log(`--- Teacher ${index + 1} ---`);
      console.log(`Name: ${teacher.name}`);
      console.log(`Email: ${teacher.email}`);
      console.log(`isApproved: ${teacher.isApproved}`);
      console.log(`isActive: ${teacher.isActive}`);
      console.log(`Document Name: ${teacher.documentName || 'NONE'}`);
      console.log(`Document Type: ${teacher.documentType || 'NONE'}`);
      console.log(`Verification Document Path: ${teacher.verificationDocument || 'NONE'}`);
      console.log(`Created At: ${teacher.createdAt}`);
      console.log('');
    });

    // Get pending teachers
    const pendingTeachers = await User.find({ 
      role: 'teacher', 
      isApproved: false,
      isActive: true 
    });
    
    console.log('=== Pending Teachers (for admin approval) ===\n');
    console.log(`Total pending: ${pendingTeachers.length}\n`);
    
    pendingTeachers.forEach((teacher, index) => {
      console.log(`--- Pending Teacher ${index + 1} ---`);
      console.log(`Name: ${teacher.name}`);
      console.log(`Email: ${teacher.email}`);
      console.log(`Document Name: ${teacher.documentName || 'NONE'}`);
      console.log(`Verification Document: ${teacher.verificationDocument || 'NONE'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkTeachers();

