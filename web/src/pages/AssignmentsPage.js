import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  TextField,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Tab,
  Tabs,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  AlertTitle
} from '@mui/material';
import {
  CheckCircle,
  Info,
  Close,
  Quiz,
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload,
  Description,
  Image,
  Visibility,
  Download,
  CameraAlt,
  Delete
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import Layout from '../components/Layout';
import api from '../redux/api';

const AssignmentsPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [content, setContent] = useState('');
  const [precheckData, setPrecheckData] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [scoreResults, setScoreResults] = useState(null);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const webcamRef = React.useRef(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const url = sectionId ? `/assignments/section/${sectionId}` : '/assignments/student/all';
      const response = await api.get(url);
      setAssignments(response.data.data);
    } catch (error) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  const fetchStudentPerformance = useCallback(async () => {
    try {
      const response = await api.get('/assignments/student/performance');
      setPerformance(response.data.data);
    } catch (error) {
      console.error('Failed to load performance data');
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchStudentPerformance();
  }, [sectionId, fetchAssignments, fetchStudentPerformance]);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        setError(`Invalid file type: ${file.name}. Only PDF, DOC, DOCX, TXT, and images are allowed.`);
        return false;
      }
      if (!isValidSize) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Convert base64 to file
      const byteString = atob(imageSrc.split(',')[1]);
      const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], {type: mimeString});
      const file = new File([blob], `photo_${Date.now()}.jpg`, {type: 'image/jpeg'});
      
      // Update files state and keep camera open for "burst" mode
      setFiles(prevFiles => [...prevFiles, file]);
      setError('📸 Photo captured! You can take more or click Done.');
      
      // Visual feedback (brief flash)
      const flash = document.getElementById('camera-flash');
      if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 100);
      }
    }
  };

  useEffect(() => {
    let timer;
    if (submissionStep === 3 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && submissionStep === 3) {
      handleAnswerSubmit();
    }
    return () => clearInterval(timer);
  }, [submissionStep, timeLeft]);

  const handleStartQuiz = async () => {
    try {
      setLoading(true);
      await api.post(`/submissions/${currentSubmission._id}/start-quiz`);
      setSubmissionStep(3);
      setTimeLeft(600);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      setError('Failed to start quiz: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePrecheck = async () => {
    if (files.length === 0) {
      setError('Please upload files or take photos for precheck');
      return;
    }

    try {
      setLoading(true);
      setError('🔍 Analyzing your document with AI...');
      
      // Upload files and content for precheck
      const formData = new FormData();
      formData.append('content', content || '');
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post(`/assignments/${selectedAssignment._id}/precheck`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Precheck response:', response.data);
      
      const precheckResult = response.data.data;
      
      // Set precheck data with AI analysis
      const analysis = precheckResult.analysis || precheckResult;
      setPrecheckData({
        originalityScore: analysis.originalityScore || 0,
        relevanceScore: analysis.relevanceScore || 0,
        plagiarismScore: analysis.plagiarismScore || 0,
        aiGeneratedProbability: analysis.aiGeneratedProbability || 0,
        suggestions: analysis.suggestions || [],
        issues: analysis.issues || [],
        topicMatchFeedback: analysis.topicMatchFeedback || '',
        overallScore: precheckResult.overallScore || 0
      });
      
      setShowPrecheck(true);
      setError('✅ Precheck Complete! Review the analysis below.');
    } catch (error) {
      console.error('Precheck error:', error);
      setError('Failed to perform precheck: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('content', content);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      // Show analyzing message
      setError('Analyzing your submission with AI...');

      const response = await api.post(`/submissions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Submission response:', response.data);
      setCurrentSubmission(response.data.data);
      
      // Show AI analysis results
      const aiEvaluation = response.data.data.aiEvaluation;
      if (aiEvaluation) {
        // Show analysis results
        setAiResults({
          originality: aiEvaluation.originalityScore || 0,
          plagiarism: aiEvaluation.plagiarismScore || 0,
          aiContent: aiEvaluation.aiGeneratedProbability || 0,
          suggestions: aiEvaluation.suggestions || [],
          issues: aiEvaluation.issues || []
        });
        
        // If AI is enabled, show results first, then button to start quiz
        if (aiEvaluation.questions?.length > 0) {
          setAiResults({
            originality: aiEvaluation.originalityScore || 0,
            plagiarism: aiEvaluation.plagiarismScore || 0,
            aiContent: aiEvaluation.aiGeneratedProbability || 0,
            suggestions: aiEvaluation.suggestions || [],
            issues: aiEvaluation.issues || []
          });
          setQuestions(aiEvaluation.questions);
          setSubmissionStep(2); // Step 2 is now "Review AI Analysis & Start Quiz"
          setError('AI Analysis Complete! Review the results and start the verification quiz.');
        } else {
          // Submission complete
          setSubmissionStep(4);
          setError('Assignment submitted successfully!');
          fetchAssignments();
          fetchStudentPerformance();
        }
      } else {
        // No AI evaluation
        setSubmissionStep(4);
        setError('Assignment submitted successfully!');
        fetchAssignments();
        fetchStudentPerformance();
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already submitted')) {
        setError('⚠️ You have already submitted this assignment. You cannot submit again.');
      } else {
        setError('Failed to submit assignment: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    try {
      setLoading(true);
      setError('Evaluating your answers...');
      
      const response = await api.post(`/submissions/${currentSubmission._id}/verify`, {
        answers
      });

      console.log('Answer evaluation response:', response.data);
 
      // Show evaluation results
      const evaluation = response.data.data;
      if (evaluation) {
        setScoreResults({
          totalScore: evaluation.aiEvaluation?.score || 0,
          maxScore: 100,
          percentage: evaluation.aiEvaluation?.score || 0,
          feedback: evaluation.aiEvaluation?.feedback || 'Good work!',
          results: evaluation.aiEvaluation?.questions || []
        });
        
        setError(`🎉 Score: ${evaluation.aiEvaluation?.score || 0}% - ${evaluation.aiEvaluation?.feedback || 'Good work!'}`);
      }
 
      setShowQuestions(false);
      setSubmissionStep(4);
      fetchStudentPerformance();
    } catch (error) {
      console.error('Answer submission error:', error);
      setError('Failed to submit answers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <Description sx={{ mr: 2 }} />;
    
    // Support both browser File objects (.type) and DB objects (.fileType)
    const type = file.type || file.fileType || '';
    
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(type)) {
      try {
        // Blob URL only works for local File objects, not DB URLs
        const src = (file instanceof File) 
          ? URL.createObjectURL(file) 
          : (file.fileUrl?.startsWith('http') ? file.fileUrl : `http://localhost:5002/${file.fileUrl}`);
        
        return (
          <Box 
            component="img" 
            src={src} 
            sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', mr: 2 }} 
          />
        );
      } catch (e) {
        return <Image sx={{ mr: 2 }} />;
      }
    }
    return <Description sx={{ mr: 2 }} />;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    return 'error';
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
      <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📚 Assignments
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Available Assignments" />
            <Tab label="My Performance" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {assignments.map((assignment) => (
              <Grid item xs={12} md={6} key={assignment._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {assignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {assignment.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                        size="small"
                        color={new Date(assignment.dueDate) < new Date() ? 'error' : 'default'}
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
                          icon={<Info />}
                        />
                      )}
                      {assignment.hasSubmitted && (
                        <Chip 
                          label="✅ Submitted"
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        disabled={assignment.hasSubmitted && new Date(assignment.dueDate) < new Date()}
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSubmissionStep(1);
                        }}
                      >
                        {assignment.hasSubmitted ? 'Re-submit Assignment' : 'Submit Assignment'}
                      </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {performance ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {performance.overallStats.totalAssignments}
                      </Typography>
                      <Typography variant="body2">Total Assignments</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {performance.overallStats.averageScore}%
                      </Typography>
                      <Typography variant="body2">Average Score</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {performance.overallStats.onTimeSubmissions}
                      </Typography>
                      <Typography variant="body2">On Time</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {performance.overallStats.averageOriginality}%
                      </Typography>
                      <Typography variant="body2">Originality</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" gutterBottom>
                Recent Submissions
              </Typography>
              <List>
                {performance.performance.map((item, index) => (
                  <ListItem 
                    key={index} 
                    divider 
                    button 
                    onClick={() => setSelectedHistoryItem(item)}
                    sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' } }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.assignment.title}
                          </Typography>
                          <Visibility color="action" fontSize="small" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Section: {item.assignment.section} | Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={`Score: ${item.score}%`}
                              size="small"
                              color={getScoreColor(item.score)}
                            />
                            <Chip 
                              label={`Originality: ${item.originalityScore}%`}
                              size="small"
                              variant="outlined"
                            />
                            {item.isLate && (
                              <Chip 
                                label="Late"
                                size="small"
                                color="error"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No performance data available yet.
            </Typography>
          )}
        </TabPanel>
      </Box>

      {/* Assignment Submission Dialog */}
      <Dialog open={submissionStep > 0} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedAssignment?.title} - Submit Assignment
            </Typography>
            <IconButton onClick={() => setSubmissionStep(0)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {submissionStep === 1 && (
            <Box>
              <Stepper activeStep={0} sx={{ mb: 3 }}>
                <Step><StepLabel>Upload & Content</StepLabel></Step>
                <Step><StepLabel>AI Questions</StepLabel></Step>
                <Step><StepLabel>Complete</StepLabel></Step>
              </Stepper>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your assignment files (PDF, DOC, DOCX, TXT, or images) or enter your content below.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <input
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.heic,.webp"
                  style={{ display: 'none' }}
                  id="file-upload"
                  multiple
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Files
                  </Button>
                </label>

                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  component="span"
                  sx={{ ml: 2, mb: 2 }}
                  onClick={() => setShowCamera(true)}
                >
                  Open Camera
                </Button>
              </Box>

              {files.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Files:
                  </Typography>
                  <List dense>
                    {files.map((file, index) => (
                      <ListItem key={index} disablePadding>
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%', 
                            p: 1, 
                            border: '1px solid #eee', 
                            borderRadius: 1, 
                            mb: 1,
                            '&:hover': { bgcolor: '#f9f9f9' }
                          }}
                        >
                          {getFileIcon(file)}
                          <ListItemText 
                            primary={file.name}
                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          />
                          <Tooltip title="Remove File">
                            <IconButton 
                              onClick={() => removeFile(index)} 
                              size="small" 
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrecheck}
                  disabled={loading || files.length === 0}
                >
                  Precheck with AI
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitAssignment}
                  disabled={loading || files.length === 0}
                >
                  Submit Assignment
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Review AI Analysis & Start Quiz */}
          {submissionStep === 2 && (
            <Box>
              <Stepper activeStep={0} sx={{ mb: 3 }}>
                <Step><StepLabel>Upload</StepLabel></Step>
                <Step><StepLabel>AI Analysis</StepLabel></Step>
                <Step><StepLabel>Verification Quiz</StepLabel></Step>
              </Stepper>

              {aiResults && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                    🤖 AI Analysis Results
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
                        <Typography variant="h4">{aiResults.originality.toFixed(1)}%</Typography>
                        <Typography variant="body2">Originality</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: aiResults.plagiarism > 20 ? '#f44336' : '#ff9800', color: 'white' }}>
                        <Typography variant="h4">{aiResults.plagiarism.toFixed(1)}%</Typography>
                        <Typography variant="body2">Plagiarism</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: aiResults.aiContent > 30 ? '#f44336' : '#2196f3', color: 'white' }}>
                        <Typography variant="h4">{aiResults.aiContent.toFixed(1)}%</Typography>
                        <Typography variant="body2">AI Content</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {aiResults.suggestions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>💡 Suggestions:</Typography>
                      {aiResults.suggestions.map((suggestion, index) => (
                        <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                          • {suggestion}
                        </Typography>
                      ))}
                    </Box>
                  )}

                   {aiResults.issues.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>⚠️ Issues:</Typography>
                      {aiResults.issues.map((issue, index) => (
                        <Typography key={index} variant="body2" color="error" sx={{ ml: 2 }}>
                          • {issue}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {currentSubmission?.extractedText && (
                    <Accordion sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          📄 Content Preview (AI-Detected Text)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ p: 2, bgcolor: 'white', border: '1px solid #ddd', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {currentSubmission.extractedText}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Check if the AI correctly read your handwriting or document content.
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body1" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
                  Your assignment has been analyzed. Now, you must complete a 10-minute verification quiz to finalize your submission.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleStartQuiz}
                  startIcon={<Quiz />}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1.1rem' }}
                >
                  Start 10-Minute Quiz
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Verification Quiz */}
          {submissionStep === 3 && (
            <Box>
              <Stepper activeStep={1} sx={{ mb: 3 }}>
                <Step><StepLabel>Upload</StepLabel></Step>
                <Step><StepLabel>AI Analysis</StepLabel></Step>
                <Step><StepLabel>Verification Quiz</StepLabel></Step>
              </Stepper>

              <Box sx={{ mb: 3, p: 3, bgcolor: timeLeft < 60 ? '#fff1f0' : '#f0f7ff', borderRadius: 3, border: '1px solid', borderColor: timeLeft < 60 ? '#ffa39e' : '#91d5ff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: timeLeft < 60 ? '#f5222d' : '#1890ff' }}>
                    <TimerIcon /> {formatTime(timeLeft)}
                  </Typography>
                  <Chip label="Verification Mode" color="primary" variant="outlined" size="small" />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(timeLeft / 600) * 100} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5, 
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: timeLeft < 60 ? '#f5222d' : '#1890ff'
                    }
                  }} 
                />
                {timeLeft < 60 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 700, textAlign: 'center' }}>
                    ⏳ HURRY! Auto-submitting in less than a minute!
                  </Typography>
                )}
              </Box>

              <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Please answer these questions based on your submission:
              </Typography>

              <Box sx={{ maxHeight: '60vh', overflowY: 'auto', p: 1 }}>
                {questions.map((q, index) => (
                  <Box key={index} sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1a237e' }}>
                      {index + 1}. {q.question}
                    </Typography>
                    
                    {q.type === 'mcq' ? (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {q.options.map((option, optIdx) => (
                          <Grid item xs={12} key={optIdx}>
                            <Button
                              fullWidth
                              variant={answers[index] === option ? "contained" : "outlined"}
                              onClick={() => {
                                const newAnswers = [...answers];
                                newAnswers[index] = option;
                                setAnswers(newAnswers);
                              }}
                              sx={{ 
                                justifyContent: 'flex-start', 
                                textAlign: 'left', 
                                py: 1.5,
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                fontWeight: answers[index] === option ? 600 : 400,
                                transform: answers[index] === option ? 'scale(1.01)' : 'none',
                                borderColor: answers[index] === option ? 'primary.main' : '#ddd',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: answers[index] === option ? 'primary.main' : 'rgba(25, 118, 210, 0.04)'
                                }
                              }}
                            >
                              <Box sx={{ 
                                width: 28, 
                                height: 28, 
                                borderRadius: '50%', 
                                border: '2px solid', 
                                borderColor: answers[index] === option ? 'white' : 'primary.main',
                                mr: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: answers[index] === option ? 'white' : 'transparent',
                                color: 'primary.main',
                                fontWeight: 'bold'
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </Box>
                              {option}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        variant="filled"
                        placeholder="Type your detailed analytical response here... Your summary must reflect your understanding of the assignment."
                        value={answers[index] || ''}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[index] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        sx={{ mt: 2, '& .MuiFilledInput-root': { borderRadius: 2, bgcolor: 'white' } }}
                      />
                    )}
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                onClick={handleAnswerSubmit}
                disabled={loading || questions.some((_, idx) => !answers[idx] || answers[idx].trim() === '')}
                fullWidth
                size="large"
                sx={{ mt: 3, py: 2, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}
              >
                Submit Verification Quiz
              </Button>
            </Box>
          )}

          {/* Step 4: Final Results */}
          {submissionStep === 4 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assignment Submitted Successfully!
              </Typography>
              
              {scoreResults && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Paper sx={{ p: 3, bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
                    <Typography variant="h5" gutterBottom sx={{ color: '#2e7d32' }}>
                      🏆 Your Score: {scoreResults.totalScore}/{scoreResults.maxScore}
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {scoreResults.percentage}% - {scoreResults.feedback}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Typography variant="body1" color="text.secondary">
                Your assignment has been submitted and evaluated by AI.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setSubmissionStep(0);
                  setAiResults(null);
                  setScoreResults(null);
                  setError('');
                }}
                sx={{ mt: 3 }}
              >
                Close
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Precheck Results Dialog */}
      <Dialog open={showPrecheck} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">AI Precheck Results</Typography>
            <IconButton onClick={() => setShowPrecheck(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {precheckData && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: 'rgba(232, 245, 233, 0.5)' }}>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {Math.round(precheckData.overallScore || 0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Overall Score</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {Math.round(precheckData.originalityScore || 0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Originality</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%', border: precheckData.relevanceScore < 50 ? '1px solid #ff4d4f' : 'none' }}>
                    <Typography variant="h6" color={precheckData.relevanceScore < 50 ? "error.main" : "info.main"} sx={{ fontWeight: 'bold' }}>
                      {Math.round(precheckData.relevanceScore || 0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Topic Relevance</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {Math.round(precheckData.plagiarismScore || 0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Plagiarism Risk</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {Math.round(precheckData.aiGeneratedProbability || 0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>AI Content</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {precheckData.topicMatchFeedback && (
                <Alert severity={precheckData.relevanceScore < 50 ? "warning" : "success"} sx={{ mb: 3, borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 'bold' }}>Topic Analysis</AlertTitle>
                  {precheckData.topicMatchFeedback}
                </Alert>
              )}

                  {precheckData.suggestions && precheckData.suggestions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        <Info color="info" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        AI Feedback & Suggestions
                      </Typography>
                      <List dense>
                        {precheckData.suggestions.map((suggestion, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={suggestion} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowPrecheck(false)}
                    >
                      Close Analysis
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setShowPrecheck(false);
                        handleSubmitAssignment();
                      }}
                    >
                      Proceed to Final Submission
                    </Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </Dialog>

      {/* Camera Modal for Burst Mode */}
      <Dialog open={showCamera} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'black', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">📸 Burst Capture Mode</Typography>
            <Typography variant="body2">{files.filter(f => f.name.startsWith('photo_')).length} photos taken</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'black', p: 0, position: 'relative', overflow: 'hidden', minHeight: 400, display: 'flex', alignItems: 'center' }}>
          <Box id="camera-flash" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'white', opacity: 0, zIndex: 10, pointerEvents: 'none', transition: 'opacity 0.1s' }} />
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            style={{ width: '100%', height: 'auto' }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'black', px: 3, py: 2 }}>
          <Button onClick={() => setShowCamera(false)} sx={{ color: 'white' }}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={capturePhoto}
            startIcon={<CameraAlt />}
            sx={{ borderRadius: 10, px: 4 }}
          >
            Capture
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => setShowCamera(false)}
            sx={{ px: 4 }}
          >
            Done ({files.filter(f => f.name.startsWith('photo_')).length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proof of Submission Dialog (History View) */}
      <Dialog 
        open={!!selectedHistoryItem} 
        maxWidth="md" 
        fullWidth
        onClose={() => setSelectedHistoryItem(null)}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">📜 Proof of Submission</Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted on: {selectedHistoryItem && new Date(selectedHistoryItem.submittedAt).toLocaleString()}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedHistoryItem(null)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedHistoryItem && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="primary">Assignment Details</Typography>
                    <Typography variant="h6">{selectedHistoryItem.assignment.title}</Typography>
                    <Typography variant="body2" color="text.secondary">Section: {selectedHistoryItem.assignment.section}</Typography>
                    <Typography variant="body2">Points: {selectedHistoryItem.score} / {selectedHistoryItem.assignment.maxMarks}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="primary">AI Evaluation</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant="h5" color={getScoreColor(selectedHistoryItem.score)}>{selectedHistoryItem.score}%</Typography>
                        <Typography variant="caption">Final Score</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h5" color="success.main">{selectedHistoryItem.originalityScore}%</Typography>
                        <Typography variant="caption">Originality</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>📁 Submitted Proof (Files)</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {selectedHistoryItem.files && selectedHistoryItem.files.map((file, idx) => {
                  const url = file.fileUrl.startsWith('http') ? file.fileUrl : `http://localhost:5002/${file.fileUrl}`;
                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(file.fileType);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card variant="outlined">
                        <Box sx={{ position: 'relative', pt: '75%', bgcolor: '#f0f0f0' }}>
                          {isImage ? (
                            <Box 
                              component="img" 
                              src={url} 
                              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Description sx={{ fontSize: 40, color: '#aaa' }} />
                            </Box>
                          )}
                          <IconButton 
                            size="small" 
                            component="a" 
                            href={url} 
                            target="_blank" 
                            sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255,255,255,0.8)' }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Box>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="caption" noWrap display="block">
                            {file.fileName}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {selectedHistoryItem.extractedText && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>📝 Extracted Content (OCR Proof)</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {selectedHistoryItem.extractedText}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedHistoryItem.feedback && (
                <Box>
                  <Typography variant="h6" gutterBottom>💬 Teacher/AI Feedback</Typography>
                  <Alert severity="info" variant="outlined">{selectedHistoryItem.feedback}</Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedHistoryItem(null)}>Close Receipt</Button>
        </DialogActions>
      </Dialog>
    </Container>
  </Layout>
);
};

export default AssignmentsPage;
