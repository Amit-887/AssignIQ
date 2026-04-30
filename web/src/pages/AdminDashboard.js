import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Avatar, Chip, Stack, List, ListItem, ListItemText, ListItemAvatar, LinearProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, IconButton } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import HubIcon from '@mui/icons-material/Hub';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import DocumentViewer from '../components/DocumentViewer';
import Layout from '../components/Layout';
import api from '../redux/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [teacherToReject, setTeacherToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = async () => {
    try {
      await api.put(`/admin/teachers/approve/${selectedTeacher._id}`);
      setApproveDialogOpen(false);
      setSelectedTeacher(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve teacher:', error);
    }
  };

  const handleViewDocument = (teacher) => {
    setSelectedDocument({
      name: teacher.documentName,
      path: teacher.verificationDocument,
      documentType: teacher.documentType
    });
    setDocumentViewerOpen(true);
  };

  const handleRejectTeacher = async (teacherId) => {
    try {
      console.log('Rejecting teacher:', teacherId, 'Reason:', rejectionReason);
      setError('');
      
      // Use PUT request with reason in body
      await api.put(`/admin/teachers/reject/${teacherId}`, { 
        reason: rejectionReason || 'No reason provided'
      });
      
      console.log('Teacher rejected successfully');
      setRejectDialogOpen(false);
      setTeacherToReject(null);
      setRejectionReason('');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to reject teacher:', error);
      setError(error.response?.data?.message || 'Failed to reject teacher');
    }
  };

  const openRejectDialog = (teacher) => {
    setTeacherToReject(teacher);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const statCards = [
    { title: 'Total Users', value: dashboardData?.totalUsers || 0, icon: <PeopleIcon />, color: '#2563eb' },
    { title: 'Teachers', value: dashboardData?.totalTeachers || 0, icon: <SchoolIcon />, color: '#7c3aed' },
    { title: 'Students', value: dashboardData?.totalStudents || 0, icon: <PersonIcon />, color: '#059669' },
    { title: 'Pending Approvals', value: dashboardData?.pendingTeachers?.length || 0, icon: <RateReviewIcon />, color: '#ea580c' }
  ];

  if (loading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
  }

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {user?.name}. Manage your platform here.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 4, 
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' },
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>{stat.title}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: `${stat.color}15`, 
                      color: stat.color, 
                      width: 56, 
                      height: 56,
                      borderRadius: 3
                    }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <HubIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Platform Activity Overview</Typography>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={[
                      { name: 'Mon', active: 400, submissions: 240 },
                      { name: 'Tue', active: 300, submissions: 139 },
                      { name: 'Wed', active: 200, submissions: 980 },
                      { name: 'Thu', active: 278, submissions: 390 },
                      { name: 'Fri', active: 189, submissions: 480 },
                      { name: 'Sat', active: 239, submissions: 380 },
                      { name: 'Sun', active: 349, submissions: 430 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Area type="monotone" dataKey="active" stroke="#2563eb" fillOpacity={0.1} fill="#2563eb" />
                      <Area type="monotone" dataKey="submissions" stroke="#059669" fillOpacity={0.1} fill="#059669" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                  <Tab label="Pending Teachers" />
                  <Tab label="All Users" />
                </Tabs>

                {tabValue === 0 && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Pending Teacher Approvals</Typography>
                    {dashboardData?.pendingTeachers?.length > 0 ? (
                      <List>
                        {dashboardData.pendingTeachers.map((teacher, index) => (
                          <ListItem key={index} sx={{ bgcolor: '#f8fafc', borderRadius: 2, mb: 2, flexDirection: 'column', alignItems: 'stretch' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#2563eb' }}><PersonIcon /></Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {teacher.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {teacher.email}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Department: {teacher.department || 'Not specified'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Phone: {teacher.phone || 'Not specified'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Box>
                            
                            {/* Document Information */}
                            {teacher.verificationDocument && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                p: 2, 
                                bgcolor: '#e0f2fe', 
                                borderRadius: 1,
                                border: '1px solid #bae6fd'
                              }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0369a1' }}>
                                    Verification Document
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {teacher.documentName} ({teacher.documentType})
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDocument(teacher)}
                                  sx={{ bgcolor: '#0284c7', color: 'white', '&:hover': { bgcolor: '#0369a1' } }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Box>
                            )}
                            
                            <Stack direction="row" spacing={1} sx={{ mt: 2, alignSelf: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => { setSelectedTeacher(teacher); setApproveDialogOpen(true); }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => openRejectDialog(teacher)}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: '#059669', mb: 2 }} />
                        <Typography color="text.secondary">No pending teacher approvals!</Typography>
                      </Box>
                    )}
                  </>
                )}

                {tabValue === 1 && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>All Users</Typography>
                    <List>
                      {dashboardData?.allUsers?.slice(0, 10).map((u, index) => (
                        <ListItem key={index} sx={{ bgcolor: '#f8fafc', borderRadius: 2, mb: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: u.role === 'teacher' ? '#7c3aed' : '#2563eb' }}><PersonIcon /></Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={u.name}
                            secondary={u.email}
                          />
                          <Chip label={u.role} size="small" color={u.role === 'admin' ? 'error' : u.role === 'teacher' ? 'secondary' : 'primary'} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
                <Stack spacing={2}>
                  <Button fullWidth variant="contained" onClick={() => navigate('/messages')}>
                    View Messages
                  </Button>
                  <Button fullWidth variant="outlined" onClick={() => navigate('/codegen')}>
                    Code Generator
                  </Button>
                  <Button fullWidth variant="outlined">
                    Generate Report
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>System Status</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Database</Typography>
                    <Chip label="Connected" size="small" color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Server</Typography>
                    <Chip label="Online" size="small" color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">API Status</Typography>
                    <Chip label="Healthy" size="small" color="success" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Teacher</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to approve {selectedTeacher?.name}?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Email: {selectedTeacher?.email}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApproveTeacher}>Approve</Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Dialog */}
      <DocumentViewer
        document={selectedDocument}
        open={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
      />

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#dc2626' }}>Reject Teacher Registration</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to reject {teacherToReject?.name}'s registration?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Email:</strong> {teacherToReject?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <strong>Department:</strong> {teacherToReject?.department}
          </Typography>
          
          <TextField
            fullWidth
            label="Rejection Reason (Optional)"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection (this will be sent to the teacher via email)..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => handleRejectTeacher(teacherToReject?._id)}
          >
            Reject & Send Email
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Layout>
  );
};

export default AdminDashboard;

