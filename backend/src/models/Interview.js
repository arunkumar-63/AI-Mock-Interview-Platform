const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'case', 'system-design', 'general', 'mixed'],
    required: true
  },
  subject: {
    type: String,
    enum: [
      'java', 'python', 'javascript', 'c++', 'dsa', 
      'system-design', 'database', 'networking', 'os', 'general',
      'ml', 'ai', 'data-science', 'blockchain', 'devops',
      'cloud', 'cybersecurity', 'mobile', 'react', 'node'
    ],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  industry: {
    type: String,
    trim: true
  },
  jobRole: {
    type: String,
    trim: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'paused', 'cancelled'],
    default: 'scheduled'
  },
  settings: {
    duration: {
      type: Number, // in minutes
      default: 30
    },
    questionCount: {
      type: Number,
      default: 10
    },
    allowVoiceInput: {
      type: Boolean,
      default: true
    },
    realTimeFeedback: {
      type: Boolean,
      default: true
    },
    autoAdvance: {
      type: Boolean,
      default: false
    }
  },
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'case', 'system-design', 'general'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    expectedKeywords: [String],
    timeLimit: {
      type: Number, // in seconds
      default: 120
    },
    order: {
      type: Number,
      required: true
    },
    correctAnswer: {
      type: String,
      default: ''
    },
    keyPoints: [String],
    commonMistakes: [String]
  }],
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    audioUrl: String,
    videoUrl: String,
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    evaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      feedback: {
        strengths: [String],
        weaknesses: [String],
        suggestions: [String]
      },
      keywords: {
        found: [String],
        missing: [String]
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      relevance: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      clarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      videoAnalysis: {
        facialExpressions: {
          confidence: { type: Number, default: 0 },
          engagement: { type: Number, default: 0 },
          stress: { type: Number, default: 0 },
          positivity: { type: Number, default: 0 }
        },
        eyeContact: {
          score: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
          notes: String
        },
        bodyLanguage: {
          posture: { type: Number, default: 0 },
          gestures: { type: Number, default: 0 },
          movement: String,
          notes: String
        },
        overall: { type: Number, default: 0 }
      },
      audioAnalysis: {
        speechClarity: { type: Number, default: 0 },
        pace: {
          wordsPerMinute: { type: Number, default: 0 },
          rating: String, // 'too-fast', 'optimal', 'too-slow'
          score: { type: Number, default: 0 }
        },
        tone: {
          confidence: { type: Number, default: 0 },
          enthusiasm: { type: Number, default: 0 },
          professionalism: { type: Number, default: 0 }
        },
        fillerWords: {
          count: { type: Number, default: 0 },
          types: [String],
          frequency: { type: Number, default: 0 }
        },
        pauses: {
          count: { type: Number, default: 0 },
          averageDuration: { type: Number, default: 0 },
          appropriateness: { type: Number, default: 0 }
        },
        volume: {
          average: { type: Number, default: 0 },
          consistency: { type: Number, default: 0 }
        },
        overall: { type: Number, default: 0 }
      },
      transcript: String,
      multimodalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      correctness: {
        isCorrect: {
          type: Boolean,
          default: false
        },
        correctnessScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        },
        keyPointsCovered: [String],
        keyPointsMissed: [String],
        mistakesMade: [String]
      },
      improvementAreas: [{
        area: String,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium'
        },
        suggestion: String,
        impact: String
      }]
    }
  }],
  performance: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    categoryScores: {
      technical: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      behavioral: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      case: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      systemDesign: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      general: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    metrics: {
      totalQuestions: {
        type: Number,
        default: 0
      },
      answeredQuestions: {
        type: Number,
        default: 0
      },
      averageTimePerQuestion: {
        type: Number,
        default: 0
      },
      totalTime: {
        type: Number,
        default: 0
      }
    },
    strengths: [{
      category: String,
      points: [String]
    }],
    weaknesses: [{
      category: String,
      points: [String]
    }],
    recommendations: [{
      category: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      recommendations: [String]
    }]
  },
  session: {
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    currentQuestion: {
      type: Number,
      default: 0
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    pauseTime: {
      type: Date
    },
    resumeTime: {
      type: Date
    }
  },
  metadata: {
    tags: [String],
    notes: String,
    isPublic: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ type: 1 });
interviewSchema.index({ 'performance.overallScore': -1 });
interviewSchema.index({ 'session.startTime': -1 });

// Method to start interview
interviewSchema.methods.startInterview = function() {
  this.status = 'in-progress';
  this.session.startTime = new Date();
  this.session.currentQuestion = 0;
  return this.save();
};

// Method to end interview
interviewSchema.methods.endInterview = function() {
  this.status = 'completed';
  this.session.endTime = new Date();
  this.session.duration = Math.round((this.session.endTime - this.session.startTime) / 1000);
  this.calculatePerformance();
  return this.save();
};

// Method to pause interview
interviewSchema.methods.pauseInterview = function() {
  this.status = 'paused';
  this.session.isPaused = true;
  this.session.pauseTime = new Date();
  return this.save();
};

// Method to resume interview
interviewSchema.methods.resumeInterview = function() {
  this.status = 'in-progress';
  this.session.isPaused = false;
  this.session.resumeTime = new Date();
  return this.save();
};

// Method to add answer
interviewSchema.methods.addAnswer = function(questionId, answer, audioUrl = null, timeSpent = 0) {
  const existingAnswerIndex = this.answers.findIndex(a => a.questionId === questionId);
  
  if (existingAnswerIndex >= 0) {
    this.answers[existingAnswerIndex] = {
      questionId,
      answer,
      audioUrl,
      timeSpent,
      timestamp: new Date()
    };
  } else {
    this.answers.push({
      questionId,
      answer,
      audioUrl,
      timeSpent,
      timestamp: new Date()
    });
  }
  
  this.session.currentQuestion = Math.min(this.session.currentQuestion + 1, this.questions.length);
  return this.save();
};

// Method to calculate performance
interviewSchema.methods.calculatePerformance = function() {
  console.log('Calculating performance for interview:', this._id);
  console.log('Answers count:', this.answers.length);
  console.log('Questions count:', this.questions.length);
  
  if (this.answers.length === 0) {
    console.log('No answers to calculate performance');
    // Set defaults when no answers
    this.performance.overallScore = 0;
    this.performance.metrics.answeredQuestions = 0;
    this.performance.metrics.totalQuestions = this.questions.length;
    this.performance.metrics.averageTimePerQuestion = 0;
    this.performance.metrics.totalTime = 0;
    return;
  }
  
  let totalScore = 0;
  let validAnswersCount = 0;
  const categoryScores = {};
  const categoryCounts = {};
  const allStrengths = [];
  const allWeaknesses = [];
  const allRecommendations = [];
  
  this.answers.forEach(answer => {
    const question = this.questions.find(q => q.questionId === answer.questionId);
    if (!question) {
      console.log('Question not found for answer:', answer.questionId);
      return;
    }
    
    if (!answer.evaluation || !answer.evaluation.score) {
      console.log('No evaluation or score for answer:', answer.questionId);
      return;
    }
    
    validAnswersCount++;
    totalScore += answer.evaluation.score || 0;
    
    if (!categoryScores[question.category]) {
      categoryScores[question.category] = 0;
      categoryCounts[question.category] = 0;
    }
    
    categoryScores[question.category] += answer.evaluation.score || 0;
    categoryCounts[question.category]++;
    
    // Collect strengths from feedback
    if (answer.evaluation.feedback?.strengths) {
      answer.evaluation.feedback.strengths.forEach(strength => {
        if (strength && !allStrengths.includes(strength)) {
          allStrengths.push(strength);
        }
      });
    }
    
    // Collect weaknesses from feedback
    if (answer.evaluation.feedback?.weaknesses) {
      answer.evaluation.feedback.weaknesses.forEach(weakness => {
        if (weakness && !allWeaknesses.includes(weakness)) {
          allWeaknesses.push(weakness);
        }
      });
    }
    
    // Collect suggestions as recommendations
    if (answer.evaluation.feedback?.suggestions) {
      answer.evaluation.feedback.suggestions.forEach(suggestion => {
        if (suggestion && !allRecommendations.includes(suggestion)) {
          allRecommendations.push(suggestion);
        }
      });
    }
  });
  
  console.log('Valid answers with scores:', validAnswersCount);
  console.log('Total score:', totalScore);
  
  this.performance.overallScore = validAnswersCount > 0 ? Math.round(totalScore / validAnswersCount) : 0;
  this.performance.metrics.answeredQuestions = this.answers.length;
  this.performance.metrics.totalQuestions = this.questions.length;
  
  // Calculate category scores
  Object.keys(categoryScores).forEach(category => {
    if (categoryCounts[category] > 0) {
      const categoryKey = category === 'system-design' ? 'systemDesign' : category;
      this.performance.categoryScores[categoryKey] = Math.round(categoryScores[category] / categoryCounts[category]);
    }
  });
  
  // Calculate average time per question
  const totalTime = this.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
  this.performance.metrics.averageTimePerQuestion = this.answers.length > 0 ? Math.round(totalTime / this.answers.length) : 0;
  this.performance.metrics.totalTime = totalTime;
  
  console.log('Performance calculated:', {
    overallScore: this.performance.overallScore,
    answeredQuestions: this.performance.metrics.answeredQuestions,
    totalTime: this.performance.metrics.totalTime
  });
  
  // Populate consolidated strengths
  this.performance.strengths = allStrengths.length > 0 ? [
    {
      category: 'Overall Performance',
      points: allStrengths.slice(0, 10) // Top 10 strengths
    }
  ] : [];
  
  // Populate consolidated weaknesses
  this.performance.weaknesses = allWeaknesses.length > 0 ? [
    {
      category: 'Areas for Improvement',
      points: allWeaknesses.slice(0, 10) // Top 10 weaknesses
    }
  ] : [];
  
  // Populate consolidated recommendations
  this.performance.recommendations = allRecommendations.length > 0 ? [
    {
      category: 'Action Items',
      priority: 'high',
      recommendations: allRecommendations.slice(0, 10) // Top 10 recommendations
    }
  ] : [];
};

// Virtual for completion percentage
interviewSchema.virtual('completionPercentage').get(function() {
  if (this.questions.length === 0) return 0;
  return Math.round((this.answers.length / this.questions.length) * 100);
});

// Virtual for time remaining
interviewSchema.virtual('timeRemaining').get(function() {
  if (!this.session.startTime || this.status === 'completed') return 0;
  
  const elapsed = Math.round((new Date() - this.session.startTime) / 1000);
  const totalAllowed = this.settings.duration * 60;
  return Math.max(0, totalAllowed - elapsed);
});

// Ensure virtual fields are serialized
interviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.completionPercentage = doc.completionPercentage;
    ret.timeRemaining = doc.timeRemaining;
    return ret;
  }
});

module.exports = mongoose.model('Interview', interviewSchema); 