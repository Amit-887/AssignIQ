# Google OAuth Setup Guide

## Steps to Configure Google OAuth for AssignIQ

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API" and "Google Identity Toolkit API"

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Select "Web application" as application type
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)

### 3. Get Credentials
Copy the Client ID and Client Secret from the created credentials.

### 4. Update Environment Variables
In `/backend/.env`, update:
```
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
```

### 5. Update Frontend Configuration
In `/web/src/utils/googleAuth.js`, update:
```javascript
export const GOOGLE_CLIENT_ID = 'your-actual-google-client-id-here';
```

### 6. Restart Servers
After updating credentials, restart both frontend and backend servers.

## Testing
1. Go to http://localhost:3000
2. Click "Continue with Google"
3. Select your Google account
4. Should automatically log you in based on your selected role

## Notes
- Google OAuth works for Student, Teacher, and Admin roles
- For Teacher role, additional verification may be required
- New users will be automatically registered
- Existing users will be logged in if their email matches
