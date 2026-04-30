import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  TabPanel
} from '@mui/material';
import {
  Visibility,
  Download,
  Description,
  Image,
  Person,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  FilterList
} from '@mui/icons-material';
import api from '../redux/api';
import Layout from '../components/Layout';

const TeacherAssignmentsPage = () => {
  const { sectionId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [sectionId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // If no sectionId is provided, fetch all assignments for the teacher
      const url = sectionId && sectionId !== 'undefined' 
        ? `/assignments/section/${sectionId}` 
        : '/teacher/assignments';
      
      const response = await api.get(url);
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Fetch assignments error:', error);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(response.data.data.submissions);
      setStats(response.data.data.stats);
    } catch (error) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    fetchAssignmentSubmissions(assignment._id);
    setActiveTab(1);
  };

  const getFileIcon = (file) => {
    let relativePath = file.fileUrl || '';
    if (!relativePath.startsWith('http')) {
      if (relativePath.includes('uploads/')) {
        relativePath = 'uploads/' + relativePath.split('uploads/').pop();
      } else if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
    }
    const fileUrl = file.fileUrl.startsWith('http') 
        ? file.fileUrl 
        : `http://localhost:5002/${relativePath}`;
    
    if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(file.fileType)) {
      return (
        <Box 
          component="img" 
          src={fileUrl} 
          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', mr: 2 }} 
        />
      );
    }
    return <Description sx={{ mr: 2 }} />;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return <TrendingUp color="success" />;
    if (score >= 80) return <TrendingUp color="primary" />;
    if (score >= 70) return <TrendingUp color="warning" />;
    return <TrendingUp color="error" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading && assignments.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 Assignment Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Assignments" />
              <Tab label="Submissions" disabled={!selectedAssignment} />
              <Tab label="Analytics" disabled={!stats} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {assignments.map((assignment) => (
                <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 },
                      border: selectedAssignment?._id === assignment._id ? 2 : 0,
                      borderColor: selectedAssignment?._id === assignment._id ? 'primary.main' : 'transparent'
                    }}
                    onClick={() => handleAssignmentSelect(assignment)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                        {assignment.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                          size="small"
                          color={new Date(assignment.dueDate) < new Date() ? 'error' : 'default'}
                          icon={<Schedule />}
                        />
                        <Chip 
                          label={`${assignment.maxMarks} points`}
                          size="small"
                          variant="outlined"
                        />
                        {assignment.isAiEnabled && (
                          <Chip 
                            label="AI Enabled"
                            size="small"
                            color="primary"
                            icon={<Assessment />}
                          />
                        )}
                      </Box>

                      <Button variant="outlined" fullWidth>
                        View Submissions
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {selectedAssignment && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Submissions for: {selectedAssignment.title}
                </Typography>

                {stats && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="primary">
                          {stats.totalSubmissions}
                        </Typography>
                        <Typography variant="body2">Total</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="success.main">
                          {stats.averageScore}%
                        </Typography>
                        <Typography variant="body2">Avg Score</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="info.main">
                          {stats.averageOriginality}%
                        </Typography>
                        <Typography variant="body2">Originality</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="warning.main">
                          {stats.averagePlagiarism}%
                        </Typography>
                        <Typography variant="body2">Plagiarism</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="success.main">
                          {stats.performanceDistribution.excellent}
                        </Typography>
                        <Typography variant="body2">Excellent</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" color="error.main">
                          {stats.performanceDistribution.poor}
                        </Typography>
                        <Typography variant="body2">Needs Help</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Originality</TableCell>
                        <TableCell>Files</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                                {submission.student.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {submission.student.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {submission.student.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </Typography>
                            {submission.isLate && (
                              <Chip label="Late" size="small" color="error" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={submission.status}
                              size="small"
                              color={
                                submission.status === 'approved' ? 'success' :
                                submission.status === 'reviewed' ? 'primary' :
                                submission.status === 'under_review' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {submission.aiEvaluation.score ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getPerformanceIcon(submission.aiEvaluation.score)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {Math.round(submission.aiEvaluation.score)}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not evaluated
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {submission.aiEvaluation.originalityScore ? (
                              <Chip 
                                label={`${Math.round(submission.aiEvaluation.originalityScore)}%`}
                                size="small"
                                color={submission.aiEvaluation.originalityScore > 70 ? 'success' : 'warning'}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {submission.files.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {getFileIcon(submission.files[0])}
                                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                                    {submission.files.length} file(s)
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setShowSubmissionDetails(true);
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              {submission.files.length > 0 && (
                                <Tooltip title="Download Files">
                                  <IconButton size="small">
                                    <Download />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {stats && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Analytics
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Score Distribution
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {Object.entries(stats.performanceDistribution).map(([key, value]) => (
                          <Box key={key}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" textTransform="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                              <Typography variant="body2">
                                {value} students
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(value / stats.totalSubmissions) * 100}
                              color={
                                key === 'excellent' ? 'success' :
                                key === 'good' ? 'primary' :
                                key === 'average' ? 'warning' : 'error'
                              }
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Quality Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Average Originality: {stats.averageOriginality}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.averageOriginality}
                            color="success"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Average Plagiarism Risk: {stats.averagePlagiarism}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.averagePlagiarism}
                            color="error"
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Class Average Score: {stats.averageScore}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.averageScore}
                            color="primary"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>
        </Box>

        {/* Submission Details Dialog */}
        <Dialog 
          open={showSubmissionDetails} 
          maxWidth="md" 
          fullWidth
          onClose={() => setShowSubmissionDetails(false)}
        >
          <DialogTitle>
            <Typography variant="h6">
              Submission Details - {selectedSubmission?.student.name}
            </Typography>
          </DialogTitle>

          <DialogContent>
            {selectedSubmission && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" color="primary">
                        {selectedSubmission.aiEvaluation.score ? 
                          Math.round(selectedSubmission.aiEvaluation.score) : 0}%
                      </Typography>
                      <Typography variant="body2">Final Score</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" color="success.main">
                        {selectedSubmission.aiEvaluation.originalityScore ? 
                          Math.round(selectedSubmission.aiEvaluation.originalityScore) : 0}%
                      </Typography>
                      <Typography variant="body2">Originality</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" color="warning.main">
                        {selectedSubmission.aiEvaluation.plagiarismScore ? 
                          Math.round(selectedSubmission.aiEvaluation.plagiarismScore) : 0}%
                      </Typography>
                      <Typography variant="body2">Plagiarism Risk</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {(selectedSubmission.content || selectedSubmission.extractedText) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Submission Text Content
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedSubmission.content || selectedSubmission.extractedText}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Typography variant="h6" gutterBottom>
                  Submitted Files
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {selectedSubmission.files.map((file, index) => {
                    let relativePath = file.fileUrl || '';
                    if (!relativePath.startsWith('http')) {
                      if (relativePath.includes('uploads/')) {
                        relativePath = 'uploads/' + relativePath.split('uploads/').pop();
                      } else if (relativePath.startsWith('/')) {
                        relativePath = relativePath.substring(1);
                      }
                    }
                    const fileUrl = file.fileUrl.startsWith('http') 
                        ? file.fileUrl 
                        : `http://localhost:5002/${relativePath}`;
                    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(file.fileType.toLowerCase());
                    const isPDF = file.fileType.toLowerCase() === 'pdf';
                    
                    return (
                      <Grid item xs={12} sm={isImage ? 6 : isPDF ? 12 : 6} key={index}>
                        <Card variant="outlined">
                          {isImage ? (
                            <Box 
                              component="img"
                              src={fileUrl}
                              alt={file.fileName}
                              sx={{ 
                                width: '100%', 
                                height: 300, 
                                objectFit: 'contain',
                                bgcolor: 'grey.100',
                                borderBottom: '1px solid #eee'
                              }} 
                            />
                          ) : isPDF ? (
                            <Box sx={{ height: 400, bgcolor: 'grey.100', borderBottom: '1px solid #eee' }}>
                              <object data={fileUrl} type="application/pdf" width="100%" height="100%">
                                <p>Browser cannot natively render this PDF.</p>
                              </object>
                            </Box>
                          ) : (
                            <Box sx={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderBottom: '1px solid #eee' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                File type ({file.fileType.toUpperCase()}) cannot be previewed visually.<br/>Read the text box above or download to view original format.
                              </Typography>
                            </Box>
                          )}
                          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, '&:last-child': { pb: 1 } }}>
                            <Box sx={{ width: '70%', overflow: 'hidden' }}>
                              <Typography variant="body2" noWrap title={file.fileName}>
                                {file.fileName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(file.fileSize)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {(isImage || isPDF || file.fileType.toLowerCase() === 'txt') && (
                                <Tooltip title="Open in New Tab">
                                  <IconButton 
                                    component="a" 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    size="small"
                                    color="primary"
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Download">
                                <IconButton 
                                  component="a" 
                                  href={fileUrl} 
                                  download
                                  target="_blank"
                                  size="small"
                                  color="secondary"
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {selectedSubmission.aiEvaluation.questions && 
                 selectedSubmission.aiEvaluation.questions.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      AI Questions & Answers
                    </Typography>
                    <List>
                      {selectedSubmission.aiEvaluation.questions.map((q, index) => (
                        <Box key={index}>
                          <ListItem>
                            <ListItemText
                              primary={`Q${index + 1}: ${q.question}`}
                              secondary={`Expected: ${q.expectedAnswer}`}
                            />
                            <Chip 
                              label={`${q.points} pts`}
                              size="small"
                              color={q.isCorrect ? 'success' : 'error'}
                            />
                          </ListItem>
                          {q.studentAnswer && (
                            <ListItem sx={{ pl: 4 }}>
                              <ListItemText
                                primary={`Answer: ${q.studentAnswer}`}
                                secondary={`Scored: ${q.points} points`}
                              />
                            </ListItem>
                          )}
                          {index < selectedSubmission.aiEvaluation.questions.length - 1 && (
                            <Divider />
                          )}
                        </Box>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedSubmission.aiEvaluation.feedback && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      AI Feedback
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {selectedSubmission.aiEvaluation.feedback}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setShowSubmissionDetails(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default TeacherAssignmentsPage;
