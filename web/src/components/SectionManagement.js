import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSection, getTeacherSections, reset } from '../redux/slices/sectionSlice';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const SectionManagement = () => {
  const dispatch = useDispatch();
  const { sections, isLoading, isSuccess, isError, message } = useSelector((state) => state.sections);
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxStudents: 50
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(getTeacherSections());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message) {
      setSnackbar({ open: true, message, severity: 'success' });
      dispatch(reset());
    }
    if (isError && message) {
      setSnackbar({ open: true, message, severity: 'error' });
      dispatch(reset());
    }
  }, [isSuccess, isError, message, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createSection(formData));
    setOpenDialog(false);
    setFormData({ name: '', description: '', maxStudents: 50 });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', description: '', maxStudents: 50 });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Sections
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Section
        </Button>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} md={6} lg={4} key={section._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <GroupIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2">
                      {section.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.students.length} / {section.maxStudents} students
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {section.description || 'No description provided'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`Join Code: ${section.joinCode}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Students ({section.students.length}):
                </Typography>

                {section.students.length > 0 ? (
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {section.students.slice(0, 5).map((student) => (
                      <ListItem key={student._id}>
                        <ListItemAvatar>
                          <Avatar
                            src={student.profilePicture}
                            alt={student.name}
                            sx={{ width: 32, height: 32 }}
                          >
                            {student.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.name}
                          secondary={student.email}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                    {section.students.length > 5 && (
                      <ListItem>
                        <ListItemText
                          primary={`... and ${section.students.length - 5} more students`}
                          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No students enrolled yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {sections.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.300', width: 64, height: 64 }}>
                <GroupIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No sections created yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first section to start managing your classes
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Create Your First Section
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Section Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Section</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Section Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="maxStudents"
              label="Maximum Students"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.maxStudents}
              onChange={handleChange}
              inputProps={{ min: 1, max: 100 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create Section
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SectionManagement;
