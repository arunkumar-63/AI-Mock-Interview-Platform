const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
} else {
  // In production, environment variables should be set by the platform (Render)
  console.log('🔧 Running in production mode. Environment variables should be set by platform.');
  console.log('🔑 MONGODB_URI is set:', !!process.env.MONGODB_URI);
  console.log('🔐 JWT_SECRET is set:', !!process.env.JWT_SECRET);
}

const app = express();
// Use PORT from environment variable or default to 10000 for Render, 5001 for local development
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 10000 : 5001);

// Import routes
const authRoutes = require('./src/routes/auth');
const resumeRoutes = require('./src/routes/resume');
const interviewRoutes = require('./src/routes/interview');
const analyticsRoutes = require('./src/routes/analytics');
const uploadRoutes = require('./src/routes/upload');

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with better error handling
let isDatabaseConnected = false;

const connectDatabase = async () => {
  try {
    // Log the MongoDB URI being used (masking sensitive info)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_ai';
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URI (masked):', mongoUri.replace(/\/\/(.*?):(.*?)@/, '//****:****@'));
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔍 MONGODB_URI from env:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    console.log('✅ Connected to MongoDB');
    isDatabaseConnected = true;
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isDatabaseConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isDatabaseConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isDatabaseConnected = true;
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('📋 Error details:', err);
    console.log('⚠️ Continuing without database connection for development...');
    console.log('💡 To fix this, you can:');
    console.log('   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
    console.log('   2. Or update your MONGODB_URI in .env file with a valid connection string');
    console.log('   3. Check that your MongoDB Atlas cluster is configured to accept connections');
    isDatabaseConnected = false;
  }
};

// Initialize database connection
connectDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: isDatabaseConnected ? 'connected' : 'disconnected'
  });
});

// Database status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle MongoDB connection errors
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'The database is currently unavailable. Please try again later.',
      retryAfter: 30
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }))
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please provide a valid authentication token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Your session has expired. Please log in again.'
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${isDatabaseConnected ? 'Connected' : 'Disconnected'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;