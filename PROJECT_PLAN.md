# Educational Management System - Complete Project Plan

## Project Overview
A comprehensive full-stack educational management system with web and mobile apps featuring role-based authentication, assignment management, AI-powered evaluation, real-time messaging, and code generation/compilation.

## Tech Stack

### Frontend (Web)
- **React.js** - Main web framework
- **Redux Toolkit** - State management
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Material-UI** - UI components
- **Socket.io-client** - Real-time messaging

### Frontend (Mobile)
- **React Native** - Cross-platform mobile app
- **React Navigation** - Mobile navigation
- **Redux Toolkit** - State management
- **Socket.io-client** - Real-time messaging

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload
- **OpenAI API** - AI features
- **Piston API** - Code compilation

### External Services
- **MongoDB Atlas** - Cloud database
- **Google OAuth** - Google sign-in
- **Piston API** - Code compiler API
- **OpenAI GPT-4** - AI evaluation

## Project Structure

```
AssignIQ/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── teacherController.js
│   │   ├── adminController.js
│   │   ├── assignmentController.js
│   │   ├── submissionController.js
│   │   ├── messageController.js
│   │   ├── sectionController.js
│   │   ├── codegenController.js
│   │   └── evaluationController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── teacher.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Teacher.js
│   │   ├── Admin.js
│   │   ├── Section.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Message.js
│   │   └── Report.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── submissionRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── sectionRoutes.js
│   │   ├── codegenRoutes.js
│   │   └── evaluationRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── validateInput.js
│   │   ├── aiDetection.js
│   │   └── plagiarismCheck.js
│   ├── server.js
│   └── package.json
│
├── web/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── Footer.js
│   │   │   ├── Auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── RoleLogin.js
│   │   │   │   └── GoogleLogin.js
│   │   │   ├── Dashboard/
│   │   │   │   ├── TeacherDashboard.js
│   │   │   │   ├── StudentDashboard.js
│   │   │   │   └── AdminDashboard.js
│   │   │   ├── Assignments/
│   │   │   │   ├── CreateAssignment.js
│   │   │   │   ├── ViewAssignments.js
│   │   │   │   ├── AssignmentCard.js
│   │   │   │   └── SubmitAssignment.js
│   │   │   ├── Sections/
│   │   │   │   ├── CreateSection.js
│   │   │   │   ├── SectionList.js
│   │   │   │   └── AddStudents.js
│   │   │   ├── Messages/
│   │   │   │   ├── ChatWindow.js
│   │   │   │   ├── MessageList.js
│   │   │   │   └── OnlineUsers.js
│   │   │   ├── CodeGen/
│   │   │   │   ├── CodeEditor.js
│   │   │   │   ├── Compiler.js
│   │   │   │   └── CodeOutput.js
│   │   │   └── Profile/
│   │   │       ├── UserProfile.js
│   │   │       └── SubmissionHistory.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Messages.js
│   │   │   ├── CodeGen.js
│   │   │   └── Profile.js
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── userSlice.js
│   │   │   │   ├── assignmentSlice.js
│   │   │   │   ├── messageSlice.js
│   │   │   │   └── sectionSlice.js
│   │   │   └── api.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── apiService.js
│   │   │   └── socketService.js
│   │   ├── App.js
│   │   │   ├── index.js
│   │   │   └── index.css
│   │   └── utils/
│   │       └── constants.js
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Assignments/
│   │   │   ├── Messages/
│   │   │   ├── CodeGen/
│   │   │   └── Profile/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── TeacherDashboardScreen.js
│   │   │   ├── StudentDashboardScreen.js
│   │   │   ├── MessagesScreen.js
│   │   │   ├── CodeGenScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   └── navigation/
│   │       └── AppNavigator.js
│   ├── App.js
│   └── package.json
│
├── .env.example
├── README.md
└── package.json
```

## Database Schema Design

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  name: String,
  role: String, // 'student', 'teacher', 'admin'
  googleId: String,
  profilePicture: String,
  phone: String,
  department: String,
  isApproved: Boolean, // for teachers
  createdAt: Date,
  updatedAt: Date
}
```

### Sections Collection
```javascript
{
  _id: ObjectId,
  name: String, // e.g., "Section A"
  teacherId: ObjectId,
  students: [ObjectId], // array of student user IDs
  createdAt: Date,
  updatedAt: Date
}
```

### Assignments Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  sectionId: ObjectId,
  teacherId: ObjectId,
  dueDate: Date,
  maxMarks: Number,
  instructions: String,
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Submissions Collection
```javascript
{
  _id: ObjectId,
  assignmentId: ObjectId,
  studentId: ObjectId,
  fileUrl: String,
  fileType: String,
  content: String, // extracted text from PDF/doc
  submittedAt: Date,
  aiEvaluation: {
    score: Number,
    feedback: String,
    originalityScore: Number,
    questions: [String],
    answers: [String]
  },
  teacherReview: {
    marks: Number,
    feedback: String,
    reviewedAt: Date
  },
  status: String // 'submitted', 'reviewed', 'returned'
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId, // or groupId for groups
  content: String,
  attachments: [String],
  messageType: String, // 'text', 'file', 'image'
  isRead: Boolean,
  createdAt: Date
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  reporterId: ObjectId,
  reportedUserId: ObjectId,
  messageId: ObjectId,
  reason: String,
  status: String, // 'pending', 'resolved', 'dismissed'
  createdAt: Date
}
```

## Feature Implementation Steps

### Phase 1: Backend Setup & Authentication
1. Initialize Node.js project with Express
2. Set up MongoDB connection
3. Create User, Teacher, Admin models
4. Implement JWT authentication
5. Create Google OAuth flow
6. Build role-based login/register APIs

### Phase 2: Teacher & Admin Features
1. Teacher registration with admin approval
2. Admin dashboard for approvals
3. Section management (create sections, add students)
4. Assignment creation and management
5. Marks and evaluation system

### Phase 3: Student Features
1. Student registration
2. View enrolled sections
3. View and submit assignments
4. Profile with submission history
5. AI-powered assignment evaluation

### Phase 4: Messaging System
1. Real-time chat using Socket.io
2. One-on-one messaging
3. File sharing capabilities
4. Online user status
5. Report system for inappropriate messages

### Phase 5: Code Generation & Compiler
1. Code editor interface
2. Piston API integration for C, C++, Java, Python
3. AI detection for code originality
4. Code generation suggestions

### Phase 6: Frontend Development
1. Set up React.js project
2. Create responsive UI with Tailwind CSS
3. Implement all pages and components
4. Connect to backend APIs
5. Implement real-time features

### Phase 7: Mobile App Development
1. Set up React Native project
2. Implement core features
3. Test on Android
4. Prepare for Google Play Store

### Phase 8: Testing & Deployment
1. Unit and integration testing
2. Security audit
3. Performance optimization
4. Deploy backend to Render/Heroku
5. Deploy frontend to Vercel/Netlify
6. Prepare mobile app for Google Play Store

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/google - Google OAuth login
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update profile
- GET /api/users/submissions - Get submission history

### Teachers
- POST /api/teachers/register - Teacher registration
- GET /api/teachers/pending - Get pending teachers (Admin)
- PUT /api/teachers/approve/:id - Approve teacher (Admin)
- GET /api/teachers/sections - Get teacher sections
- POST /api/teachers/sections - Create section
- POST /api/teachers/sections/:id/students - Add students

### Assignments
- POST /api/assignments - Create assignment
- GET /api/assignments - Get all assignments
- GET /api/assignments/:id - Get assignment by ID
- PUT /api/assignments/:id - Update assignment
- DELETE /api/assignments/:id - Delete assignment
- GET /api/assignments/section/:sectionId - Get section assignments

### Submissions
- POST /api/submissions - Submit assignment
- GET /api/submissions/:assignmentId - Get assignment submissions
- PUT /api/submissions/:id/review - Teacher review submission
- GET /api/submissions/student/:studentId - Student submissions

### Messages
- GET /api/messages/:userId - Get conversation
- POST /api/messages - Send message
- GET /api/messages/online - Get online users
- POST /api/messages/report - Report message

### Code Generation
- POST /api/codegen/compile - Compile code
- POST /api/codegen/generate - Generate code with AI
- POST /api/codegen/detect-ai - Detect AI-generated code

## Environment Variables

```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assigniq

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Piston API (Code Compiler)
PISTON_API_URL=https://emkc.org/api/v2/piston

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Google Play Store Requirements for Mobile App

1. App icon (512x512 PNG)
2. Screenshots (various sizes for different devices)
3. Feature graphic (1024x500 PNG)
4. App description
5. Privacy policy URL
6. Terms of service URL
7. Minimum Android version: 5.0 (Lollipop)
8. Target SDK: 34
9. Keystore for signing
10. App Bundle (.aab format)

## Development Timeline Estimate

- Phase 1: 3-4 days
- Phase 2: 4-5 days
- Phase 3: 3-4 days
- Phase 4: 3-4 days
- Phase 5: 4-5 days
- Phase 6: 5-7 days
- Phase 7: 5-7 days
- Phase 8: 3-4 days

**Total Estimated Time: 30-40 days**

## Next Steps

1. Create project structure
2. Set up backend dependencies
3. Create MongoDB models
4. Implement authentication
5. Build frontend components
6. Implement mobile app
7. Test and deploy

