# AssignIQ - Educational Management System

A comprehensive full-stack educational management system with web and mobile apps featuring role-based authentication, assignment management, AI-powered evaluation, real-time messaging, and code generation/compilation.

## 🚀 Features

### Roles
- **Admin**: Manage users, approve teachers, view reports, system oversight
- **Teacher**: Create sections, add students, create assignments, evaluate submissions
- **Student**: Submit assignments, view deadlines, chat with teachers, track progress

### Core Features
1. **Authentication**: Email/Password + Google OAuth
2. **Section Management**: Teachers can create and manage class sections
3. **Assignment System**: Create, submit, and grade assignments
4. **AI Evaluation**: Automatic grading and originality checking
5. **Real-time Messaging**: WhatsApp-style chat with file sharing
6. **Code Compiler**: C, C++, Java, Python with AI detection
7. **Mobile App**: React Native app ready for Google Play Store

## 🛠 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time)
- JWT Authentication
- OpenAI API (AI features)
- Piston API (code compiler)

### Frontend (Web)
- React.js
- Redux Toolkit
- Material-UI
- Tailwind CSS
- Socket.io-client

### Mobile
- React Native
- Redux Toolkit
- React Navigation

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend (Web) Setup
```bash
cd web
npm install
npm start
```

### Mobile Setup
```bash
cd mobile
npm install
# For iOS
cd ios && pod install && cd ..
npx react-native run-ios
# For Android
npx react-native run-android
```

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assigniq
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key
```

## 📁 Project Structure

```
AssignIQ/
├── backend/          # Node.js Express API
├── web/              # React.js Web App
├── mobile/           # React Native Mobile App
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Teachers
- `POST /api/teacher/sections` - Create section
- `POST /api/teacher/assignments` - Create assignment
- `GET /api/teacher/dashboard` - Dashboard data

### Students
- `GET /api/student/assignments` - Get assignments
- `POST /api/student/submit` - Submit assignment
- `GET /api/student/dashboard` - Dashboard data

### Messages
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages` - Send message

### Code Generation
- `POST /api/codegen/compile` - Compile code
- `POST /api/codegen/detect-ai` - AI detection

## 🚀 Deployment

### Backend
- Deploy to Render, Heroku, or Railway

### Frontend
- Deploy to Vercel or Netlify

### Mobile
- Build release APK/AAB for Google Play Store

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

