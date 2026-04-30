import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const OTPVerification = ({ email, onVerify, onBack, loading }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setError('');
    onVerify(email, otp);
  };

  const handleResend = () => {
    // This would trigger resend OTP functionality
    onBack(); // For now, go back to registration
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <EmailIcon sx={{ fontSize: 64, color: '#2563eb', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Verify Your Email
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We've sent a 6-digit verification code to
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2563eb' }}>
          {email}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(value);
            setError('');
          }}
          inputProps={{
            maxLength: 6,
            style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }
          }}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || otp.length !== 6}
          sx={{ mb: 2, bgcolor: '#2563eb', py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
        </Button>

        <Button
          fullWidth
          variant="text"
          onClick={handleResend}
          sx={{ color: '#64748b' }}
        >
          Didn't receive the code? Go back
        </Button>
      </form>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="caption">
          The verification code will expire in 10 minutes. Please check your spam folder if you don't see it in your inbox.
        </Typography>
      </Alert>
    </Box>
  );
};

export default OTPVerification;
