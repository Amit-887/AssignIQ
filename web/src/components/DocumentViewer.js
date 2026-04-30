import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Image as ImageIcon
} from '@mui/icons-material';

const DocumentViewer = ({ document, open, onClose }) => {
  const [loading, setLoading] = useState(false);

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon sx={{ fontSize: 40, color: '#dc2626' }} />;
      case 'doc':
      case 'docx':
        return <DocIcon sx={{ fontSize: 40, color: '#2563eb' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon sx={{ fontSize: 40, color: '#10b981' }} />;
      default:
        return <DocIcon sx={{ fontSize: 40, color: '#6b7280' }} />;
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
        return 'image/jpeg';
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  };

  const handleDownload = async () => {
    if (!document?.path) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/uploads/${document.path.split('/').pop()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension);
  };

  const isPdf = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  };

  if (!document) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getFileIcon(document.name)}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Verification Document
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {document.name}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Document Info */}
          <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Document Type:</strong> {document.documentType || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>File Name:</strong> {document.name}
            </Typography>
          </Paper>

          {/* Document Preview */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 400,
            bgcolor: '#f1f5f9',
            borderRadius: 2,
            border: '2px dashed #cbd5e1'
          }}>
            {document.path ? (
              isImage(document.name) ? (
                <img
                  src={`/uploads/${document.path.split('/').pop()}`}
                  alt={document.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    borderRadius: '8px'
                  }}
                />
              ) : isPdf(document.name) ? (
                <iframe
                  src={`/uploads/${document.path.split('/').pop()}`}
                  style={{
                    width: '100%',
                    height: '500px',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title="PDF Document"
                />
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  {getFileIcon(document.name)}
                  <Typography variant="body1" sx={{ mt: 2, color: '#64748b' }}>
                    Preview not available for this file type
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#94a3b8' }}>
                    Please download the document to view it
                  </Typography>
                </Box>
              )
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  No document uploaded
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Button 
          onClick={handleDownload}
          disabled={loading || !document.path}
          startIcon={<DownloadIcon />}
          variant="outlined"
        >
          {loading ? 'Downloading...' : 'Download'}
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewer;
