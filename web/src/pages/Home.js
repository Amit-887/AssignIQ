import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Button, Box, Grid, Card, CardContent, Avatar, Stack, Chip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersIcon from '@mui/icons-material/Layers';
import Layout from '../components/Layout';

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const features = [
    {
      icon: <SchoolIcon sx={{ fontSize: 36, color: '#2563eb' }} />,
      title: 'Role-Based Ecosystem',
      description: 'Intelligent, clutter-free dashboards dynamically tailored for Students, Teachers, and Admins to maximize focus.'
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 36, color: '#7c3aed' }} />,
      title: 'Smart Assignments',
      description: 'Seamlessly submit and evaluate with instant AI content analysis and comprehensive anti-plagiarism verification.'
    },
    {
      icon: <CodeIcon sx={{ fontSize: 36, color: '#10b981' }} />,
      title: 'Integrated IDE',
      description: 'Built-in compiler supporting Python, Java, C, and C++ with real-time AI-driven cheating detection.'
    },
    {
      icon: <ChatIcon sx={{ fontSize: 36, color: '#f59e0b' }} />,
      title: 'Real-Time Sync',
      description: 'WhatsApp-style group and direct messaging with instant 50MB file sharing and socket delivery.'
    },
    {
      icon: <CheckCircleIcon sx={{ fontSize: 36, color: '#ef4444' }} />,
      title: 'AI Auto-Evaluation',
      description: 'Groundbreaking automatic grading through intelligent, context-aware student quiz sessions.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 36, color: '#06b6d4' }} />,
      title: 'Enterprise Security',
      description: 'Complete administrative oversight, active report resolution, and robust data protection.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '500+', label: 'Verified Teachers' },
    { value: '50K+', label: 'Assignments Processed' },
    { value: '99.9%', label: 'System Uptime' }
  ];

  return (
    <Layout>
      <Box sx={{ bgcolor: '#ffffff', overflow: 'hidden' }}>
        
        {/* Hero Section with Mesh Gradient */}
        <Box sx={{ 
          position: 'relative', 
          pt: { xs: 10, md: 18 }, 
          pb: { xs: 12, md: 22 }, 
          overflow: 'hidden',
          background: 'radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)'
        }}>
          {/* Animated Background Blobs */}
          <Box sx={{
            position: 'absolute', top: '10%', right: '-5%', width: 400, height: 400,
            borderRadius: '50%', background: 'rgba(37, 99, 235, 0.05)',
            filter: 'blur(80px)', animation: 'pulse 8s infinite ease-in-out'
          }} />
          <Box sx={{
            position: 'absolute', bottom: '10%', left: '-5%', width: 300, height: 300,
            borderRadius: '50%', background: 'rgba(124, 58, 237, 0.05)',
            filter: 'blur(80px)', animation: 'pulse 10s infinite ease-in-out', animationDelay: '2s'
          }} />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ animation: 'fadeInUp 0.8s ease-out' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
                    <Chip 
                      label="New" 
                      size="small" 
                      sx={{ bgcolor: '#2563eb', color: 'white', fontWeight: 800, height: 24 }} 
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>
                      AssignIQ 2.0 is now available
                    </Typography>
                  </Stack>

                  <Typography variant="h1" sx={{ 
                    fontWeight: 900, 
                    fontSize: { xs: '3rem', md: '4.5rem' }, 
                    lineHeight: 1.1, 
                    mb: 3, 
                    color: '#0f172a',
                    letterSpacing: '-0.04em'
                  }}>
                    Empowering the <br/>
                    <Box component="span" sx={{ 
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Next Generation.
                    </Box>
                  </Typography>
                  
                  <Typography variant="h6" sx={{ mb: 6, color: '#475569', fontWeight: 400, lineHeight: 1.6, maxWidth: 600, fontSize: '1.25rem' }}>
                    A unified workspace for modern education. AI-driven grading, real-time collaboration, and secure code execution in one professional platform.
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    {isAuthenticated ? (
                      <Button
                        component={Link} to="/dashboard"
                        variant="contained" size="large"
                        sx={{ 
                          height: 56, px: 6, fontSize: '1.1rem', borderRadius: 3,
                          boxShadow: '0 20px 40px -10px rgba(37,99,235,0.4)',
                        }}
                      >
                        Launch Dashboard
                      </Button>
                    ) : (
                      <>
                        <Button
                          component={Link} to="/register"
                          variant="contained" size="large"
                          sx={{ 
                            height: 56, px: 6, fontSize: '1.1rem', borderRadius: 3,
                            boxShadow: '0 20px 40px -10px rgba(37,99,235,0.4)',
                          }}
                        >
                          Get Started Free
                        </Button>
                        <Button
                          component={Link} to="/login"
                          variant="outlined" size="large"
                          sx={{ 
                            height: 56, px: 6, fontSize: '1.1rem', borderRadius: 3,
                            borderColor: '#e2e8f0', color: '#0f172a', bgcolor: 'white',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                          }}
                        >
                          View Demo
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ 
                  position: 'relative', 
                  animation: 'float 6s ease-in-out infinite',
                  perspective: '1000px'
                }}>
                  {/* Decorative Elements */}
                  <Box sx={{
                    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                    bgcolor: 'rgba(37, 99, 235, 0.1)', borderRadius: 4, zIndex: -1, transform: 'rotate(15deg)'
                  }} />
                  <Box sx={{
                    position: 'absolute', bottom: -40, left: -40, width: 80, height: 80,
                    bgcolor: 'rgba(124, 58, 237, 0.1)', borderRadius: '50%', zIndex: -1
                  }} />

                  <Card sx={{
                    borderRadius: 5,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.15)',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Task Overview</Typography>
                        <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40 }}><LayersIcon fontSize="small" /></Avatar>
                      </Box>
                      <Stack spacing={3}>
                         <Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>AI ANALYSIS</Typography>
                             <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>94%</Typography>
                           </Box>
                           <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                             <Box sx={{ width: '94%', height: '100%', bgcolor: '#2563eb', borderRadius: 3 }} />
                           </Box>
                         </Box>
                         <Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>VERIFICATION</Typography>
                             <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>COMPLETED</Typography>
                           </Box>
                           <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                             <Box sx={{ width: '100%', height: '100%', bgcolor: '#10b981', borderRadius: 3 }} />
                           </Box>
                         </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ bgcolor: '#f8fafc', p: 3, display: 'flex', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Real-time workspace synchronization enabled</Typography>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Stats Section */}
        <Box sx={{ py: 10, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Features Grid */}
        <Container maxWidth="lg" sx={{ py: 15 }}>
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' }, letterSpacing: '-0.03em' }}>
              Built for Modern Standards.
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, maxWidth: 700, mx: 'auto', lineHeight: 1.6, fontSize: '1.2rem' }}>
              AssignIQ combines cutting-edge AI with a seamless user experience to provide a professional educational environment.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ 
                  height: '100%', p: 2, bgcolor: 'transparent',
                  '&:hover': { bgcolor: '#ffffff' }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      width: 64, height: 64, borderRadius: 3, bgcolor: '#ffffff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)', mb: 4, border: '1px solid #f1f5f9'
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CTA Section */}
        <Container maxWidth="lg" sx={{ pb: 15 }}>
          <Box sx={{ 
            bgcolor: '#0f172a', borderRadius: 6, p: { xs: 6, md: 10 },
            textAlign: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: '0 40px 80px -20px rgba(15,23,42,0.3)'
          }}>
            {/* Background Accent */}
            <Box sx={{ 
              position: 'absolute', top: '-50%', right: '-20%', width: 500, height: 500,
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, color: 'white', letterSpacing: '-0.02em' }}>
              Ready to transform your workflow?
            </Typography>
            <Typography variant="h6" sx={{ mb: 8, color: '#94a3b8', maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
              Join thousands of students and teachers already using AssignIQ to simplify their educational journey.
            </Typography>
            <Button
              component={Link} to="/register"
              variant="contained" size="large"
              sx={{ 
                height: 64, px: 8, fontSize: '1.2rem', borderRadius: 4,
                bgcolor: 'white', color: '#0f172a', fontWeight: 800,
                '&:hover': { bgcolor: '#f8fafc', transform: 'translateY(-2px)' }
              }}
            >
              Get Started for Free
            </Button>
          </Box>
        </Container>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0); }
              50% { transform: translateY(-20px) rotate(1deg); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </Box>
    </Layout>
  );
};

export default Home;
