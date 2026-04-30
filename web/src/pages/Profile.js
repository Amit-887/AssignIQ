import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Button, TextField, Chip, Stack, LinearProgress, Divider, Alert, List, ListItem, ListItemText, ListItemIcon, IconButton, Paper, CircularProgress } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { updateProfilePicture } from '../redux/slices/authSlice';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from '../redux/api';
import Layout from '../components/Layout';

const Profile = () => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const formData = new FormData();
    formData.append('picture', file);

    setUploading(true);
    try {
      await dispatch(updateProfilePicture(formData)).unwrap();
      fetchProfile(); // Refresh after upload
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const fetchProfile = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/auth/me');
      setProfileData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const user = profileData || reduxUser;
  const isTeacher = user?.role === 'teacher';

  const getRoleColor = (role) => {
    const colors = { student: '#2563eb', teacher: '#7c3aed', admin: '#0f172a' };
    return colors[role] || '#64748b';
  };

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Sidebar: Profile Card */}
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                borderRadius: 5, 
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden'
              }}>
                <Box sx={{ height: 100, background: `linear-gradient(135deg, ${getRoleColor(user?.role)} 0%, #1e293b 100%)` }} />
                <CardContent sx={{ textAlign: 'center', p: 4, mt: -8 }}>
                  <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto', mb: 3 }}>
                    <Avatar
                      sx={{ 
                        width: 140, 
                        height: 140, 
                        bgcolor: '#ffffff',
                        border: '6px solid #ffffff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        fontSize: 56,
                        color: getRoleColor(user?.role)
                      }}
                      onClick={handleAvatarClick}
                    >
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user?.name?.charAt(0)
                      )}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute', bottom: 8, right: 8, bgcolor: '#ffffff', color: '#0f172a',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', '&:hover': { bgcolor: '#f1f5f9' }
                      }}
                      size="small"
                      onClick={handleAvatarClick}
                      disabled={uploading}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    {uploading && <LinearProgress sx={{ position: 'absolute', bottom: -20, width: '100%', borderRadius: 2 }} />}
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>{user?.name}</Typography>
                  <Chip 
                    label={user?.role?.toUpperCase()} 
                    sx={{ bgcolor: `${getRoleColor(user?.role)}15`, color: getRoleColor(user?.role), fontWeight: 800, mb: 3 }} 
                  />

                  <Stack spacing={2} sx={{ textAlign: 'left', bgcolor: '#f8fafc', p: 3, borderRadius: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        <EmailIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{user?.email}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        <SchoolIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Department</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{user?.department || 'General'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        <CalendarTodayIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Joined</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ mt: 3, borderRadius: 5, border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Security Status</Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f0fdf4', borderRadius: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>Account Verified</Typography>
                      <CheckCircleIcon sx={{ color: '#10b981' }} />
                    </Box>
                    {isTeacher && (
                      <Box sx={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, 
                        bgcolor: user?.isApproved ? '#f0fdf4' : '#fff7ed', borderRadius: 3 
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: user?.isApproved ? '#166534' : '#9a3412' }}>Admin Approval</Typography>
                        {user?.isApproved ? <CheckCircleIcon sx={{ color: '#10b981' }} /> : <Chip label="Pending" size="small" color="warning" />}
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Main Content: Stats & Activity */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>Real-time Insights</Typography>
                <Button 
                  variant="outlined" 
                  startIcon={refreshing ? <CircularProgress size={16} /> : <AutoAwesomeIcon />} 
                  onClick={fetchProfile}
                  disabled={refreshing}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800 }}
                >
                  Sync Data
                </Button>
              </Box>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                {isTeacher ? (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#4f46e5' }}>{user?.stats?.totalSections || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Sections</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#7c3aed' }}>{user?.stats?.totalAssignments || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Assignments</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#f59e0b' }}>{user?.stats?.pendingReviews || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Pending</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981' }}>{user?.stats?.totalStudents || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Students</Typography>
                      </Paper>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#2563eb' }}>{user?.stats?.totalSubmissions || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Total</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981' }}>{user?.stats?.approved || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Approved</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#f59e0b' }}>{user?.stats?.pending || 0}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Pending</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 3, borderRadius: 5, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#7c3aed' }}>{user?.stats?.averageScore || 0}%</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Avg Score</Typography>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>

              <Card sx={{ borderRadius: 6, mb: 4, border: '1px solid #f1f5f9' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Recent Activity</Typography>
                  {user?.recentSubmissions?.length > 0 ? (
                    <Stack spacing={2}>
                      {user.recentSubmissions.map((submission, index) => (
                        <Box key={index} sx={{ 
                          p: 2.5, bgcolor: '#f8fafc', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          border: '1px solid #f1f5f9'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: isTeacher ? '#7c3aed10' : '#2563eb10', color: isTeacher ? '#7c3aed' : '#2563eb', borderRadius: 2 }}>
                              <AssignmentIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {isTeacher ? submission.student?.name : submission.assignment?.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                                {new Date(submission.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                {isTeacher && ` • ${submission.assignment?.title}`}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            label={submission.status.replace('_', ' ')} 
                            size="small" 
                            color={submission.status === 'approved' ? 'success' : 'warning'}
                            sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }} 
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No recent activity found.</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 6, border: '1px solid #f1f5f9' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>
                    {isTeacher ? 'My Sections' : 'Enrolled Sections'}
                  </Typography>
                  {user?.sections?.length > 0 ? (
                    <Grid container spacing={2}>
                      {user.sections.map((section, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ p: 2, border: '1px solid #f1f5f9', borderRadius: 4, bgcolor: '#f8fafc' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>{section.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                              {isTeacher ? `${section.students?.length || 0} Students` : `Teacher: ${section.teacher?.name}`}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No sections joined yet.</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
};

export default Profile;

