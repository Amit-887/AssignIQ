const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
require('dotenv').config();

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000, // 10 seconds
  timeout: 10000 // 10 seconds
});

// Generate OTP
const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
};

// Send OTP email
const sendOTPEmail = async (email, name, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@assigniq.com',
      to: email,
      subject: '🔐 Verify Your Email - AssignIQ Teacher Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">AssignIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Educational Management System</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hello ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for registering as a teacher on AssignIQ. To complete your registration, please verify your email address using the OTP below:
            </p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Your Verification Code</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 10px 0;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">This code will expire in 10 minutes</p>
            </div>
            <p style="color: #475569; line-height: 1.6;">
              If you didn't request this verification, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This is an automated message from AssignIQ. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    return false;
  }
};

// Store OTP with expiration
const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, { otp, expiresAt });
};

// Verify OTP
const verifyOTP = (email, providedOTP) => {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (storedData.otp !== providedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully' };
};

// Send registration confirmation email
const sendRegistrationConfirmationEmail = async (teacherEmail, teacherName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@assigniq.com',
      to: teacherEmail,
      subject: '✅ Registration Received - AssignIQ Teacher Application',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">AssignIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Educational Management System</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Registration Received! 📋</h2>
            <p style="color: #475569; line-height: 1.6;">
              Dear ${teacherName},
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for your interest in becoming a teacher at AssignIQ! We have successfully received your application and verification documents.
            </p>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 600;">Next Steps:</p>
              <ol style="color: #92400e; margin: 10px 0 0 20px;">
                <li>Our admin team will review your application</li>
                <li>Your documents will be verified</li>
                <li>You'll receive an email notification once the review is complete</li>
              </ol>
            </div>
            <p style="color: #475569; line-height: 1.6;">
              This process typically takes 1-2 business days. You'll be notified via email once a decision has been made.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #e0f2fe; padding: 15px 25px; border-radius: 8px;">
                <p style="color: #0369a1; margin: 0; font-weight: 600;">Application Status: <span style="color: #059669;">Under Review</span></p>
              </div>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Registration confirmation email sent to ${teacherEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send registration confirmation email:', error.message);
    return false;
  }
};

// Send approval email
const sendApprovalEmail = async (teacherEmail, teacherName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@assigniq.com',
      to: teacherEmail,
      subject: '🎉 Your Teacher Account Has Been Approved - AssignIQ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">AssignIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Educational Management System</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Congratulations ${teacherName}! 🎊</h2>
            <p style="color: #475569; line-height: 1.6;">
              Your teacher registration has been <strong style="color: #059669;">APPROVED</strong> by the admin.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              You can now log in to your AssignIQ teacher account and start creating sections, assignments, and managing your students.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you didn't register for an AssignIQ teacher account, please ignore this email or contact support.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${teacherEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send approval email:', error.message);
    // Don't fail the approval if email fails
    return false;
  }
};

// Send rejection email
const sendRejectionEmail = async (teacherEmail, teacherName, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@assigniq.com',
      to: teacherEmail,
      subject: 'Teacher Registration Update - AssignIQ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">AssignIQ</h1>
            <p style="color: white; margin: 10px 0 0 0;">Educational Management System</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hello ${teacherName},</h2>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for your interest in becoming a teacher at AssignIQ.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              After reviewing your registration, we regret to inform you that your application was <strong style="color: #dc2626;">NOT APPROVED</strong> at this time.
            </p>
            ${reason ? `<p style="color: #475569; line-height: 1.6;"><strong>Reason:</strong> ${reason}</p>` : ''}
            <p style="color: #475569; line-height: 1.6;">
              If you have any questions or would like to resubmit your application with additional documentation, please contact the admin team.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This is an automated message from AssignIQ.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent to ${teacherEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send rejection email:', error.message);
    return false;
  }
};

// Send notification to Admin about new teacher registration
const sendAdminNotificationEmail = async (teacherData) => {
  try {
    const adminEmail = 'admin@assigniq.com'; // Default admin email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: '🚨 New Teacher Registration Pending Approval',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2>New Teacher Registration</h2>
          <p>A new teacher has registered and is waiting for your approval.</p>
          <ul>
            <li><strong>Name:</strong> ${teacherData.name}</li>
            <li><strong>Email:</strong> ${teacherData.email}</li>
            <li><strong>Department:</strong> ${teacherData.department}</li>
            <li><strong>Phone:</strong> ${teacherData.phone}</li>
          </ul>
          <p>Please log in to the Admin Dashboard to review their documents and approve the account.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent for ${teacherData.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error.message);
    return false;
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendOTPEmail,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendRegistrationConfirmationEmail,
  sendAdminNotificationEmail
};

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('--- EMAIL_TRANSPORT_ERROR ---');
    console.error(error);
  } else {
    console.log('--- EMAIL_TRANSPORT_READY ---');
  }
});

