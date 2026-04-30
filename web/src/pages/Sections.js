import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Avatar, Chip, Stack, List, ListItem, ListItemText, ListItemAvatar, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import api from '../redux/api';
import Layout from '../components/Layout';

const Sections = () => {
  const { user } = useSelector((state) => state.auth);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [newSection, setNewSection] = useState({ name: '', description: '' });
  const [studentEmail, setStudentEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await api.get('/teacher/sections');
      setSections(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      await api.post('/teacher/sections', newSection);
      setCreateDialogOpen(false);
      setNewSection({ name: '', description: '' });
      fetchSections();
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleDeleteSection = async (id) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await api.delete(`/teacher/sections/${id}`);
        fetchSections();
      } catch (error) {
        console.error('Failed to delete section:', error);
      }
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.post(`/teacher/sections/${selectedSection._id}/students`, { email: studentEmail });
      setAddStudentDialogOpen(false);
      setStudentEmail('');
      setSelectedSection(null);
      fetchSections();
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
  }

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Sections Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your class sections and students
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)} sx={{ bgcolor: '#2563eb' }}>
              Create Section
            </Button>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
          </Card>

          {filteredSections.length > 0 ? (
            <Grid container spacing={3}>
              {filteredSections.map((section, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#2563eb' }}>
                            <GroupsIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {section.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {section.students?.length || 0} students
                            </Typography>
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => { setSelectedSection(section); setAddStudentDialogOpen(true); }}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSection(section._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>

                      {section.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {section.description}
                        </Typography>
                      )}

                      <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Students
                        </Typography>
                        {section.students?.length > 0 ? (
                          <List dense>
                            {section.students.slice(0, 5).map((student, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <ListItemAvatar sx={{ minWidth: 32 }}>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#7c3aed', fontSize: 12 }}>
                                    {student.name?.charAt(0)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={student.name}
                                  secondary={student.email}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                            {section.students.length > 5 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                +{section.students.length - 5} more students
                              </Typography>
                            )}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No students added yet
                          </Typography>
                        )}
                      </Box>

                      <Button fullWidth variant="outlined" onClick={() => { setSelectedSection(section); setAddStudentDialogOpen(true); }}>
                        Add Student
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <GroupsIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No sections found
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => setCreateDialogOpen(true)}>
                Create Your First Section
              </Button>
            </Box>
          )}
        </Container>

        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Section Name" value={newSection.name} onChange={(e) => setNewSection({ ...newSection, name: e.target.value })} sx={{ mt: 2, mb: 2 }} />
            <TextField fullWidth label="Description" value={newSection.description} onChange={(e) => setNewSection({ ...newSection, description: e.target.value })} multiline rows={3} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateSection}>Create</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={addStudentDialogOpen} onClose={() => setAddStudentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Student to {selectedSection?.name}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Student Email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Enter student's email address"
              sx={{ mt: 2 }}
              helperText="The student must be registered in the system"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddStudentDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddStudent}>Add Student</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Sections;

