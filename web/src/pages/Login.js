import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Box, TextField, Button, Card, CardContent, Alert, Tabs, Tab, InputAdornment, IconButton, Divider, useMediaQuery, useTheme, Avatar, Stack } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Layout from '../components/Layout';
import { login, googleLogin, clearError } from '../redux/slices/authSlice';
import { loadGoogleScript, initializeGoogleAuth, renderGoogleButton } from '../utils/googleAuth';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0); // Start with student tab selected
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const roleRef = React.useRef(formData.role);
  const isInitializingRef = React.useRef(false);
 
  // Keep role ref updated
  useEffect(() => {
    roleRef.current = formData.role;
  }, [formData.role]);

  // Load Google OAuth script on component mount
  useEffect(() => {
    const initGoogleAuth = async () => {
      if (isInitializingRef.current || googleScriptLoaded) return;
      isInitializingRef.current = true;
      try {
        console.log('Loading Google OAuth script...');
        await loadGoogleScript();
        console.log('Google OAuth script loaded successfully');
        setGoogleScriptLoaded(true);
        
        // Initialize Google Auth
        const handleGoogleResponse = async (response) => {
          try {
            console.log('Google OAuth response received:', response);
            console.log('Response credential:', response.credential);
            console.log('Selected role (from ref):', roleRef.current);
            
            if (!response.credential) {
              console.error('No credential in Google response');
              alert('Google authentication failed. Please try again.');
              return;
            }
            
            const result = await dispatch(googleLogin({
              idToken: response.credential,
              role: roleRef.current,
              department: roleRef.current === 'teacher' ? 'Computer Science' : undefined
            }));
            
            console.log('Google login dispatch result:', result);
            
            if (googleLogin.fulfilled.match(result)) {
              console.log('Google login successful, navigating to dashboard');
              navigate('/dashboard');
            } else {
              console.error('Google login failed:', result.payload);
              alert('Login failed: ' + (result.payload || 'Unknown error'));
            }
          } catch (error) {
            console.error('Google login error:', error);
            alert('Google login failed: ' + error.message);
          }
        };

        initializeGoogleAuth(handleGoogleResponse);
        console.log('Google OAuth initialized');
      } catch (error) {
        console.error('Failed to load Google OAuth script:', error);
        setGoogleScriptLoaded(false);
      }
    };

    initGoogleAuth();
  }, [dispatch, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const roles = ['student', 'teacher', 'admin'];
    setFormData({ ...formData, role: roles[newValue] });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting login with data:', formData);
    try {
      const result = await dispatch(login(formData));
      console.log('Login result:', result);
      console.log('Result meta:', result.meta);
      console.log('Result payload:', result.payload);
      
      if (result.meta.requestStatus === 'fulfilled') {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.error('Login failed:', result.payload);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Google login button clicked');
    console.log('Google script loaded:', googleScriptLoaded);
    console.log('Window google available:', !!window.google);
    console.log('Window google accounts available:', !!(window.google && window.google.accounts));
    
    if (!googleScriptLoaded) {
      alert('Google OAuth is still loading. Please try again in a moment.');
      return;
    }
    
    try {
      // Check if Google OAuth is available
      if (!window.google || !window.google.accounts) {
        console.error('Google OAuth not available');
        alert('Google OAuth not available. Please check your internet connection and refresh the page.');
        return;
      }

      console.log('Using Google Sign-In button approach...');
      
      // Remove any existing Google button
      const existingButton = document.getElementById('google-signin-button');
      if (existingButton) {
        existingButton.remove();
      }
      
      // Find the form container to insert the button
      const formElement = document.querySelector('form');
      if (!formElement) {
        console.error('Form element not found');
        alert('Unable to create Google Sign-In button. Please refresh the page.');
        return;
      }
      
      // Create a container for the Google button
      const googleContainer = document.createElement('div');
      googleContainer.id = 'google-signin-button';
      googleContainer.style.cssText = `
        margin: 20px 0;
        padding: 10px;
        border: 2px dashed #4285f4;
        border-radius: 8px;
        background-color: #f8f9fa;
        text-align: center;
      `;
      
      // Add instruction text
      const instructionText = document.createElement('div');
      instructionText.textContent = 'Google Sign-In Button (Click below to authenticate)';
      instructionText.style.cssText = `
        margin-bottom: 10px;
        font-size: 14px;
        color: #666;
        font-weight: 500;
      `;
      
      // Create the actual Google button container
      const googleButtonDiv = document.createElement('div');
      googleButtonDiv.style.cssText = `
        display: inline-block;
        min-height: 50px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 5px;
      `;
      
      googleContainer.appendChild(instructionText);
      googleContainer.appendChild(googleButtonDiv);
      
      // Insert the Google button container after the form
      formElement.parentNode.insertBefore(googleContainer, formElement.nextSibling);
      
      console.log('Google button container created, rendering Google button...');
      
      // Render the Google Sign-In button
      try {
        window.google.accounts.id.renderButton(googleButtonDiv, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 300
        });
        console.log('Google button rendered successfully');
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        googleContainer.innerHTML = `
          <div style="color: red; padding: 10px;">
            Error loading Google Sign-In. Please try again.
          </div>
        `;
      }
      
      // Hide the original "Continue with Google" button
      const currentButton = document.querySelector('button[aria-label*="Google"]');
      if (currentButton) {
        currentButton.style.display = 'none';
      }
      
      // Auto-cleanup after 30 seconds
      setTimeout(() => {
        if (googleContainer.parentNode) {
          googleContainer.parentNode.removeChild(googleContainer);
        }
        if (currentButton) {
          currentButton.style.display = 'block';
        }
      }, 30000);
      
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to initiate Google login. Please try again.');
    }
  };

  const roleIcons = [<SchoolIcon />, <PersonIcon />, <AdminPanelSettingsIcon />];
  const roleNames = ['Student', 'Teacher', 'Admin'];

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
              position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 4, letterSpacing: '-0.04em', position: 'relative' }}>
              Master your <br/>
              <Box component="span" sx={{ color: '#3b82f6' }}>workflow</Box> with AI.
            </Typography>
            <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400, mb: 6, maxWidth: 450, position: 'relative' }}>
              Experience the next evolution of educational management. Secure, intelligent, and designed for high performance.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
               <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}><SchoolIcon /></Avatar>
               <Avatar sx={{ bgcolor: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' }}><LockIcon /></Avatar>
               <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><GoogleIcon /></Avatar>
            </Box>
          </Box>
        )}

        {/* Right Side: Login Form */}
        <Box sx={{ 
          flex: { xs: 1, md: 0.8 }, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, md: 8 }
        }}>
          <Box sx={{ maxWidth: 450, width: '100%' }}>
            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Sign in to continue to your workspace
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
                {error}
              </Alert>
            )}

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
              <Tab label="Admin" sx={{ textTransform: 'none' }} />
            </Tabs>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
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
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="body2" component={Link} to="/forgot-password" sx={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                    Forgot password?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    height: 56, 
                    borderRadius: 3, 
                    fontWeight: 700, 
                    fontSize: '1rem',
                    boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)',
                    mt: 1
                  }}
                >
                  {loading ? 'Processing...' : `Sign in as ${roleNames[tabValue]}`}
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
              onClick={handleGoogleLogin}
              disabled={!googleScriptLoaded || loading}
              sx={{ 
                height: 56, 
                borderRadius: 3, 
                borderColor: '#e2e8f0', 
                color: '#475569',
                fontWeight: 700,
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
              }}
            >
              Continue with Google
            </Button>

            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                New to AssignIQ?{' '}
                <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>
                  Create an account
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Login;


