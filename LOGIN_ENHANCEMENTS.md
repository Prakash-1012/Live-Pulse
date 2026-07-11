# Login Enhancement - Setup Guide

## Changes Made

### Frontend Changes

1. **Email Validation**
   - Created `src/lib/emailValidator.ts` with email format validation
   - Updated both `Login.tsx` and `ParticipantLogin.tsx` to:
     - Show "Enter a valid Email" error for invalid email formats
     - Highlight email input field in red when validation fails
     - Prevent login attempt if email is invalid

2. **Google OAuth Integration**
   - Added `@react-oauth/google` and `@google/identity-services` to `package.json`
   - Wrapped app with `GoogleOAuthProvider` in `App.tsx`
   - Updated both login pages with Google Sign-In button
   - Added `handleGoogleLogin` function to send Google token to backend

3. **UI Improvements**
   - Added divider line with "Or continue with" text
   - Integrated Google login button using official Google component
   - Consistent styling across both login pages

### Backend Changes

1. **Google Token Handling**
   - Added `decodeGoogleToken()` utility to decode Google JWT tokens
   - Created `/auth/google-login` endpoint
   - Handles user creation for first-time Google logins
   - Generates random password for Google users (they don't need it)

2. **User Model Updates**
   - Added optional fields:
     - `profilePicture` - Stores Google profile picture URL
     - `googleId` - Stores Google unique identifier
     - `createdAt` - Tracks user creation date

3. **Auth Routes**
   - Added `POST /auth/google-login` route

## Setup Instructions

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Add Google Client ID to `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

To get your Google Client ID:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable Google+ API
- Create OAuth 2.0 credentials (Web application)
- Add your redirect URIs (e.g., `http://localhost:5173`)
- Copy the Client ID

### Backend Setup

1. No additional dependencies needed (JWT decoding uses existing libraries)
2. Ensure `.env` has `JWT_SECRET` set

## Features

✅ Email validation with user-friendly error messages
✅ Google OAuth login for both hosts and participants
✅ Automatic user creation on first Google login
✅ Profile picture storage from Google
✅ Responsive error states
✅ Consistent UI across login pages

## Testing

1. **Email Validation Test:**
   - Try logging in with invalid email (e.g., "notanemail")
   - Should see "Enter a valid Email" error
   - Email input should be highlighted in red

2. **Google Login Test:**
   - Click "Sign in with Google" button
   - Complete Google authentication
   - Should be redirected to appropriate page (dashboard or join session)

## Notes

- Google token decoding currently doesn't verify signature. For production, add `google-auth-library` package for proper JWT verification.
- Google users get a random password generated but won't need it since they use OAuth
- Profile pictures from Google are stored but not currently displayed (can be implemented in future)
