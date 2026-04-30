const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config({ path: './backend/.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetPassword() {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Ask for email
    rl.question('📧 Enter the email of the account to reset: ', async (email) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          console.error('❌ User not found with that email.');
          mongoose.connection.close();
          process.exit(1);
        }

        console.log(`👤 Found user: ${user.name} (${user.role})`);

        // 3. Ask for new password
        rl.question('🔑 Enter the new password: ', async (newPassword) => {
          try {
            if (newPassword.length < 6) {
              console.error('❌ Password must be at least 6 characters.');
              mongoose.connection.close();
              process.exit(1);
            }

            // We update the password field. 
            // The fix I just applied to User.js ensures this hashes correctly ONCE.
            user.password = newPassword;
            await user.save();

            console.log('\n✨ SUCCESS! Password has been reset correctly.');
            console.log('🚀 You can now log in with this account on the website.');
            
            mongoose.connection.close();
            process.exit(0);
          } catch (err) {
            console.error('Error saving password:', err);
            process.exit(1);
          }
        });
      } catch (err) {
        console.error('Error finding user:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Connection failure:', error);
    process.exit(1);
  }
}

console.log('--- AssignIQ Password Reset Utility ---');
resetPassword();
