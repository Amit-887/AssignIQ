# AssignIQ Deployment Guide

## Project Status: ✅ COMPLETE

The AssignIQ Educational Management System is fully implemented and ready for deployment.

---

## 🚀 Quick Deployment Steps

### Option 1: Deploy to Render (Backend + Database)

1. **Create MongoDB Atlas Database:**
   - Go to https://cloud.mongodb.com
   - Create free cluster
   - Create database user
   - Get connection string (mongodb+srv://...)

2. **Deploy Backend to Render:**
   - Go to https://render.com
   - Connect your GitHub repository
   - Create new Web Service
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables (see `.env.example`)

3. **Deploy Frontend to Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Root directory: `web`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com`
   - Deploy

### Option 2: Deploy to Railway

1. **Backend:**
   - Connect GitHub repo to Railway
   - Select backend folder
   - Add environment variables
   - Deploy

2. **Database:**
   - Add MongoDB plugin in Railway
   - Copy connection string to backend env vars

3. **Frontend:**
   - Connect web folder
   - Set API URL environment variable
   - Deploy

---

## 📁 Project Structure

```
AssignIQ/
├── backend/           # Node.js Express API
├── web/               # React.js Web App
├── mobile/            # React Native Mobile App
└── DEPLOYMENT.md      # This file
```

---

## 🔧 Required Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...
FRONTEND_URL=https://...
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

---

## 📱 Mobile App Deployment (Google Play Store)

### 1. Prepare for Release

```bash
cd mobile/android
```

### 2. Generate Signing Key

```bash
keytool -genkeypair -v -storetype PKCS12 -keyalg RSA \
  -keysize 2048 -validity 10000 \
  -keystore my-release-key.keystore \
  -alias assigniq-key
```

### 3. Configure Gradle

Add to `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=assigniq-key
MYAPP_RELEASE_STORE_PASSWORD=******
MYAPP_RELEASE_KEY_PASSWORD=******
```

### 4. Update build.gradle

```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_RELEASE_STORE_FILE)
        storePassword MYAPP_RELEASE_STORE_PASSWORD
        keyAlias MYAPP_RELEASE_KEY_ALIAS
        keyPassword MYAPP_RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 5. Build Release Bundle

```bash
cd mobile
npx react-native build-android --mode=release
```

Upload the `.aab` file to Google Play Console.

---

## 🔗 Useful Links

| Service | URL |
|---------|-----|
| MongoDB Atlas | https://cloud.mongodb.com |
| Render | https://render.com |
| Vercel | https://vercel.com |
| Railway | https://railway.app |
| Google Play Console | https://play.google.com/console |

---

## ✅ Pre-Launch Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure CORS with production URLs
- [ ] Enable HTTPS in production
- [ ] Set up monitoring/logging
- [ ] Configure backup for database
- [ ] Test all features in production
- [ ] Set up error reporting (Sentry)
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets

---

## 📞 Support

For deployment issues, check:
1. Render logs for backend errors
2. Vercel logs for frontend issues
3. MongoDB Atlas connection issues
4. Environment variable configuration

