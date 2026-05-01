import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Typography, Box, Grid, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, TextField, IconButton, Badge, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Menu, MenuItem, Tooltip, CircularProgress, ListItemIcon } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import ReportIcon from '@mui/icons-material/Report';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import io from 'socket.io-client';
import api from '../redux/api';
import { updateProfilePicture } from '../redux/slices/authSlice';
import Layout from '../components/Layout';

const Messages = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportUser, setSelectedReportUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [msgAnchorEl, setMsgAnchorEl] = useState(null);
  const [activeMsg, setActiveMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newMembers, setNewMembers] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const fileInputRef = useRef();
  const profileInputRef = useRef();

  useEffect(() => {
    fetchConversations();
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (user?._id) {
        socketRef.current?.emit('userOnline', user._id);
    }
  }, [user]);

  useEffect(() => {
    // Don't auto-scroll - let user control message position
    // if (messagesEndRef.current) {
    //   messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    // }
  }, [messages]);

  const initializeSocket = () => {
    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5002';
    socketRef.current = io(socketUrl);
    
    if (user?._id) {
        socketRef.current.emit('userOnline', user._id);
    }

    socketRef.current.on('userStatusChange', ({ userId, status }) => {
        if (status === 'online') {
            setOnlineUsers(prev => [...new Set([...prev, userId])]);
        } else {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        }
    });

    socketRef.current.on('newMessage', (message) => {
      if (selectedConversation) {
        const isGroupMatch = message.chatGroup && message.chatGroup === selectedConversation._id;
        const isP2PMatch = message.sender._id === selectedConversation._id || message.receiver === selectedConversation._id;
        
        if (isGroupMatch || isP2PMatch) {
          setMessages((prev) => [...prev, message]);
        }
      }
      fetchConversations();
    });

    socketRef.current.on('onlineUsersList', (userIds) => {
        setOnlineUsers(userIds);
    });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      const groupsResponse = await api.get('/messages/groups');
      const groups = groupsResponse.data.data.map(g => ({
        contactId: g._id,
        isGroup: true,
        contact: {
          name: g.name,
          profilePicture: g.groupIcon || '',
          role: 'Group',
          creator: g.creator,
          members: g.members
        },
        lastMessage: { content: g.description, createdAt: g.createdAt },
        unreadCount: 0
      }));
      
      const allConvs = [...response.data.data, ...groups].sort((a, b) => 
        new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
      );
      setConversations(allConvs);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId, contact = null, isGroup = false) => {
    try {
      const url = isGroup ? `/messages/groups/${otherUserId}/messages` : `/messages/conversation/${otherUserId}`;
      const response = await api.get(url);
      setMessages(response.data.data.messages || response.data.data);
      if (contact) {
        setSelectedConversation({ ...contact, _id: otherUserId, isGroup });
      } else {
        const conv = conversations.find(c => c.contactId === otherUserId);
        setSelectedConversation(conv ? { ...conv.contact, _id: otherUserId, isGroup: conv.isGroup } : { _id: otherUserId, isGroup });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation) return;
    try {
      const payload = {
        content: newMessage,
        messageType: attachments.length > 0 ? 'file' : 'text',
        attachments: attachments
      };
      
      if (selectedConversation.isGroup) {
        payload.chatGroupId = selectedConversation._id;
      } else {
        payload.receiverId = selectedConversation._id;
      }

      const response = await api.post('/messages', payload);
      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
      setAttachments([]);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments([response.data.data]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      setMsgAnchorEl(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear this entire chat for yourself?')) return;
    try {
      await api.delete(`/messages/conversation/${selectedConversation._id}`);
      setMessages([]);
      handleMenuClose();
    } catch (error) {
      console.error('Clear chat failed:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('picture', file);
    try {
      await dispatch(updateProfilePicture(formData)).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMsgMenuClick = (event, msg) => {
    setMsgAnchorEl(event.currentTarget);
    setActiveMsg(msg);
  };
  const handleMsgMenuClose = () => {
    setMsgAnchorEl(null);
    setActiveMsg(null);
  };

  const handleReportUser = async () => {
    try {
      await api.post('/messages/report', {
        reportedUserId: selectedReportUser._id,
        reason: reportReason
      });
      setReportDialogOpen(false);
      setReportReason('');
      setSelectedReportUser(null);
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  };

  const handleSearch = async (val) => {
    setSearchQuery(val);
    setSearching(true);
    try {
      const response = await api.get(`/auth/users/search?query=${val || ''}`);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = (contact) => {
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.contactId === contact._id);
    if (existingConv) {
      fetchMessages(contact._id, contact);
    } else {
      setMessages([]);
      setSelectedConversation(contact);
    }
    setSearchDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      const response = await api.post('/messages/groups', {
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers.map(m => m._id)
      });
      setCreateGroupDialogOpen(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      fetchConversations();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleAddMemberSubmit = async () => {
    if (newMembers.length === 0 || !selectedConversation?._id) return;
    try {
      await api.post(`/messages/groups/${selectedConversation._id}/members`, {
        memberIds: newMembers.map(m => m._id)
      });
      setAddMemberDialogOpen(false);
      setNewMembers([]);
      setSearchQuery('');
      setSearchResults([]);
      alert('Members added successfully!');
      fetchConversations();
    } catch (error) {
      console.error('Failed to add members:', error);
      alert('Failed to add members. Only group creator can add members.');
    }
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 'calc(100vh - 150px)', borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
                  <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar 
                          src={user?.profilePicture} 
                          sx={{ width: 45, height: 45, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                          onClick={() => profileInputRef.current.click()}
                        >
                          {user?.name?.charAt(0)}
                        </Avatar>
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, p: 0.5 }}
                          onClick={() => profileInputRef.current.click()}
                        >
                          <PhotoCameraIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Chats
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Create Group">
                        <IconButton 
                          onClick={() => {
                            setCreateGroupDialogOpen(true);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          sx={{ color: '#4f46e5', mr: 1, border: '1px solid #4f46e5' }}
                          size="small"
                        >
                          <PersonIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="New Chat">
                        <IconButton 
                          onClick={() => {
                            setSearchDialogOpen(true);
                            handleSearch('');
                          }}
                          sx={{ bgcolor: '#4f46e5', color: 'white', '&:hover': { bgcolor: '#4338ca' } }}
                        >
                          <ChatIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Divider />
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    <List sx={{ p: 0 }}>
                      {conversations.map((conv, index) => {
                        const contact = conv.contact;
                        const contactId = conv.contactId;
                        return (
                          <ListItem
                            key={index}
                            button
                            selected={selectedConversation?._id === contactId}
                            onClick={() => fetchMessages(contactId, contact)}
                            sx={{ 
                              borderRadius: 3, 
                              mb: 1,
                              transition: 'all 0.2s',
                              '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f46e5' },
                              '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                          >
                            <ListItemAvatar>
                              {conv.isGroup ? (
                                <Avatar sx={{ bgcolor: '#ec4899', borderRadius: 2 }}>
                                  <GroupIcon />
                                </Avatar>
                              ) : (
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  variant="dot"
                                  color="success"
                                  invisible={!isOnline(contactId)}
                                >
                                  <Avatar src={contact?.profilePicture} sx={{ bgcolor: '#4f46e5' }}>
                                    {contact?.name?.charAt(0)}
                                  </Avatar>
                                </Badge>
                              )}
                            </ListItemAvatar>
                            <ListItemText
                              primary={contact?.name}
                              primaryTypographyProps={{ fontWeight: 600 }}
                              secondary={conv.lastMessage?.messageType === 'file' ? '📁 Attachment' : conv.lastMessage?.content}
                              secondaryTypographyProps={{ noWrap: true }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(conv.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              {conv.unreadCount > 0 && (
                                <Badge badgeContent={conv.unreadCount} color="primary" />
                              )}
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
                {selectedConversation ? (
                  <>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {selectedConversation.isGroup ? (
                          <Avatar sx={{ bgcolor: '#ec4899', borderRadius: 2 }}>
                            <GroupIcon />
                          </Avatar>
                        ) : (
                          <Badge overlap="circular" variant="dot" color="success" invisible={!isOnline(selectedConversation._id)}>
                            <Avatar src={selectedConversation.profilePicture} sx={{ bgcolor: '#4f46e5' }}>
                              {selectedConversation.name?.charAt(0)}
                            </Avatar>
                          </Badge>
                        )}
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {selectedConversation.name}
                            {selectedConversation.isGroup && <Chip label="Group" size="small" color="secondary" sx={{ height: 20, fontSize: 10 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {selectedConversation.isGroup 
                              ? `${selectedConversation.members?.length || 'Multiple'} members`
                              : (isOnline(selectedConversation._id) ? <span style={{color: '#2e7d32'}}>• Online</span> : 'Offline')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton onClick={handleMenuClick}>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: '#ffffff' }}>
                      {messages.map((msg, index) => {
                        const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
                        return (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              mb: 2,
                              position: 'relative',
                              '&:hover .msg-menu': { opacity: 1 }
                            }}
                          >
                            <Box
                              sx={{
                                maxWidth: '70%',
                                p: 1.8,
                                borderRadius: '20px',
                                bgcolor: isMe ? '#4f46e5' : '#f1f5f9',
                                color: isMe ? 'white' : '#1e293b',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                position: 'relative',
                                borderBottomRightRadius: isMe ? '4px' : '20px',
                                borderBottomLeftRadius: isMe ? '20px' : '4px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ flex: 1 }}>
                                  {msg.attachments?.map((att, i) => (
                                    <Box key={i} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden', bgcolor: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', p: 0.5 }}>
                                      {att.type?.startsWith('image/') ? (
                                        <img src={att.url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 250, display: 'block', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(att.url, '_blank')} />
                                      ) : (
                                        <Button
                                          startIcon={<InsertDriveFileIcon />}
                                          href={att.url}
                                          target="_blank"
                                          sx={{ color: isMe ? 'white' : 'text.primary', textTransform: 'none', fontWeight: 600 }}
                                        >
                                          {att.name}
                                        </Button>
                                      )}
                                    </Box>
                                  ))}
                                  <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontWeight: 500, lineHeight: 1.5 }}>
                                    {msg.content}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                  {isMe && (
                                    <IconButton 
                                      className="msg-menu"
                                      size="small" 
                                      sx={{ opacity: 0, transition: '0.2s', p: 0, color: isMe ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.4)' }} 
                                      onClick={(e) => handleMsgMenuClick(e, msg)}
                                    >
                                      <MoreVertIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#f0f2f5' }}>
                      {attachments.length > 0 && (
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {attachments.map((att, i) => (
                            <Chip
                              key={i}
                              icon={att.type?.startsWith('image/') ? <ImageIcon /> : <InsertDriveFileIcon />}
                              label={att.name}
                              onDelete={() => setAttachments([])}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Tooltip title="Attach File (Max 50MB)">
                          <IconButton onClick={() => fileInputRef.current.click()} disabled={uploading}>
                            {uploading ? <CircularProgress size={24} /> : <AttachFileIcon />}
                          </IconButton>
                        </Tooltip>
                        <TextField
                          fullWidth
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          variant="outlined"
                          size="medium"
                          sx={{ 
                            bgcolor: 'white', 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 4,
                              bgcolor: '#f8fafc',
                              '& fieldset': { border: '1px solid #e2e8f0' },
                              '&:hover fieldset': { borderColor: '#cbd5e1' }
                            }
                          }}
                        />
                        <IconButton 
                          color="primary" 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() && attachments.length === 0}
                          sx={{ bgcolor: '#4f46e5', color: 'white', '&:hover': { bgcolor: '#4338ca' } }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#f8fafc' }}>
                    <Avatar sx={{ width: 100, height: 100, bgcolor: '#e2e8f0', mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 60, color: '#94a3b8' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">Select a conversation to start messaging</Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* Hidden Inputs */}
        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
        <input type="file" hidden ref={profileInputRef} onChange={handleProfileUpdate} accept="image/*" />

        {/* Conversation Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          {selectedConversation?.isGroup && (
            <MenuItem onClick={() => { 
                setAddMemberDialogOpen(true); 
                setSearchQuery('');
                setSearchResults([]);
                setNewMembers([]);
                handleMenuClose(); 
            }}>
              <ListItemIcon><GroupAddIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
              <Typography color="primary">Add Members</Typography>
            </MenuItem>
          )}
          <MenuItem onClick={() => { setReportDialogOpen(true); handleMenuClose(); }}>
            <ListItemIcon><ReportIcon sx={{ color: 'error.main' }} /></ListItemIcon>
            <Typography color="error">Report User</Typography>
          </MenuItem>
          <MenuItem onClick={handleClearChat}>
            <ListItemIcon><DeleteIcon sx={{ color: 'error.main' }} /></ListItemIcon>
            <Typography color="error">Clear Chat</Typography>
          </MenuItem>
        </Menu>

        {/* Message Menu */}
        <Menu anchorEl={msgAnchorEl} open={Boolean(msgAnchorEl)} onClose={handleMsgMenuClose}>
          <MenuItem onClick={() => handleDeleteMessage(activeMsg?._id)}>
            <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
            Delete for me
          </MenuItem>
        </Menu>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
          <DialogTitle>Report User</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reporting: {selectedConversation?.name}
            </Typography>
            <TextField
              fullWidth
              select
              label="Reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">Select reason</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="other">Other</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleReportUser}>Report</Button>
          </DialogActions>
        </Dialog>

        {/* Search Users Dialog (Existing) */}
        <Dialog 
          open={searchDialogOpen} 
          onClose={() => setSearchDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Start New Chat
            <IconButton onClick={() => setSearchDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ minHeight: 300, maxHeight: 400, overflow: 'auto' }}>
              {searching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : searchResults.length > 0 ? (
                <List>
                  {searchResults.map((result) => (
                    <ListItem 
                      key={result._id} 
                      button 
                      onClick={() => handleStartChat(result)}
                      sx={{ borderRadius: 2, mb: 1 }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color="success"
                          invisible={!isOnline(result._id)}
                        >
                          <Avatar src={result.profilePicture}>
                            {result.name?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={result.name} 
                        secondary={`${result.email} • ${result.role}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : searchQuery.trim() ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body1">No users found matching "{searchQuery}"</Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="body2">Start typing to find other members</Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        {/* Create Group Dialog */}
        <Dialog 
          open={createGroupDialogOpen} 
          onClose={() => setCreateGroupDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create New Group
            <IconButton onClick={() => setCreateGroupDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField fullWidth label="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Description (Optional)" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected Members ({selectedMembers.length})</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 40 }}>
              {selectedMembers.map(member => (
                <Chip key={member._id} label={member.name} onDelete={() => setSelectedMembers(prev => prev.filter(m => m._id !== member._id))} color="primary" variant="outlined" />
              ))}
              {selectedMembers.length === 0 && <Typography variant="caption" color="text.secondary">No members selected</Typography>}
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Search Users</Typography>
            <TextField
              fullWidth placeholder="Search by name or email..." variant="outlined" size="small"
              value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} /> }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ minHeight: 150, maxHeight: 200, overflow: 'auto' }}>
              {searching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
              ) : searchResults.length > 0 ? (
                <List dense>
                  {searchResults.map((result) => (
                    <ListItem key={result._id} button 
                      onClick={() => {
                        if (!selectedMembers.find(m => m._id === result._id)) setSelectedMembers(prev => [...prev, result]);
                      }}
                      sx={{ borderRadius: 1 }}
                      disabled={selectedMembers.find(m => m._id === result._id)}
                    >
                      <ListItemAvatar>
                        <Avatar src={result.profilePicture} sx={{ width: 30, height: 30 }}>{result.name?.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={result.name} secondary={result.email} />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="caption" color="text.secondary">Start typing to find members...</Typography>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateGroupDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} variant="contained" disabled={!groupName.trim() || selectedMembers.length === 0} sx={{ bgcolor: '#4f46e5' }}>
              Create Group
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Members Dialog */}
        <Dialog 
          open={addMemberDialogOpen} 
          onClose={() => setAddMemberDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Add Members to {selectedConversation?.name}
            <IconButton onClick={() => setAddMemberDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected Members ({newMembers.length})</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 40 }}>
              {newMembers.map(member => (
                <Chip key={member._id} label={member.name} onDelete={() => setNewMembers(prev => prev.filter(m => m._id !== member._id))} color="primary" variant="outlined" />
              ))}
              {newMembers.length === 0 && <Typography variant="caption" color="text.secondary">No members selected</Typography>}
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Search Users</Typography>
            <TextField
              fullWidth placeholder="Search by name or email..." variant="outlined" size="small"
              value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} /> }}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ minHeight: 150, maxHeight: 200, overflow: 'auto' }}>
              {searching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
              ) : searchResults.length > 0 ? (
                <List dense>
                  {searchResults.map((result) => {
                    const isAlreadyInGroup = selectedConversation?.members?.includes(result._id);
                    const isSelectedNow = newMembers.find(m => m._id === result._id);
                    return (
                      <ListItem key={result._id} button 
                        onClick={() => {
                          if (!isSelectedNow && !isAlreadyInGroup) {
                            setNewMembers(prev => [...prev, result]);
                          }
                        }}
                        sx={{ borderRadius: 1 }}
                        disabled={isSelectedNow || isAlreadyInGroup}
                      >
                        <ListItemAvatar>
                          <Avatar src={result.profilePicture} sx={{ width: 30, height: 30 }}>{result.name?.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                           primary={result.name} 
                           secondary={isAlreadyInGroup ? 'Already in group' : result.email} 
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : <Typography variant="caption" color="text.secondary">Start typing to find members...</Typography>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMemberSubmit} variant="contained" disabled={newMembers.length === 0} sx={{ bgcolor: '#4f46e5' }}>
              Add Members
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Layout>
  );
};

export default Messages;

