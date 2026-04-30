import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Avatar, Chip, Stack, List, ListItem, ListItemText, ListItemAvatar, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Layout from '../components/Layout';
import api from '../redux/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [newSection, setNewSection] = useState({ name: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', sectionId: '', dueDate: '', maxMarks: 100 });
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [createdJoinCode, setCreatedJoinCode] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/teacher/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      const response = await api.post('/teacher/sections', newSection);
      setCreateSectionOpen(false);
      setNewSection({ name: '', description: '' });
      setCreatedJoinCode(response.data.data.joinCode);
      setShowJoinCode(true);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await api.post('/teacher/assignments', newAssignment);
      setCreateAssignmentOpen(false);
      setNewAssignment({ title: '', description: '', sectionId: '', dueDate: '', maxMarks: 100 });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert(error.response?.data?.message || 'Failed to create assignment. Please fill all fields.');
    }
  };
 
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };
 
  const statCards = [
    { title: 'Total Sections', value: dashboardData?.totalSections || 0, icon: <GroupsIcon />, color: '#2563eb' },
    { title: 'Total Students', value: dashboardData?.totalStudents || 0, icon: <PersonIcon />, color: '#7c3aed' },
    { title: 'Assignments', value: dashboardData?.totalAssignments || 0, icon: <AssignmentIcon />, color: '#059669' },
    { title: 'Pending Reviews', value: dashboardData?.pendingSubmissions || 0, icon: <RateReviewIcon />, color: '#ea580c' }
  ];

  if (loading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
  }

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Row 1: Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name}! 🎓
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Here's what's happening with your classes today.
          </Typography>
        </Box>

        {/* Row 2: Stats Cards */}
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
                transition: 'transform 0.3s ease',
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

        {/* Row 3: Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.15)', borderColor: '#2563eb' },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff'
            }} onClick={() => setCreateSectionOpen(true)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                <Avatar sx={{ bgcolor: '#2563eb10', color: '#2563eb', borderRadius: 2 }}><AddIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Create Section</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Start a new learning group</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)', borderColor: '#7c3aed' },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff'
            }} onClick={() => setCreateAssignmentOpen(true)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                <Avatar sx={{ bgcolor: '#7c3aed10', color: '#7c3aed', borderRadius: 2 }}><AssignmentIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Create Assignment</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Post a challenge for students</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
              border: '1px solid #e2e8f0', bgcolor: '#ffffff'
            }} onClick={() => navigate('/assignments')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                <Avatar sx={{ bgcolor: '#10b98110', color: '#10b981', borderRadius: 2 }}><VisibilityIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Review Submissions</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Grade & give AI feedback</Typography>
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
              background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', 
              color: 'white',
              boxShadow: '0 20px 40px -10px rgba(67,56,202,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                position: 'absolute', bottom: '-20%', left: '-10%', width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              <CardContent sx={{ p: 4, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fbbf24' }}><AutoAwesomeIcon /></Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>AI Grading Insights</Typography>
                </Box>
                
                <Stack spacing={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>AI Confidence Level</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>94%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={94} 
                      sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#fbbf24', borderRadius: 5 } }} 
                    />
                  </Box>
                  <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
                      <AssignmentTurnedInIcon fontSize="small" /> System Auto-Check
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                      {dashboardData?.pendingSubmissions || 0} submissions are waiting with AI-suggested marks. Review them to finalize grades.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', borderRadius: 5, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>Submission Originality Overview</Typography>
                <Box sx={{ height: 280, width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Original', value: 75 },
                          { name: 'AI/Plagiarized', value: 25 }
                        ]}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Recent Submissions</Typography>
                  <Button size="small" variant="text" sx={{ fontWeight: 700 }} onClick={() => navigate('/assignments')}>View All</Button>
                </Box>
                {dashboardData?.recentSubmissions?.length > 0 ? (
                  <List>
                    {dashboardData.recentSubmissions.slice(0, 5).map((submission, index) => (
                      <ListItem key={index} sx={{ bgcolor: '#f8fafc', borderRadius: 4, mb: 1.5, border: '1px solid #f1f5f9' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#2563eb', borderRadius: 2 }}><PersonIcon /></Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 800, color: '#1e293b' }}>{submission.student?.name}</Typography>}
                          secondary={<Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{submission.assignment?.title}</Typography>}
                        />
                        <Chip 
                          label={submission.status} 
                          size="small" 
                          color={submission.status === 'submitted' ? 'warning' : 'success'} 
                          sx={{ fontWeight: 800, height: 26 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: '#64748b', fontWeight: 600 }}>No recent submissions</Typography></Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 5, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Your Sections</Typography>
                  <Button size="small" variant="text" sx={{ fontWeight: 700 }} onClick={() => navigate('/sections')}>Manage</Button>
                </Box>
                {dashboardData?.sections?.length > 0 ? (
                  <Stack spacing={2}>
                    {dashboardData.sections.slice(0, 4).map((section, index) => (
                      <Box key={index} sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{section.name}</Typography>
                          <Chip icon={<GroupsIcon sx={{ fontSize: '14px !important' }} />} label={section.students?.length || 0} size="small" sx={{ fontWeight: 800, height: 24 }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#ffffff', p: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, ml: 1 }}>CODE:</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 900, color: '#2563eb', flex: 1, textAlign: 'center' }}>
                            {section.joinCode}
                          </Typography>
                          <IconButton size="small" onClick={() => copyToClipboard(section.joinCode)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>No sections yet</Typography>
                    <Button variant="contained" size="small" onClick={() => setCreateSectionOpen(true)} sx={{ borderRadius: 2, fontWeight: 800 }}>Create Section</Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialogs with Premium Styling */}
        <Dialog 
          open={createSectionOpen} 
          onClose={() => setCreateSectionOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Create New Section</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField fullWidth label="Section Name" value={newSection.name} onChange={(e) => setNewSection({ ...newSection, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <TextField fullWidth label="Description" value={newSection.description} onChange={(e) => setNewSection({ ...newSection, description: e.target.value })} multiline rows={3} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateSectionOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateSection} sx={{ borderRadius: 3, px: 4, fontWeight: 800, bgcolor: '#0f172a' }}>Create Section</Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={createAssignmentOpen} 
          onClose={() => setCreateAssignmentOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>New Assignment</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField fullWidth label="Title" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                <InputLabel>Target Section</InputLabel>
                <Select value={newAssignment.sectionId} label="Target Section" onChange={(e) => setNewAssignment({ ...newAssignment, sectionId: e.target.value })}>
                  {dashboardData?.sections?.map((section) => (<MenuItem key={section._id} value={section._id}>{section.name}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField fullWidth label="Description" value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} multiline rows={3} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <TextField fullWidth label="Due Date" type="datetime-local" value={newAssignment.dueDate} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <TextField fullWidth label="Max Marks" type="number" value={newAssignment.maxMarks} onChange={(e) => setNewAssignment({ ...newAssignment, maxMarks: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateAssignmentOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateAssignment} sx={{ borderRadius: 3, px: 4, fontWeight: 800, bgcolor: '#4f46e5' }}>Post Assignment</Button>
          </DialogActions>
        </Dialog>

        {/* Join Code Success Dialog */}
        <Dialog 
          open={showJoinCode} 
          onClose={() => setShowJoinCode(false)} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 6, p: 2, textAlign: 'center' } }}
        >
          <DialogContent>
            <Avatar sx={{ bgcolor: '#10b98115', color: '#10b981', width: 80, height: 80, mx: 'auto', mb: 3 }}>
               <CheckCircleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Section Created!</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
              Students can join your class using the code below.
            </Typography>
            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 4, border: '2px dashed #e2e8f0', position: 'relative' }}>
               <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 900, color: '#0f172a', letterSpacing: 4 }}>
                 {createdJoinCode}
               </Typography>
               <IconButton 
                 onClick={() => copyToClipboard(createdJoinCode)}
                 sx={{ position: 'absolute', top: 8, right: 8, color: '#64748b' }}
               >
                 <ContentCopyIcon fontSize="small" />
               </IconButton>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button 
              variant="contained" 
              onClick={() => setShowJoinCode(false)}
              sx={{ borderRadius: 3, px: 6, fontWeight: 800, bgcolor: '#0f172a' }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      </Box>
    </Layout>
  );
};

export default TeacherDashboard;

