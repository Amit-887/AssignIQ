import React from 'react';
import { Box, Container, Typography, Link, Divider, Grid, IconButton } from '@mui/material';
import { 
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1e293b',
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* About Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2563eb' }}>
              AssignIQ
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#94a3b8', lineHeight: 1.6 }}>
              A comprehensive educational management system designed to streamline teaching and learning experiences. 
              Empowering educators and students with modern technology.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <IconButton 
                size="small" 
                sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton 
                size="small" 
                sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                aria-label="Twitter"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton 
                size="small" 
                sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton 
                size="small" 
                sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2563eb' }}>
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {[
                { text: 'About Us', href: '/about' },
                { text: 'Features', href: '/features' },
                { text: 'Pricing', href: '/pricing' },
                { text: 'Contact Us', href: '/contact' },
                { text: 'Privacy Policy', href: '/privacy' },
                { text: 'Terms of Service', href: '/terms' }
              ].map((item, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Link
                    href={item.href}
                    sx={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#2563eb',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {item.text}
                  </Link>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2563eb' }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  support@assigniq.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 20, color: '#2563eb' }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationIcon sx={{ fontSize: 20, color: '#2563eb', mt: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  123 Education Street<br />
                  Learning City, LC 12345<br />
                  United States
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: '#334155', my: 4 }} />

        {/* Bottom Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            © {currentYear} AssignIQ. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href="/privacy"
              sx={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: '#2563eb'
                }
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              sx={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: '#2563eb'
                }
              }}
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              sx={{
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: '#2563eb'
                }
              }}
            >
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
