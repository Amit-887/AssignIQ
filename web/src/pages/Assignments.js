import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Chip, Stack, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../redux/api';
import Layout from '../components/Layout';

const Assignments = () => {
  const { user } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // For students, fetch all their assignments from all sections
      // For teachers, fetch their assignments
      const endpoint = user?.role === 'teacher' ? '/teacher/assignments' : '/assignments/student/all';
      const response = await api.get(endpoint);
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.delete(`/teacher/assignments/${id}`);
        fetchAssignments();
      } catch (error) {
        console.error('Failed to delete assignment:', error);
      }
    }
  };

  const handleSubmitAssignment = async () => {
    try {
      const formData = new FormData();
      formData.append('files', submissionFile);  // Changed from 'file' to 'files'
      formData.append('content', 'Submitted via file upload');
      
      // Use the correct endpoint
      await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSubmitDialogOpen(false);
      setSubmissionFile(null);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  const getDaysRemaining = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      closed: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
  }

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Assignments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.role === 'teacher' ? 'Manage your assignments' : 'View and submit your assignments'}
            </Typography>
          </Box>

          {assignments.length > 0 ? (
            <Grid container spacing={3}>
              {assignments.map((assignment, index) => {
                const daysRemaining = getDaysRemaining(assignment.dueDate);
                return (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {assignment.title}
                          </Typography>
                          <Chip label={assignment.status} size="small" color={getStatusColor(assignment.status)} />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {assignment.description?.substring(0, 100)}...
                        </Typography>

                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Max Marks: {assignment.maxMarks}
                            </Typography>
                          </Box>
                          {assignment.section && (
                            <Typography variant="body2" color="text.secondary">
                              Section: {assignment.section.name}
                            </Typography>
                          )}
                        </Stack>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Chip
                            icon={daysRemaining <= 0 ? <WarningIcon /> : <CheckCircleIcon />}
                            label={daysRemaining <= 0 ? 'Overdue' : `${daysRemaining} days left`}
                            size="small"
                            color={daysRemaining <= 0 ? 'error' : daysRemaining <= 2 ? 'warning' : 'success'}
                          />
                        </Box>

                        {user?.role === 'student' && assignment.mySubmission ? (
                          <Stack direction="row" spacing={1}>
                            <Chip label={`Submitted: ${new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}`} color="success" size="small" />
                            {assignment.mySubmission.teacherReview?.marks !== undefined && (
                              <Chip label={`Marks: ${assignment.mySubmission.teacherReview.marks}/${assignment.maxMarks}`} variant="outlined" size="small" />
                            )}
                          </Stack>
                        ) : user?.role === 'student' && (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            onClick={() => { setSelectedAssignment(assignment); setSubmitDialogOpen(true); }}
                            sx={{ bgcolor: '#2563eb' }}
                          >
                            Submit
                          </Button>
                        )}

                        {user?.role === 'teacher' && (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="outlined">Edit</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteAssignment(assignment._id)}>Delete</Button>
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No assignments found
              </Typography>
            </Box>
          )}
        </Container>

        <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Submitting: {selectedAssignment?.title}
            </Typography>
            <TextField
              fullWidth
              type="file"
              InputProps={{ inputProps: { accept: '.pdf,.doc,.docx,.txt' } }}
              onChange={(e) => setSubmissionFile(e.target.files[0])}
              helperText="Upload PDF, DOC, DOCX, or TXT files"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitAssignment} disabled={!submissionFile}>Submit</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Assignments;

