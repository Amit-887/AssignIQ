import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Avatar, Box, Container, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import MessageIcon from '@mui/icons-material/Message';
import CodeIcon from '@mui/icons-material/Code';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { logout } from '../redux/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/', public: true },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', auth: true },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments', auth: true },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages', auth: true },
    { text: 'CodeGen', icon: <CodeIcon />, path: '/codegen', auth: true },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile', auth: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.public) return true;
    if (item.auth && isAuthenticated) return true;
    return false;
  });

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2563eb' }}>
          AssignIQ
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path} onClick={handleDrawerToggle}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider />
          <List>
            <ListItem button onClick={() => { handleLogout(); handleDrawerToggle(); }}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ top: 0, zIndex: 1100 }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 70 }}>
            {isMobile && isAuthenticated && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: '#1e293b' }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                flexGrow: isMobile && isAuthenticated ? 0 : 1,
                mr: 4,
                letterSpacing: '-0.02em'
              }}
            >
              AssignIQ
            </Typography>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
                {filteredMenuItems.filter(item => !item.text.includes('Profile')).map((item) => (
                  <Button
                    key={item.text}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: location.pathname === item.path ? '#2563eb' : '#64748b',
                      fontWeight: location.pathname === item.path ? 700 : 500,
                      px: 2,
                      borderRadius: 2,
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 8,
                        left: '20%',
                        width: location.pathname === item.path ? '60%' : '0%',
                        height: '2px',
                        bgcolor: '#2563eb',
                        transition: 'width 0.3s ease-in-out',
                        borderRadius: 2
                      },
                      '&:hover': { 
                        bgcolor: 'rgba(37, 99, 235, 0.04)',
                        color: '#2563eb',
                        '&:after': { width: '60%' }
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}

            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {!isMobile && (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                    {user?.name}
                  </Typography>
                )}
                <IconButton onClick={handleMenu} sx={{ p: 0.5, border: '2px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <Avatar
                    alt={user?.name}
                    src={user?.profilePicture}
                    sx={{ bgcolor: '#2563eb', width: 32, height: 32, fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    {user?.name?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    elevation: 4,
                    sx: { mt: 1.5, minWidth: 180, borderRadius: 3, border: '1px solid #f1f5f9' }
                  }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                     <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
                     <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                  </Box>
                  <Divider />
                  <MenuItem component={Link} to="/profile" onClick={handleClose} sx={{ py: 1.5 }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="text" 
                  sx={{ color: '#475569', fontWeight: 600 }}
                >
                  Sign In
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="contained" 
                  sx={{ 
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    '&:hover': { boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)' }
                  }}
                >
                  Get Started
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 } }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;

