const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: Number,
    default: 1
  },
  file: {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  },
  content: {
    rawText: {
      type: String,
      required: true
    },
    structuredData: {
      personalInfo: {
        name: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        website: String
      },
      summary: String,
      experience: [{
        title: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        description: [String],
        achievements: [String]
      }],
      education: [{
        degree: String,
        institution: String,
        location: String,
        startDate: String,
        endDate: String,
        gpa: String,
        relevantCourses: [String]
      }],
      skills: [{
        category: String,
        skills: [String]
      }],
      projects: [{
        title: String,
        description: String,
        technologies: [String],
        link: String,
        startDate: String,
        endDate: String
      }],
      certifications: [{
        name: String,
        issuer: String,
        date: String,
        expiryDate: String
      }],
      languages: [{
        language: String,
        proficiency: String
      }]
    }
  },
  analysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    scores: {
      structure: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      content: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      impact: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      keywords: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    ats: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      reasons: [String],
      keywordMatchPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      parsingIssues: [String]
    },
    feedback: {
      strengths: [{
        category: String,
        points: [String]
      }],
      weaknesses: [{
        category: String,
        points: [String]
      }],
      suggestions: [{
        category: String,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        suggestions: [String]
      }]
    },
    corrections: [{
      section: String,
      before: String,
      after: String,
      rationale: String
    }],
    advice: [String],
    keywordAnalysis: {
      found: [{
        keyword: String,
        count: Number,
        context: [String]
      }],
      missing: [{
        keyword: String,
        importance: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        suggestion: String
      }]
    },
    industryMatch: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      matchedIndustries: [String],
      recommendations: [String]
    }
  },
  metadata: {
    targetJob: {
      title: String,
      industry: String,
      company: String,
      level: String
    },
    targetJobRole: String, // Added field for target job role
    targetIndustry: String, // Added field for target industry
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['draft', 'analyzed', 'optimized', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ 'metadata.tags': 1 });
resumeSchema.index({ 'analysis.overallScore': -1 });
resumeSchema.index({ status: 1 });

// Virtual for full file path
resumeSchema.virtual('fullFilePath').get(function() {
  return `${process.env.UPLOAD_PATH || 'uploads'}/${this.file.fileName}`;
});

// Method to get previous version
resumeSchema.methods.getPreviousVersion = async function() {
  return await this.constructor.findOne({
    user: this.user,
    title: this.title,
    version: { $lt: this.version }
  }).sort({ version: -1 });
};

// Method to get next version
resumeSchema.methods.getNextVersion = async function() {
  return await this.constructor.findOne({
    user: this.user,
    title: this.title,
    version: { $gt: this.version }
  }).sort({ version: 1 });
};

// Method to create new version
resumeSchema.methods.createNewVersion = async function(newFileData) {
  const latestVersion = await this.constructor.findOne({
    user: this.user,
    title: this.title
  }).sort({ version: -1 });
  
  const newVersion = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    version: (latestVersion ? latestVersion.version : 0) + 1,
    file: newFileData,
    createdAt: undefined,
    updatedAt: undefined
  });
  
  return await newVersion.save();
};

// Method to calculate overall score
resumeSchema.methods.calculateOverallScore = function() {
  const scores = this.analysis.scores;
  const weights = {
    structure: 0.25,
    content: 0.3,
    impact: 0.25,
    keywords: 0.2
  };
  
  this.analysis.overallScore = Math.round(
    scores.structure * weights.structure +
    scores.content * weights.content +
    scores.impact * weights.impact +
    scores.keywords * weights.keywords
  );
  
  return this.analysis.overallScore;
};

// Ensure virtual fields are serialized
resumeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.fullFilePath = doc.fullFilePath;
    return ret;
  }
});

module.exports = mongoose.model('Resume', resumeSchema); 