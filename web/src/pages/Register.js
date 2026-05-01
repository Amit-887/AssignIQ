import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Box, TextField, Button, Card, CardContent, Divider, Alert, Tabs, Tab, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme, Avatar, Stack } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import OTPVerification from '../components/OTPVerification';
import Layout from '../components/Layout';
import { register, googleLogin, clearError } from '../redux/slices/authSlice';
import api from '../redux/api';
import { loadGoogleScript, initializeGoogleAuth } from '../utils/googleAuth';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    phone: '',
    documentType: 'other'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roleRef = React.useRef(formData.role);
  const isInitializingRef = React.useRef(false);

  // Keep role ref updated
  useEffect(() => {
    roleRef.current = formData.role;
  }, [formData.role]);

  // Load Google OAuth script
  useEffect(() => {
    const initGoogleAuth = async () => {
      if (isInitializingRef.current || googleScriptLoaded) return;
      isInitializingRef.current = true;
      try {
        await loadGoogleScript();
        setGoogleScriptLoaded(true);
        
        const handleGoogleResponse = async (response) => {
          try {
            if (!response.credential) return;
            
            const result = await dispatch(googleLogin({
              idToken: response.credential,
              role: roleRef.current,
              department: roleRef.current === 'teacher' ? 'Computer Science' : undefined
            }));
            
            if (googleLogin.fulfilled.match(result)) {
              navigate('/dashboard');
            } else {
              setValidationError(result.payload || 'Google registration failed');
            }
          } catch (error) {
            console.error('Google Auth Error:', error);
          }
        };

        initializeGoogleAuth(handleGoogleResponse);
      } catch (error) {
        console.error('Failed to load Google script:', error);
      }
    };

    initGoogleAuth();
  }, [dispatch, navigate]);

  const roles = [
    { value: 'student', label: 'Student', icon: <SchoolIcon /> },
    { value: 'teacher', label: 'Teacher', icon: <PersonIcon /> }
  ];

  const documentTypes = [
    { value: 'degree', label: 'Degree Certificate' },
    { value: 'certificate', label: 'Professional Certificate' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'other', label: 'Other Document' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
    setValidationError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setValidationError('');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFormData({ ...formData, role: roles[newValue].value });
    setSelectedFile(null); // Clear file when switching roles
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    // For teachers, require document upload
    if (formData.role === 'teacher' && !selectedFile) {
      setValidationError('Please upload a verification document');
      return;
    }

    // For teachers, send OTP first
    if (formData.role === 'teacher') {
      const userData = new FormData();
      userData.append('name', formData.name);
      userData.append('email', formData.email);
      userData.append('password', formData.password);
      userData.append('role', formData.role);
      userData.append('department', formData.department);
      userData.append('phone', formData.phone);
      userData.append('documentType', formData.documentType);

      if (selectedFile) {
        userData.append('document', selectedFile);
      }

      try {
        setIsSubmitting(true);
        const response = await api.post('/auth/send-otp', userData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          setPendingEmail(formData.email);
          setShowOTP(true);
        } else {
          setValidationError(response.data.message || 'Failed to send OTP');
        }
      } catch (error) {
        console.error('--- FRONTEND_REGISTER_ERROR ---', error);
        setValidationError(error.response?.data?.message || 'Failed to send verification email');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // For students, use regular registration
      const userData = new FormData();
      userData.append('name', formData.name);
      userData.append('email', formData.email);
      userData.append('password', formData.password);
      userData.append('role', formData.role);
      userData.append('department', formData.department);
      userData.append('phone', formData.phone);
      userData.append('documentType', formData.documentType);

      const result = await dispatch(register(userData));
      if (register.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    }
  };

  const handleOTPVerify = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      if (response.data.success) {
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setValidationError(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to verify OTP');
    }
  };

  const handleBackToRegister = () => {
    setShowOTP(false);
    setPendingEmail('');
  };

  const handleGoogleRegister = async () => {
    if (!googleScriptLoaded) {
      alert('Google OAuth is still loading...');
      return;
    }
    
    try {
      if (!window.google?.accounts?.id) return;

      const existingButton = document.getElementById('google-reg-button');
      if (existingButton) existingButton.remove();
      
      const formElement = document.querySelector('form');
      const googleContainer = document.createElement('div');
      googleContainer.id = 'google-reg-button';
      googleContainer.style.cssText = 'margin: 20px 0; text-align: center;';
      
      const googleButtonDiv = document.createElement('div');
      googleContainer.appendChild(googleButtonDiv);
      formElement.parentNode.insertBefore(googleContainer, formElement.nextSibling);
      
      window.google.accounts.id.renderButton(googleButtonDiv, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        width: 300
      });

      // Auto-cleanup
      setTimeout(() => {
        if (googleContainer.parentNode) googleContainer.parentNode.removeChild(googleContainer);
      }, 30000);
      
    } catch (error) {
      console.error('Google register error:', error);
    }
  };

  return (
    <Layout>
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        bgcolor: '#ffffff'
      }}>
        {/* Left Side: Brand Visual */}
        {!isMobile && (
          <Box sx={{ 
            flex: 1, 
            bgcolor: '#0f172a', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 8,
            color: 'white',
            overflow: 'hidden'
          }}>
            {/* Background Accent */}
            <Box sx={{ 
              position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, letterSpacing: '-0.04em', position: 'relative' }}>
              Join the <br/>
              <Box component="span" sx={{ color: '#7c3aed' }}>community</Box> of experts.
            </Typography>
            <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400, mb: 6, maxWidth: 450, position: 'relative' }}>
              Create your account in seconds and start managing your educational journey with the most advanced platform.
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
               <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}><AssignmentIcon /></Avatar>
               <Avatar sx={{ bgcolor: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' }}><CodeIcon /></Avatar>
               <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><ChatIcon /></Avatar>
            </Stack>
          </Box>
        )}

        {/* Right Side: Register Form */}
        <Box sx={{ 
          flex: { xs: 1, md: 0.8 }, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, md: 8 }
        }}>
          <Box sx={{ maxWidth: 500, width: '100%', py: 4 }}>
            {showOTP ? (
              <OTPVerification
                email={pendingEmail}
                onVerify={handleOTPVerify}
                onBack={handleBackToRegister}
                loading={loading}
              />
            ) : (
              <>
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
                    Create Account
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Start your journey with AssignIQ today
                  </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}
                {validationError && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{validationError}</Alert>}

                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ 
                    mb: 4, 
                    bgcolor: '#f1f5f9', 
                    borderRadius: 3, 
                    p: 0.5,
                    '& .MuiTabs-indicator': { height: '100%', borderRadius: 2.5, bgcolor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
                    '& .MuiTab-root': { zIndex: 1, fontWeight: 700, borderRadius: 2.5, minHeight: 44 }
                  }}
                >
                  <Tab label="Student" sx={{ textTransform: 'none' }} />
                  <Tab label="Teacher" sx={{ textTransform: 'none' }} />
                </Tabs>

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 3 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 3 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {formData.role === 'teacher' && (
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          InputProps={{ sx: { borderRadius: 3 } }}
                        />
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          InputProps={{ sx: { borderRadius: 3 } }}
                        />
                        <FormControl fullWidth required>
                          <InputLabel>Document Type</InputLabel>
                          <Select
                            name="documentType"
                            value={formData.documentType}
                            onChange={handleChange}
                            label="Document Type"
                            sx={{ borderRadius: 3 }}
                          >
                            {documentTypes.map((doc) => (
                              <MenuItem key={doc.value} value={doc.value}>{doc.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                          sx={{ height: 56, borderRadius: 3, borderColor: '#e2e8f0', color: '#475569' }}
                        >
                          {selectedFile ? selectedFile.name : 'Upload Verification ID'}
                          <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
                        </Button>
                      </Stack>
                    )}

                    {formData.role === 'student' && (
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: 3 } }}
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 3 },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 3 } }}
                    />

                    {formData.role === 'teacher' && (
                      <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.8rem' }}>
                        Teacher accounts require manual verification by our admins.
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || isSubmitting}
                      sx={{ 
                        height: 56, borderRadius: 3, fontWeight: 700, mt: 2,
                        boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)'
                      }}
                    >
                      {loading || isSubmitting ? 'Processing...' : formData.role === 'teacher' ? 'Verify & Continue' : 'Create Account'}
                    </Button>
                  </Stack>
                </form>

                <Divider sx={{ my: 4 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>OR</Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleRegister}
                  sx={{ 
                    height: 56, borderRadius: 3, borderColor: '#e2e8f0', color: '#475569', fontWeight: 700
                  }}
                >
                  Continue with Google
                </Button>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Register;


