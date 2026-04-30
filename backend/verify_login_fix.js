const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

async function verifyFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testEmail = 'testfix_' + Date.now() + '@example.com';
    const testPassword = 'password123';

    // 1. Create a new user
    console.log('Creating test user...');
    const user = await User.create({
      name: 'Test Fix User',
      email: testEmail,
      password: testPassword,
      role: 'student'
    });

    const firstHash = user.password;
    console.log('First hash:', firstHash);

    // 2. Perform a save WITHOUT changing the password
    console.log('Updating user profile (not password)...');
    user.name = 'Updated Name';
    await user.save();

    const secondHash = user.password;
    console.log('Second hash:', secondHash);

    if (firstHash === secondHash) {
      console.log('✅ SUCCESS: Password was NOT re-hashed unnecessarily.');
    } else {
      console.error('❌ FAILURE: Password WAS re-hashed! The bug still exists.');
      process.exit(1);
    }

    // 3. Verify matchPassword still works
    const isMatch = await user.matchPassword(testPassword);
    if (isMatch) {
      console.log('✅ SUCCESS: matchPassword works correctly.');
    } else {
      console.error('❌ FAILURE: matchPassword failed.');
      process.exit(1);
    }

    // Cleanup
    await User.deleteOne({ _id: user._id });
    console.log('Cleanup complete');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyFix();
