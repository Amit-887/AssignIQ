import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAvailableSections, joinSection, getStudentSections, reset } from '../redux/slices/sectionSlice';
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
  Alert,
  Snackbar,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  JoinFull as JoinIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`section-tabpanel-${index}`}
      aria-labelledby={`section-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SectionJoin = () => {
  const dispatch = useDispatch();
  const { availableSections, studentSections, isLoading, isSuccess, isError, message } = useSelector((state) => state.sections);
  const { user } = useSelector((state) => state.auth);

  const [tabValue, setTabValue] = useState(0);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(getAvailableSections());
    dispatch(getStudentSections());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && message) {
      setSnackbar({ open: true, message, severity: 'success' });
      dispatch(reset());
      // Refresh both lists after joining
      dispatch(getAvailableSections());
      dispatch(getStudentSections());
    }
    if (isError && message) {
      setSnackbar({ open: true, message, severity: 'error' });
      dispatch(reset());
    }
  }, [isSuccess, isError, message, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleJoinSection = () => {
    if (joinCode.trim()) {
      dispatch(joinSection(joinCode.trim()));
      setOpenJoinDialog(false);
      setJoinCode('');
    }
  };

  const handleOpenJoinDialog = () => {
    setOpenJoinDialog(true);
  };

  const handleCloseJoinDialog = () => {
    setOpenJoinDialog(false);
    setJoinCode('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredAvailableSections = availableSections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Sections
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="My Sections" />
          <Tab label="Available Sections" />
        </Tabs>
      </Box>

      {/* My Sections Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            My Enrolled Sections ({studentSections.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<JoinIcon />}
            onClick={handleOpenJoinDialog}
          >
            Join Section
          </Button>
        </Box>

        <Grid container spacing={3}>
          {studentSections.map((section) => (
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
                        {section.students.length} students enrolled
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {section.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={section.teacher?.profilePicture}
                      alt={section.teacher?.name}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    >
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Teacher: {section.teacher?.name}
                    </Typography>
                  </Box>

                  <Chip
                    label="Enrolled"
                    color="success"
                    size="small"
                    icon={<JoinIcon />}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}

          {studentSections.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.300', width: 64, height: 64 }}>
                  <GroupIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No sections enrolled yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Join sections to access course materials and assignments
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<JoinIcon />}
                  onClick={handleOpenJoinDialog}
                >
                  Join Your First Section
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Available Sections Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Available Sections ({filteredAvailableSections.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<JoinIcon />}
            onClick={handleOpenJoinDialog}
          >
            Join with Code
          </Button>
        </Box>

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
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Grid container spacing={3}>
          {filteredAvailableSections.map((section) => (
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

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={section.teacher?.profilePicture}
                      alt={section.teacher?.name}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    >
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {section.teacher?.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={`Code: ${section.joinCode}`}
                      variant="outlined"
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setJoinCode(section.joinCode);
                        handleJoinSection();
                      }}
                    >
                      Join Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {filteredAvailableSections.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.300', width: 64, height: 64 }}>
                  <SearchIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No available sections found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search or ask your teacher for a join code
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<JoinIcon />}
                  onClick={handleOpenJoinDialog}
                >
                  Join with Code
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Join Section Dialog */}
      <Dialog open={openJoinDialog} onClose={handleCloseJoinDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Join Section</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the join code provided by your teacher to enroll in their section.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Join Code"
            type="text"
            fullWidth
            variant="outlined"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g., ABC123"
            inputProps={{ style: { fontFamily: 'monospace', textTransform: 'uppercase' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJoinDialog}>Cancel</Button>
          <Button
            onClick={handleJoinSection}
            variant="contained"
            disabled={!joinCode.trim()}
          >
            Join Section
          </Button>
        </DialogActions>
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

export default SectionJoin;
