const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found or token is invalid' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.' 
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        message: 'An error occurred during authentication' 
      });
    }
  }
};

// Middleware to check if user is verified
const requireVerification = async (req, res, next) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email address before accessing this feature' 
      });
    }
    next();
  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ 
      error: 'Verification check failed',
      message: 'An error occurred while checking verification status' 
    });
  }
};

// Middleware to check subscription level
const checkSubscription = (requiredPlan = 'free') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const planHierarchy = {
        'free': 0,
        'basic': 1,
        'premium': 2
      };

      const userPlanLevel = planHierarchy[user.subscription?.plan || 'free'];
      const requiredPlanLevel = planHierarchy[requiredPlan];

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: `This feature requires a ${requiredPlan} subscription or higher`,
          requiredPlan,
          currentPlan: user.subscription?.plan || 'free'
        });
      }

      // Check if subscription is still valid
      if (user.subscription?.endDate && new Date() > user.subscription.endDate) {
        return res.status(403).json({ 
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue using premium features.',
          requiredPlan,
          currentPlan: user.subscription?.plan || 'free'
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({ 
        error: 'Subscription check failed',
        message: 'An error occurred while checking subscription status' 
      });
    }
  };
};

// Middleware to check if user owns the resource
const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resourceId = req.params.id || req.params.resumeId || req.params.interviewId;
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Resource ID required',
          message: 'Please provide a valid resource ID' 
        });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found',
          message: 'The requested resource was not found' 
        });
      }

      // Check if user owns the resource or has shared access
      if (resource.user.toString() !== req.user._id.toString()) {
        // Check for shared access
        if (resource.metadata?.sharedWith) {
          const hasSharedAccess = resource.metadata.sharedWith.some(share => 
            share.user.toString() === req.user._id.toString()
          );
          
          if (!hasSharedAccess) {
            return res.status(403).json({ 
              error: 'Access denied',
              message: 'You do not have permission to access this resource' 
            });
          }
        } else {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'You do not have permission to access this resource' 
          });
        }
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        error: 'Ownership check failed',
        message: 'An error occurred while checking resource ownership' 
      });
    }
  };
};

// Middleware to check rate limiting for specific actions
const rateLimitAction = (action, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.user._id}:${action}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      attempts.set(key, attempts.get(key).filter(timestamp => timestamp > windowStart));
    } else {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);

    if (userAttempts.length >= maxAttempts) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: `Too many ${action} attempts. Please try again later.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userAttempts.push(now);
    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  requireVerification,
  checkSubscription,
  checkOwnership,
  rateLimitAction,
  generateToken,
  generateRefreshToken
}; 