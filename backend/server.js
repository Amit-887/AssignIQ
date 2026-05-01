const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const codegenRoutes = require('./routes/codegenRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:63836',
      'http://127.0.0.1:56021',
      'http://127.0.0.1:62840',
      'https://accounts.google.com',
      'https://content.googleapis.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request Logger for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    
    // Allow any vercel.app subdomain for development ease, or if origin matches allowedOrigins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/codegen', codegenRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/assignments', assignmentRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files in production
// Static files served by separate frontend (Vercel)
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../web/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../web/build', 'index.html'));
//   });
// }

// Socket.io real-time messaging
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User comes online
  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    // Send current online users list only to the joining user
    socket.emit('onlineUsersList', Array.from(onlineUsers.keys()));
    // Broadcast status change to others
    io.emit('userStatusChange', { userId, status: 'online' });
  });

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  // Leave conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // Handle new message
  socket.on('sendMessage', (message) => {
    io.to(`conversation_${message.conversationId}`).emit('newMessage', message);
    // Also send to receiver
    const receiverSocketId = onlineUsers.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('userTyping', data);
  });

  // Stop typing indicator
  socket.on('stopTyping', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('userStopTyping', data);
  });

  // Read receipt
  socket.on('messageRead', (data) => {
    io.to(`conversation_${data.conversationId}`).emit('messageRead', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('userStatusChange', { userId: socket.userId, status: 'offline' });
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error('Error:', err.message);
  if (err.stack) console.error('Stack:', err.stack);
  
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
  // Debug check for Render environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('--- WARNING: EMAIL_USER or EMAIL_PASS is MISSING in environment variables! ---');
  } else {
    console.log('--- Email credentials detected successfully ---');
  }
});

// Run cleanup job every hour to delete attachments older than 24 hours
const Message = require('./models/Message');
const fs = require('fs');

setInterval(async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messagesWithOldFiles = await Message.find({
      createdAt: { $lt: twentyFourHoursAgo },
      'attachments.0': { $exists: true }
    });

    for (const msg of messagesWithOldFiles) {
      for (const attachment of msg.attachments) {
        if (attachment.url && !attachment.url.startsWith('http')) {
           // Local file path
           const filePath = path.join(__dirname, 'uploads', path.basename(attachment.url));
           if (fs.existsSync(filePath)) {
             fs.unlinkSync(filePath);
           }
        }
      }
      // Optional: Clear attachments array from DB
      msg.attachments = [];
      await msg.save();
    }
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
}, 60 * 60 * 1000);

module.exports = { app, io };


