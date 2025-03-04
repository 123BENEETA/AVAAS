# AVAASS System Architecture

## Overview
AVAASS (Advanced Voice and Audio Assistance for Stammering Support) is a web application designed to help individuals who stutter by converting their whispered speech into clear, fluent spoken output.

## Core Components

### Frontend (React)
- Audio Capture Interface
- Real-time Transcription Display
- Predictive Text Suggestions
- Text-to-Speech Controls
- Facial Animation Renderer
- Social Sharing Options
- Authentication System (Login/Signup)

### Backend Services

#### Authentication & User Management (MongoDB)
- User Registration and Authentication
- JWT-based Session Management
- Password Recovery System
- Social Authentication Integration
- User Profile Management

#### Audio Processing Pipeline
- Whispered Audio Capture
- Noise Reduction (RNNoise-WASM)
- Speech-to-Text Processing (Whisper.cpp)

#### Text Processing
- Predictive Text Generation
- Text Normalization

#### Speech Synthesis
- Voice Cloning (Coqui XTTS v2)
- Audio Output Generation

#### Animation System
- Lip Sync Processing
- Facial Expression Generation

## Data Flow
1. User authentication via email/password or social login
2. User whispers into microphone
3. Audio is processed through RNNoise for noise reduction
4. Processed audio is sent to Whisper.cpp for transcription
5. Transcribed text is displayed and enhanced with predictive suggestions
6. User confirms text for synthesis
7. Text is sent to Coqui XTTS v2 for voice synthesis
8. Synthesized speech drives facial animations
9. Audio and/or animations are presented to the listener
10. (Optional) User shares content via social platforms

## User Authentication Flow
1. User registers with email/password or social login (Google/Facebook)
2. Authentication credentials are validated and stored in MongoDB
3. JWT token is generated and provided to the client
4. Subsequent API requests use the JWT for authentication
5. User sessions are maintained with token refresh mechanism
6. Password reset functionality via email

## Database Schema (MongoDB)

### Users Collection
- `_id`: Unique identifier (ObjectId)
- `name`: User's full name (String)
- `email`: User's email address (String, unique)
- `password`: Hashed password (String)
- `resetPasswordToken`: Token for password reset (String, optional)
- `resetPasswordExpires`: Expiry timestamp for password reset token (Date, optional)
- `createdAt`: Account creation timestamp (Date)

## Security Implementation
- Password hashing using bcrypt
- JWT-based authentication
- CORS protection
- Rate limiting for authentication attempts
- Secure HTTP-only cookies option
- Input validation and sanitization
- Protection against common web vulnerabilities

## Technical Stack
- **Frontend**: React, WebRTC, Three.js
- **Backend**: Node.js/Express
- **Database**: MongoDB
- **Authentication**: JWT, bcrypt
- **Speech Processing**: Whisper.cpp, RNNoise-WASM
- **TTS**: Coqui XTTS v2
- **3D Animation**: Three.js
- **API Integration**: RESTful APIs, WebSockets

## Deployment Architecture
- Frontend: Static site hosting (Netlify/Vercel)
- Backend API: Node.js application server
- Database: MongoDB Atlas or self-hosted MongoDB
- WebSocket Server: Integrated with Express for real-time communication
- File Storage: Local server storage with backup system
