# AI Mock Interview Platform

A comprehensive platform for AI-powered mock interviews, resume analysis, and performance analytics.

## Project Structure

```
AI Mock Interview Platform/
├── backend/                 # Backend server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API services
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md              # This file
```

## Features

- 🤖 **AI-Powered Mock Interviews** - Practice with personalized questions using Google Gemini AI
- 📄 **Resume Analysis** - Upload and analyze resumes with AI feedback
- 📊 **Performance Analytics** - Track your interview performance over time
- 🔐 **User Authentication** - Secure user registration and login
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Documentation

- AI Interview Coach behavior: see `docs/AI_INTERVIEW_COACH.md` for the interview flow and feedback rules.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-mock-interview-platform
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/interview_ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Gemini AI API Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=2048

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
BCRYPT_ROUNDS=12
MIN_PASSWORD_LENGTH=6

# Feature Flags
ENABLE_ANALYTICS=true

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=90
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Interviews
- `POST /api/interview` - Create new interview
- `GET /api/interview` - Get all interviews
- `GET /api/interview/:id` - Get interview by ID
- `PUT /api/interview/:id` - Update interview (start, submit answer, end)
- `DELETE /api/interview/:id` - Delete interview

### Resumes
- `POST /api/resume` - Upload and analyze resume
- `GET /api/resume` - Get all resumes
- `GET /api/resume/:id` - Get resume by ID
- `PUT /api/resume/:id` - Update resume (analyze, get suggestions)
- `DELETE /api/resume/:id` - Delete resume

### Analytics
- `GET /api/analytics` - Get comprehensive analytics

## Available Scripts

### Root Level
- `npm start` - Start both frontend and backend in production mode
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install-all` - Install dependencies for all packages
- `npm run build` - Build the frontend for production
- `npm test` - Run backend tests

### Backend Only
- `cd backend && npm start` - Start backend server
- `cd backend && npm run dev` - Start backend with nodemon
- `cd backend && npm test` - Run backend tests

### Frontend Only
- `cd client && npm start` - Start React development server
- `cd client && npm run build` - Build for production

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Google Gemini AI** - AI services
- **Multer** - File upload handling

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Deployment

### Deploy to Render (Recommended)

This application is configured for easy deployment to Render using the `render.yaml` file.

1. Fork this repository to your GitHub account
2. Sign up for a free account at [render.com](https://render.com)
3. Click "New Web Service" and connect your GitHub account
4. Select your forked repository
5. Render will automatically detect the `render.yaml` configuration
6. Add the required environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret key for JWT tokens
   - `GEMINI_API_KEY`: Your Google Gemini API key
7. Click "Create Web Service"

The application will automatically deploy both the frontend and backend services.

### Manual Deployment

If you prefer to deploy manually:

#### Backend Deployment
1. Deploy the `backend` directory to any Node.js hosting service
2. Set the required environment variables
3. Ensure the PORT is configured correctly (Render uses 10000)

#### Frontend Deployment
1. Build the React app: `cd client && npm run build`
2. Deploy the `build` directory to any static hosting service
3. Set the `REACT_APP_API_URL` environment variable to your backend URL

## License

This project is licensed under the MIT License. 