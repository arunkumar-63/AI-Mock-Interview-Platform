const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['interview', 'resume-analysis', 'practice', 'assessment'],
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  activity: [{
    action: {
      type: String,
      enum: ['login', 'logout', 'start-interview', 'end-interview', 'pause-interview', 'resume-interview', 'upload-resume', 'analyze-resume', 'view-dashboard', 'update-profile'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  performance: {
    totalActions: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    errors: [{
      error: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      context: String
    }]
  },
  device: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    browser: String,
    version: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  metadata: {
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    customData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ user: 1, startTime: -1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ type: 1 });

// Method to end session
sessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / 1000);
  return this.save();
};

// Method to pause session
sessionSchema.methods.pauseSession = function() {
  this.status = 'paused';
  return this.save();
};

// Method to resume session
sessionSchema.methods.resumeSession = function() {
  this.status = 'active';
  return this.save();
};

// Method to add activity
sessionSchema.methods.addActivity = function(action, metadata = {}) {
  this.activity.push({
    action,
    timestamp: new Date(),
    metadata
  });
  this.performance.totalActions += 1;
  return this.save();
};

// Method to add error
sessionSchema.methods.addError = function(error, context = '') {
  this.performance.errors.push({
    error,
    timestamp: new Date(),
    context
  });
  return this.save();
};

// Virtual for session duration in minutes
sessionSchema.virtual('durationMinutes').get(function() {
  return Math.round(this.duration / 60);
});

// Virtual for session duration in hours
sessionSchema.virtual('durationHours').get(function() {
  return Math.round((this.duration / 3600) * 100) / 100;
});

// Virtual for is active
sessionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Ensure virtual fields are serialized
sessionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.durationMinutes = doc.durationMinutes;
    ret.durationHours = doc.durationHours;
    ret.isActive = doc.isActive;
    return ret;
  }
});

module.exports = mongoose.model('Session', sessionSchema); 