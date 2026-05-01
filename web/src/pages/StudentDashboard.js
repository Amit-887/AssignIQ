import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Avatar, Chip, Stack, List, ListItem, ListItemText, ListItemAvatar, LinearProgress, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import JoinFullIcon from '@mui/icons-material/JoinFull';
import Layout from '../components/Layout';
import api from '../redux/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      formData.append('assignmentId', selectedAssignment._id);
      await api.post('/student/submit', formData);
      setSubmitDialogOpen(false);
      setSubmissionFile(null);
      setSelectedAssignment(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };
 
  const handleJoinSection = async () => {
    try {
      await api.post('/sections/join', { joinCode: joinCode.toUpperCase() });
      setJoinDialogOpen(false);
      setJoinCode('');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to join section:', error);
      alert(error.response?.data?.message || 'Failed to join section');
    }
  };
 
  const statCards = [
    { title: 'My Sections', value: dashboardData?.sections?.length || 0, icon: <AssignmentIcon />, color: '#2563eb' },
    { title: 'Pending Tasks', value: dashboardData?.pendingAssignments?.length || 0, icon: <AccessTimeIcon />, color: '#ea580c' },
    { title: 'Submitted', value: dashboardData?.submittedCount || 0, icon: <CheckCircleIcon />, color: '#059669' },
    { title: 'Avg Score', value: dashboardData?.averageScore || 'N/A', icon: <RateReviewIcon />, color: '#7c3aed' }
  ];

  const getDaysRemaining = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days) => {
    if (days <= 0) return 'error';
    if (days <= 2) return 'warning';
    return 'success';
  };

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Row 1: Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name}! 👋
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Here's your learning overview for today.
          </Typography>
        </Box>

        {!user?.isApproved && (
          <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(234, 88, 12, 0.1)' }}>
            Your account is pending approval. Please contact your administrator for access.
          </Alert>
        )}

        {/* Row 2: Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 4, 
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 30px 0 rgba(0,0,0,0.05)' },
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.title}</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: stat.color }}>{stat.value}</Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: `${stat.color}15`, 
                      color: stat.color, 
                      width: 56, 
                      height: 56,
                      borderRadius: 3,
                      border: `1px solid ${stat.color}20`
                    }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: 28 } })}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Row 3: Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
           <Grid item xs={12} md={3}>
             <Card sx={{ 
               borderRadius: 4, cursor: 'pointer',
               '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.15)', borderColor: '#2563eb' },
               border: '1px solid #e2e8f0', bgcolor: '#ffffff'
             }} onClick={() => setJoinDialogOpen(true)}>
               <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                 <Avatar sx={{ bgcolor: '#2563eb10', color: '#2563eb', borderRadius: 2 }}><JoinFullIcon /></Avatar>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Join Section</Typography>
                   <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Use a code to join</Typography>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card sx={{ 
               borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
               '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)', borderColor: '#7c3aed' },
               border: '1px solid #e2e8f0', bgcolor: '#ffffff'
             }} onClick={() => navigate('/assignments')}>
               <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                 <Avatar sx={{ bgcolor: '#7c3aed10', color: '#7c3aed', borderRadius: 2 }}><AssignmentIcon /></Avatar>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Assignments</Typography>
                   <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Step into learning</Typography>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card sx={{ 
               borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
               '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
               border: '1px solid #e2e8f0', bgcolor: '#ffffff'
             }} onClick={() => navigate('/student-sections')}>
               <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                 <Avatar sx={{ bgcolor: '#10b98110', color: '#10b981', borderRadius: 2 }}><SchoolIcon /></Avatar>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>My Sections</Typography>
                   <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>View all enrolled</Typography>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card sx={{ 
               borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
               '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
               border: '1px solid #e2e8f0', bgcolor: '#ffffff'
             }} onClick={() => navigate('/messages')}>
               <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                 <Avatar sx={{ bgcolor: '#f59e0b10', color: '#f59e0b', borderRadius: 2 }}><SendIcon /></Avatar>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Messages</Typography>
                   <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Connect & Chat</Typography>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
        </Grid>

        {/* Row 4: Analytics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={5}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 5, 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
              color: 'white',
              boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                position: 'absolute', top: '-10%', right: '-10%', width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <CardContent sx={{ p: 4, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fbbf24' }}><AutoAwesomeIcon /></Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>AI Performance Hub</Typography>
                </Box>
                
                <Stack spacing={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>Originality Index</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>{dashboardData?.averageOriginality || 0}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData?.averageOriginality || 0} 
                      sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 5 } }} 
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>Concept Mastery</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#3b82f6' }}>{dashboardData?.quizSuccessRate || 0}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData?.quizSuccessRate || 0} 
                      sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6', borderRadius: 5 } }} 
                    />
                  </Box>
                </Stack>

                <Box sx={{ mt: 5, p: 2.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="subtitle2" sx={{ color: '#fbbf24', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
                    <TrendingUpIcon fontSize="small" /> AI Suggestion
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{dashboardData?.aiSuggestion || "Keep up the great work! Your originality scores are excellent."}"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', borderRadius: 5, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: '#0f172a' }}>Performance Trend</Typography>
                <Box sx={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.performanceTrend || []}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Row 5: Lists */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 5, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Pending Assignments</Typography>
                  <Button size="small" variant="text" sx={{ fontWeight: 700 }} onClick={() => navigate('/assignments')}>View All</Button>
                </Box>
                {dashboardData?.pendingAssignments?.length > 0 ? (
                  <Stack spacing={2}>
                    {dashboardData.pendingAssignments.slice(0, 5).map((assignment, index) => {
                      const daysRemaining = getDaysRemaining(assignment.dueDate);
                      return (
                        <Box key={index} sx={{ 
                          p: 2.5, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid #f1f5f9',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{assignment.title}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{assignment.section?.name}</Typography>
                          </Box>
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Chip 
                              icon={daysRemaining <= 0 ? <WarningIcon sx={{ fontSize: '14px !important' }} /> : <AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                              label={daysRemaining <= 0 ? 'Overdue' : `${daysRemaining} days left`}
                              size="small"
                              color={getUrgencyColor(daysRemaining)}
                              sx={{ fontWeight: 800, height: 26 }}
                            />
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => { setSelectedAssignment(assignment); setSubmitDialogOpen(true); }}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3 }}
                            >
                              Submit
                            </Button>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: '#10b981', mb: 2, opacity: 0.1 }} />
                    <Typography sx={{ color: '#64748b', fontWeight: 600 }}>All assignments completed!</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 5, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: '#0f172a' }}>My Sections</Typography>
                {dashboardData?.sections?.length > 0 ? (
                  <Stack spacing={2}>
                    {dashboardData.sections.map((section, index) => (
                      <Box key={index} sx={{ 
                        p: 2, bgcolor: '#f8fafc', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2,
                        border: '1px solid #f1f5f9'
                      }}>
                        <Avatar sx={{ bgcolor: '#2563eb', width: 44, height: 44, borderRadius: 3 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{section.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{section.teacher?.name}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography sx={{ color: '#64748b', fontWeight: 600 }}>No sections joined yet.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Join Section Dialog */}
        <Dialog 
          open={joinDialogOpen} 
          onClose={() => setJoinDialogOpen(false)} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>Join New Section</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3, textAlign: 'center' }}>
              Enter the unique 6-character code from your teacher to join their class.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              label="Join Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="E.G. XJ92LK"
              inputProps={{ maxLength: 6, style: { textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.8rem', textAlign: 'center', letterSpacing: '0.4rem', fontWeight: 900 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#f8fafc' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button onClick={() => setJoinDialogOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleJoinSection} 
              disabled={joinCode.length < 6}
              sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}
            >
              Join Class
            </Button>
          </DialogActions>
        </Dialog>

        {/* Submit Assignment Dialog */}
        <Dialog 
          open={submitDialogOpen} 
          onClose={() => setSubmitDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Submit Your Work</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              You are submitting for: <b>{selectedAssignment?.title}</b>
            </Typography>
            <Box sx={{ 
              border: '2px dashed #e2e8f0', 
              borderRadius: 4, 
              p: 4, 
              textAlign: 'center',
              bgcolor: '#f8fafc',
              cursor: 'pointer',
              '&:hover': { borderColor: '#2563eb', bgcolor: '#f0f7ff' }
            }} component="label">
              <input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={(e) => setSubmissionFile(e.target.files[0])} />
              <UploadFileIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                {submissionFile ? submissionFile.name : 'Click to upload your file'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSubmitDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitAssignment} 
              disabled={!submissionFile}
              sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}
            >
              Submit Now
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      </Box>
    </Layout>
  );
};

export default StudentDashboard;

