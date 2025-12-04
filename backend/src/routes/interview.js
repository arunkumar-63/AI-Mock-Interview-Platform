const express = require('express');
const { body, validationResult } = require('express-validator');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { authenticateToken } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const mediaAnalysisService = require('../services/mediaAnalysisService');

const router = express.Router();

// @route   POST /api/interview
// @desc    Create a new mock interview
// @access  Private
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('type').isIn(['technical', 'behavioral', 'case', 'system-design', 'general', 'mixed']).withMessage('Invalid interview type'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('industry').optional().trim(),
  body('jobRole').optional().trim(),
  body('settings.duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
  body('settings.questionCount').optional().isInt({ min: 5, max: 50 }).withMessage('Question count must be between 5 and 50'),
  body('resumeId').optional().isMongoId().withMessage('Invalid resume ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      type,
      subject = 'general',
      difficulty,
      industry,
      jobRole,
      settings = {},
      resumeId
    } = req.body;

    let resumeData = null;
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
      if (resume) {
        resumeData = resume;
        // Add target job role and industry information to resume data
        if (!resumeData.metadata) {
          resumeData.metadata = {};
        }
        resumeData.metadata.targetJobRole = jobRole || req.user.profile?.jobTitle || 'Not specified';
        resumeData.metadata.targetIndustry = industry || req.user.profile?.industry || 'general';
      }
    }

    // Get previous questions from user's interview history to avoid repetition
    const previousInterviews = await Interview.find({
      user: req.user._id,
      type: type,
      status: { $in: ['completed', 'in-progress'] }
    })
      .sort({ createdAt: -1 })
      .limit(5) // Last 5 interviews of the same type
      .select('questions');
    
    const previousQuestions = [];
    previousInterviews.forEach(interview => {
      if (interview.questions && Array.isArray(interview.questions)) {
        interview.questions.forEach(q => {
          if (q.question && !previousQuestions.includes(q.question)) {
            previousQuestions.push(q.question);
          }
        });
      }
    });

    console.log(`Generating ${settings.questionCount || 10} questions for ${type} interview (${difficulty} level)`);
    console.log(`Avoiding ${previousQuestions.length} previously asked questions`);

    // Generate questions using AI service
    let questions = [];
    try {
      questions = await geminiService.generateInterviewQuestions(
        req.user,
        resumeData,
        type,
        subject,
        difficulty,
        settings.questionCount || 10,
        previousQuestions
      );
    } catch (aiError) {
      console.error('AI service error:', aiError);
      return res.status(500).json({
        error: 'Failed to generate questions',
        message: 'Unable to generate interview questions. Please try again later.'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate questions',
        message: 'Unable to generate interview questions. Please try again.'
      });
    }

    // Use jobRole from request body if provided, otherwise fallback to user's job title
    const targetJobRole = jobRole || req.user.profile?.jobTitle || 'Not specified';
    // Use industry from request body if provided, otherwise fallback to user's industry
    const targetIndustry = industry || req.user.profile?.industry || 'general';

    const interview = new Interview({
      user: req.user._id,
      title,
      type,
      subject,
      difficulty,
      industry: targetIndustry,
      jobRole: targetJobRole,
      status: 'scheduled',
      settings: {
        duration: settings.duration || 30,
        questionCount: settings.questionCount || 10,
        allowVoiceInput: settings.allowVoiceInput !== false,
        realTimeFeedback: settings.realTimeFeedback !== false,
        autoAdvance: settings.autoAdvance || false
      },
      questions: questions.map((q, index) => ({
        questionId: `q_${Date.now()}_${index}`, // Generate unique question ID
        ...q,
        order: index + 1
      }))
    });

    await interview.save();
    
    console.log('Interview saved:', interview._id);
    console.log('Interview data:', interview.toJSON());

    // Update user stats
    req.user.stats.totalInterviews += 1;
    await req.user.save();

    res.status(201).json({
      message: 'Interview created successfully',
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      error: 'Failed to create interview',
      message: 'An error occurred while creating the interview'
    });
  }
});

// @route   GET /api/interview
// @desc    Get all interviews for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('resumeId', 'title');

    const total = await Interview.countDocuments(filter);

    res.json({
      interviews: interviews.map(interview => interview.toJSON()),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + interviews.length < total,
        hasPrev: parseInt(page) > 1,
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      error: 'Failed to get interviews',
      message: 'An error occurred while fetching interviews'
    });
  }
});

// @route   GET /api/interview/:id
// @desc    Get interview by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Loading interview with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('resumeId', 'title content');

    if (!interview) {
      console.log('Interview not found for user:', req.user._id, 'with ID:', req.params.id);
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    console.log('Found interview:', interview._id);
    
    res.json({
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      error: 'Failed to get interview',
      message: 'An error occurred while fetching the interview'
    });
  }
});

// @route   POST /api/interview/:id/start
// @desc    Start an interview session
// @access  Private
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Interview can only be started from scheduled status'
      });
    }

    interview.status = 'in-progress';
    interview.session = {
      startTime: new Date(),
      currentQuestion: 0
    };

    await interview.save();

    res.json({
      message: 'Interview started successfully',
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({
      error: 'Failed to start interview',
      message: 'An error occurred while starting the interview'
    });
  }
});

// @route   POST /api/interview/:id/pause
// @desc    Pause an interview session
// @access  Private
router.post('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Interview can only be paused when in-progress'
      });
    }

    interview.status = 'paused';
    interview.session.pauseTime = new Date();

    await interview.save();

    res.json({
      message: 'Interview paused successfully',
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Pause interview error:', error);
    res.status(500).json({
      error: 'Failed to pause interview',
      message: 'An error occurred while pausing the interview'
    });
  }
});

// @route   POST /api/interview/:id/resume
// @desc    Resume a paused interview session
// @access  Private
router.post('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    if (interview.status !== 'paused') {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Interview can only be resumed when paused'
      });
    }

    interview.status = 'in-progress';
    interview.session.resumeTime = new Date();

    await interview.save();

    res.json({
      message: 'Interview resumed successfully',
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Resume interview error:', error);
    res.status(500).json({
      error: 'Failed to resume interview',
      message: 'An error occurred while resuming the interview'
    });
  }
});

// @route   POST /api/interview/:id/retake
// @desc    Retake a completed interview (creates new interview with same settings)
// @access  Private
router.post('/:id/retake', authenticateToken, async (req, res) => {
  try {
    const originalInterview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalInterview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    // Get resume data if exists
    let resumeData = null;
    if (originalInterview.resumeId) {
      const resume = await Resume.findOne({ _id: originalInterview.resumeId, user: req.user._id });
      if (resume) {
        resumeData = resume;
        // Add target job role and industry information to resume data
        if (!resumeData.metadata) {
          resumeData.metadata = {};
        }
        resumeData.metadata.targetJobRole = originalInterview.jobRole || req.user.profile?.jobTitle || 'Not specified';
        resumeData.metadata.targetIndustry = originalInterview.industry || req.user.profile?.industry || 'general';
      }
    }

    // Get previous questions from user's interview history to avoid repetition
    const previousInterviews = await Interview.find({
      user: req.user._id,
      type: originalInterview.type,
      status: { $in: ['completed', 'in-progress'] }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('questions');
    
    const previousQuestions = [];
    previousInterviews.forEach(interview => {
      if (interview.questions && Array.isArray(interview.questions)) {
        interview.questions.forEach(q => {
          if (q.question && !previousQuestions.includes(q.question)) {
            previousQuestions.push(q.question);
          }
        });
      }
    });

    console.log(`Retaking interview: generating ${originalInterview.settings.questionCount || 10} new questions`);

    // Generate new questions using AI service
    let questions = [];
    try {
      questions = await geminiService.generateInterviewQuestions(
        req.user,
        resumeData,
        originalInterview.type,
        originalInterview.subject,
        originalInterview.difficulty,
        originalInterview.settings.questionCount || 10,
        previousQuestions
      );
    } catch (aiError) {
      console.error('AI service error:', aiError);
      return res.status(500).json({
        error: 'Failed to generate questions',
        message: 'Unable to generate interview questions. Please try again later.'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate questions',
        message: 'Unable to generate interview questions. Please try again.'
      });
    }

    // Create new interview with same settings
    const newInterview = new Interview({
      user: req.user._id,
      title: `${originalInterview.title} (Retake)`,
      subject: originalInterview.subject || 'general',
      type: originalInterview.type,
      difficulty: originalInterview.difficulty,
      industry: originalInterview.industry,
      jobRole: originalInterview.jobRole,
      resumeId: originalInterview.resumeId,
      status: 'scheduled',
      settings: originalInterview.settings,
      questions: questions.map((q, index) => ({
        questionId: `q_${Date.now()}_${index}`,
        ...q,
        order: index + 1
      }))
    });

    await newInterview.save();

    // Update user stats
    req.user.stats.totalInterviews += 1;
    await req.user.save();

    res.status(201).json({
      message: 'Interview retake created successfully',
      interview: newInterview.toJSON()
    });

  } catch (error) {
    console.error('Retake interview error:', error);
    res.status(500).json({
      error: 'Failed to retake interview',
      message: 'An error occurred while creating the retake interview'
    });
  }
});

// @route   POST /api/interview/:id/submit-answer
// @desc    Submit an answer to an interview question
// @access  Private
router.post('/:id/submit-answer', authenticateToken, [
  body('questionId').notEmpty().withMessage('Question ID is required'),
  body('answer').optional().isString().withMessage('Answer must be a string'),
  body('audioUrl').optional(),
  body('videoUrl').optional(),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive number')
], async (req, res) => {
  try {
    console.log('Submit answer request received:', {
      interviewId: req.params.id,
      questionId: req.body.questionId,
      hasAnswer: !!req.body.answer,
      hasAudioUrl: !!req.body.audioUrl,
      hasVideoUrl: !!req.body.videoUrl
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { questionId, answer, audioUrl, videoUrl, timeSpent = 0 } = req.body;
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      console.error('Interview not found:', req.params.id);
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    console.log('Interview status:', interview.status);

    // Auto-resume paused interviews when submitting an answer
    if (interview.status === 'paused') {
      console.log('Auto-resuming paused interview');
      interview.status = 'in-progress';
      interview.session.resumeTime = new Date();
    }

    if (interview.status !== 'in-progress') {
      console.error('Invalid interview status:', interview.status);
      return res.status(400).json({
        error: 'Invalid action',
        message: `Interview must be in-progress to submit answers. Current status: ${interview.status}`
      });
    }

    // Check if either answer or audioUrl is provided
    const hasTextAnswer = answer && answer.trim().length > 0;
    const hasAudioAnswer = audioUrl && audioUrl.trim().length > 0;
    const hasVideoAnswer = videoUrl && videoUrl.trim().length > 0;
    
    if (!hasTextAnswer && !hasAudioAnswer && !hasVideoAnswer) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Provide text, audio, or video recording'
      });
    }
    
    // Ensure answer field is never empty for MongoDB validation
    const finalAnswer = hasTextAnswer ? answer.trim() : (hasAudioAnswer ? '[Audio Recording]' : '[Video Recording]');
    
    const question = interview.questions.find(q => q.questionId === questionId);
    if (!question) {
      return res.status(404).json({
        error: 'Question not found',
        message: 'The specified question does not exist'
      });
    }

    // Remove existing answer if it exists
    interview.answers = interview.answers.filter(a => a.questionId !== questionId);
    
    // Create answer data
    const answerData = {
      questionId,
      answer: finalAnswer,
      audioUrl: audioUrl || null,
      videoUrl: videoUrl || null,
      timeSpent,
      timestamp: new Date()
    };
    
    // Perform media analysis if video/audio available
    let videoAnalysis = null;
    let audioAnalysis = null;
    let transcript = null;

    try {
      // Analyze video if provided
      if (hasVideoAnswer) {
        console.log('Analyzing video recording...');
        videoAnalysis = await mediaAnalysisService.analyzeVideo(videoUrl, timeSpent);
      }

      // Analyze audio if provided (or extract from video)
      if (hasAudioAnswer || hasVideoAnswer) {
        console.log('Analyzing audio...');
        const audioSource = hasAudioAnswer ? audioUrl : videoUrl;
        
        // Try to get transcript first
        try {
          transcript = await geminiService.transcribeAudioFromUrl(audioSource);
          if (transcript && transcript.trim().length > 0) {
            console.log('Transcript obtained:', transcript.substring(0, 100) + '...');
            // Use transcript as answer if no text was provided
            if (!hasTextAnswer) {
              answerData.answer = transcript.trim();
            }
          }
        } catch (transcriptError) {
          console.log('Transcription failed:', transcriptError.message);
        }

        // Perform audio analysis
        audioAnalysis = await mediaAnalysisService.analyzeAudio(
          audioSource,
          transcript || answerData.answer,
          timeSpent
        );
      }
    } catch (mediaError) {
      console.error('Media analysis error:', mediaError);
      // Continue without media analysis
    }
    
    // Analyze answer using AI with media insights
    if (hasTextAnswer || transcript) {
      try {
        let analysis;
        
        // Use multimodal analysis if media data is available
        if (videoAnalysis || audioAnalysis) {
          analysis = await geminiService.analyzeAnswerWithMedia(
            question.question,
            answerData.answer,
            videoAnalysis,
            audioAnalysis,
            question.expectedKeywords || []
          );
        } else {
          // Fallback to standard text analysis
          analysis = await geminiService.analyzeAnswer(
            question.question, 
            answerData.answer, 
            question.expectedKeywords || []
          );
        }
        
        answerData.evaluation = analysis;
        
        // Add media analysis data to evaluation
        if (videoAnalysis) {
          answerData.evaluation.videoAnalysis = videoAnalysis;
        }
        if (audioAnalysis) {
          answerData.evaluation.audioAnalysis = audioAnalysis;
        }
        if (transcript) {
          answerData.evaluation.transcript = transcript;
        }
        
        // Evaluate correctness and get correct answer
        try {
          const correctnessEval = await geminiService.evaluateAnswerCorrectness(
            question.question,
            answerData.answer,
            question.category,
            question.difficulty,
            interview.subject
          );
          
          // Store correct answer in question if not already present
          if (!question.correctAnswer && correctnessEval.correctAnswer) {
            question.correctAnswer = correctnessEval.correctAnswer;
            question.keyPoints = correctnessEval.keyPoints;
          }
          
          // Add correctness evaluation to answer
          answerData.evaluation.correctness = {
            isCorrect: correctnessEval.isCorrect,
            correctnessScore: correctnessEval.correctnessScore,
            keyPointsCovered: correctnessEval.keyPointsCovered,
            keyPointsMissed: correctnessEval.keyPointsMissed,
            mistakesMade: correctnessEval.mistakesMade
          };
          
          // Add improvement areas
          answerData.evaluation.improvementAreas = correctnessEval.improvementAreas;
          
          console.log('Correctness evaluation completed:', {
            isCorrect: correctnessEval.isCorrect,
            score: correctnessEval.correctnessScore,
            keyPointsCovered: correctnessEval.keyPointsCovered.length,
            keyPointsMissed: correctnessEval.keyPointsMissed.length
          });
        } catch (correctnessError) {
          console.error('Correctness evaluation failed:', correctnessError);
          // Provide basic fallback correctness evaluation
          const answerLength = answerData.answer.length;
          const hasKeywords = question.expectedKeywords && question.expectedKeywords.length > 0;
          const keywordMatches = hasKeywords 
            ? question.expectedKeywords.filter(kw => 
                answerData.answer.toLowerCase().includes(kw.toLowerCase())
              ).length
            : 0;
          const keywordScore = hasKeywords 
            ? Math.round((keywordMatches / question.expectedKeywords.length) * 100)
            : 50;
          
          const estimatedScore = answerLength > 100 ? Math.min(keywordScore + 20, 75) : Math.min(keywordScore, 60);
          
          // Subject-specific key points
          let subjectSpecificPoints = [];
          if (interview.subject === 'dsa') {
            subjectSpecificPoints = [
              'Algorithmic approach and logic',
              'Time and space complexity analysis',
              'Edge case handling',
              'Code implementation details'
            ];
          } else if (interview.subject === 'java') {
            subjectSpecificPoints = [
              'Java-specific syntax and features',
              'Object-oriented programming concepts',
              'Exception handling',
              'Collections framework usage'
            ];
          } else if (interview.subject === 'python') {
            subjectSpecificPoints = [
              'Python-specific syntax and features',
              'Data structures and libraries',
              'Error handling',
              'Pythonic coding practices'
            ];
          } else if (interview.subject === 'javascript') {
            subjectSpecificPoints = [
              'JavaScript-specific syntax and features',
              'Asynchronous programming concepts',
              'DOM manipulation',
              'Modern ES6+ features'
            ];
          } else if (interview.subject === 'system-design') {
            subjectSpecificPoints = [
              'Scalability considerations',
              'System architecture',
              'Database design',
              'API design'
            ];
          } else {
            subjectSpecificPoints = [
              'Clear explanation of the concept',
              'Practical examples or use cases',
              'Comparison or contrast with related concepts',
              'Relevance to the question'
            ];
          }
          
          answerData.evaluation.correctness = {
            isCorrect: estimatedScore >= 60,
            correctnessScore: estimatedScore,
            keyPoints: subjectSpecificPoints,
            keyPointsCovered: hasKeywords && keywordMatches > 0 
              ? question.expectedKeywords.slice(0, keywordMatches).map(kw => `Mentioned ${kw}`)
              : ['Provided a response'],
            keyPointsMissed: hasKeywords && keywordMatches < question.expectedKeywords.length
              ? question.expectedKeywords.slice(keywordMatches).map(kw => `Did not mention ${kw}`)
              : [],
            mistakesMade: answerLength < 20 ? ['Answer is too brief'] : []
          };
          
          answerData.evaluation.improvementAreas = [
            {
              area: 'Content Depth',
              priority: answerLength < 50 ? 'high' : 'medium',
              suggestion: 'Provide more detailed explanations with examples',
              impact: 'Demonstrates thorough understanding and preparation'
            },
            hasKeywords && keywordMatches < question.expectedKeywords.length ? {
              area: 'Key Concepts',
              priority: 'high',
              suggestion: `Include these important concepts: ${question.expectedKeywords.slice(keywordMatches).join(', ')}`,
              impact: 'Ensures comprehensive coverage of the topic'
            } : null
          ].filter(Boolean);
        }
        
        // Calculate multimodal score
        if (videoAnalysis || audioAnalysis) {
          const contentScore = analysis.score || 0;
          const videoScore = videoAnalysis ? videoAnalysis.overall : 0;
          const audioScore = audioAnalysis ? audioAnalysis.overall : 0;
          
          let multimodalScore = contentScore;
          if (videoAnalysis && audioAnalysis) {
            multimodalScore = Math.round((contentScore * 0.5) + (videoScore * 0.25) + (audioScore * 0.25));
          } else if (videoAnalysis) {
            multimodalScore = Math.round((contentScore * 0.6) + (videoScore * 0.4));
          } else if (audioAnalysis) {
            multimodalScore = Math.round((contentScore * 0.6) + (audioScore * 0.4));
          }
          
          answerData.evaluation.multimodalScore = multimodalScore;
          answerData.evaluation.score = multimodalScore; // Update overall score
        }
        
      } catch (analysisError) {
        console.error('Answer analysis failed:', analysisError);
        // Provide intelligent fallback evaluation with helpful feedback
        const answerLength = answerData.answer.length;
        const wordCount = answerData.answer.split(/\s+/).length;
        const hasContent = answerLength > 20;
        
        // Calculate a fair score based on answer characteristics
        let fallbackScore = 50; // Start with neutral score
        if (answerLength > 200) fallbackScore += 15;
        else if (answerLength > 100) fallbackScore += 10;
        else if (answerLength < 50) fallbackScore -= 15;
        
        if (wordCount > 50) fallbackScore += 5;
        else if (wordCount < 20) fallbackScore -= 10;
        
        // Basic keyword matching for fallback correctness
        const hasKeywords = question.expectedKeywords && question.expectedKeywords.length > 0;
        const keywordMatches = hasKeywords 
          ? question.expectedKeywords.filter(kw => 
              answerData.answer.toLowerCase().includes(kw.toLowerCase())
            )
          : [];
        const keywordScore = hasKeywords 
          ? Math.round((keywordMatches.length / question.expectedKeywords.length) * 100)
          : fallbackScore;
        
        // Detect answer quality indicators
        const hasStructure = /(\d+\.|\n-|\n\*|First|Second|Additionally|Furthermore)/i.test(answerData.answer);
        const hasExamples = /example|instance|such as|for example|like/i.test(answerData.answer);
        const hasTechnical = /\b(function|class|method|algorithm|data|process|system|design)\b/i.test(answerData.answer);
        
        if (hasStructure) fallbackScore += 5;
        if (hasExamples) fallbackScore += 5;
        if (hasTechnical && question.category === 'technical') fallbackScore += 5;
        
        // Cap the score
        fallbackScore = Math.min(Math.max(fallbackScore, 30), 75);
        
        // Generate helpful strengths based on detected qualities
        const strengths = [];
        if (hasContent) strengths.push('Provided a substantive answer');
        if (answerLength > 100) strengths.push('Detailed response with good length');
        if (hasStructure) strengths.push('Well-structured answer with clear organization');
        if (hasExamples) strengths.push('Included examples to illustrate points');
        if (keywordMatches.length > 0) strengths.push(`Covered ${keywordMatches.length} key concept(s)`);
        if (hasTechnical) strengths.push('Used appropriate technical terminology');
        if (strengths.length === 0) strengths.push('Attempted to address the question');
        
        // Generate actionable weaknesses
        const weaknesses = [];
        if (answerLength < 50) weaknesses.push('Answer could be more detailed and comprehensive');
        if (answerLength < 100 && !hasStructure) weaknesses.push('Consider organizing your answer with clear points');
        if (!hasExamples) weaknesses.push('Add concrete examples to strengthen your answer');
        if (keywordMatches.length < question.expectedKeywords.length / 2) weaknesses.push('Missing some key concepts that should be addressed');
        if (wordCount < 30) weaknesses.push('Expand your explanation with more depth');
        if (weaknesses.length === 0) weaknesses.push('Consider adding more specific details and examples');
        
        // Subject-specific key points
        let subjectSpecificPoints = [];
        if (interview.subject === 'dsa') {
          subjectSpecificPoints = [
            'Algorithmic approach and logic',
            'Time and space complexity analysis',
            'Edge case handling',
            'Code implementation details'
          ];
        } else if (interview.subject === 'java') {
          subjectSpecificPoints = [
            'Java-specific syntax and features',
            'Object-oriented programming concepts',
            'Exception handling',
            'Collections framework usage'
          ];
        } else if (interview.subject === 'python') {
          subjectSpecificPoints = [
            'Python-specific syntax and features',
            'Data structures and libraries',
            'Error handling',
            'Pythonic coding practices'
          ];
        } else if (interview.subject === 'javascript') {
          subjectSpecificPoints = [
            'JavaScript-specific syntax and features',
            'Asynchronous programming concepts',
            'DOM manipulation',
            'Modern ES6+ features'
          ];
        } else if (interview.subject === 'system-design') {
          subjectSpecificPoints = [
            'Scalability considerations',
            'System architecture',
            'Database design',
            'API design'
          ];
        } else {
          subjectSpecificPoints = [
            'Clear explanation of the concept',
            'Practical examples or use cases',
            'Comparison or contrast with related concepts',
            'Relevance to the question'
          ];
        }
        
        // Generate actionable suggestions
        const suggestions = [];
        if (answerLength < 100) suggestions.push('Expand your answer to 100-200 words for better coverage');
        if (!hasStructure) suggestions.push('Use numbered points or clear paragraphs to organize your thoughts');
        if (!hasExamples) suggestions.push('Include specific examples or use cases to demonstrate understanding');
        if (keywordMatches.length < question.expectedKeywords.length) {
          const missing = question.expectedKeywords.filter(kw => !keywordMatches.includes(kw));
          suggestions.push(`Make sure to discuss: ${missing.slice(0, 3).join(', ')}`);
        }
        if (question.category === 'technical' && !hasTechnical) suggestions.push('Include technical terminology and concepts relevant to the question');
        if (suggestions.length === 0) suggestions.push('Review the question carefully and ensure all aspects are covered');
        
        answerData.evaluation = {
          score: fallbackScore,
          feedback: {
            strengths: strengths,
            weaknesses: weaknesses,
            suggestions: suggestions
          },
          keywords: { 
            found: keywordMatches.map(kw => kw), 
            missing: hasKeywords ? question.expectedKeywords.filter(kw => !keywordMatches.includes(kw)) : []
          },
          confidence: fallbackScore,
          relevance: fallbackScore,
          clarity: hasStructure ? Math.min(fallbackScore + 10, 80) : fallbackScore,
          correctness: {
            isCorrect: keywordScore >= 50,
            correctnessScore: keywordScore,
            keyPoints: subjectSpecificPoints,
            keyPointsCovered: keywordMatches.length > 0 
              ? keywordMatches.map(kw => `Mentioned: ${kw}`)
              : ['Provided a response'],
            keyPointsMissed: hasKeywords && keywordMatches.length < question.expectedKeywords.length
              ? question.expectedKeywords.filter(kw => !keywordMatches.includes(kw)).map(kw => `Should discuss: ${kw}`)
              : [],
            mistakesMade: answerLength < 20 ? ['Answer is too brief for thorough evaluation'] : []
          },
          improvementAreas: [
            {
              area: 'Content Depth',
              priority: answerLength < 50 ? 'high' : answerLength < 100 ? 'medium' : 'low',
              suggestion: answerLength < 50 ? 'Significantly expand your answer with more details and examples' : 'Add more depth to demonstrate comprehensive understanding',
              impact: 'Shows thorough knowledge and preparation'
            },
            hasKeywords && keywordMatches.length < question.expectedKeywords.length ? {
              area: 'Key Concepts Coverage',
              priority: 'high',
              suggestion: `Ensure you address these concepts: ${question.expectedKeywords.filter(kw => !keywordMatches.includes(kw)).slice(0, 3).join(', ')}`,
              impact: 'Demonstrates complete understanding of the topic'
            } : null,
            !hasStructure ? {
              area: 'Answer Structure',
              priority: 'medium',
              suggestion: 'Organize your answer with numbered points or clear paragraphs',
              impact: 'Makes your answer clearer and more professional'
            } : null,
            !hasExamples ? {
              area: 'Examples and Evidence',
              priority: 'medium',
              suggestion: 'Include specific examples or real-world applications',
              impact: 'Strengthens your argument and shows practical understanding'
            } : null
          ].filter(Boolean)
        };
        
        // Still include media analysis if available
        if (videoAnalysis) answerData.evaluation.videoAnalysis = videoAnalysis;
        if (audioAnalysis) answerData.evaluation.audioAnalysis = audioAnalysis;
        if (transcript) answerData.evaluation.transcript = transcript;
      }
    } else {
      // Media-only response without transcript
      try {
        const mediaForTranscription = hasAudioAnswer ? audioUrl : videoUrl;
        const attemptedTranscript = await geminiService.transcribeAudioFromUrl(mediaForTranscription);
        
        if (attemptedTranscript && attemptedTranscript.trim().length > 0) {
          const analysis = await geminiService.analyzeAnswerWithMedia(
            question.question,
            attemptedTranscript.trim(),
            videoAnalysis,
            audioAnalysis,
            question.expectedKeywords || []
          );
          answerData.answer = attemptedTranscript.trim();
          answerData.evaluation = analysis;
          
          if (videoAnalysis) answerData.evaluation.videoAnalysis = videoAnalysis;
          if (audioAnalysis) answerData.evaluation.audioAnalysis = audioAnalysis;
          answerData.evaluation.transcript = attemptedTranscript.trim();
        } else {
          // Fallback: Use media analysis scores
          const videoScore = videoAnalysis ? videoAnalysis.overall : 0;
          const audioScore = audioAnalysis ? audioAnalysis.overall : 0;
          const baseScore = Math.round((videoScore + audioScore) / 2) || 55;
          
          answerData.evaluation = {
            score: baseScore,
            feedback: {
              strengths: [
                hasVideoAnswer ? 'Provided video response' : 'Provided audio response',
                ...(videoAnalysis?.eyeContact?.score > 70 ? ['Good eye contact'] : []),
                ...(audioAnalysis?.tone?.confidence > 70 ? ['Confident tone'] : [])
              ],
              weaknesses: [
                'Transcript unavailable for detailed content analysis',
                ...(videoAnalysis?.facialExpressions?.stress > 70 ? ['Visible stress indicators'] : []),
                ...(audioAnalysis?.fillerWords?.count > 8 ? ['Excessive filler words detected'] : [])
              ],
              suggestions: [
                'Consider providing a brief text summary to enable comprehensive analysis',
                ...(videoAnalysis?.eyeContact?.score < 60 ? ['Improve eye contact with camera'] : []),
                ...(audioAnalysis?.pace?.rating === 'too-fast' ? ['Slow down speech pace'] : []),
                ...(audioAnalysis?.pace?.rating === 'too-slow' ? ['Increase speech pace slightly'] : [])
              ]
            },
            keywords: { found: [], missing: question.expectedKeywords || [] },
            confidence: audioAnalysis?.tone?.confidence || 50,
            relevance: 55,
            clarity: audioAnalysis?.speechClarity || 50,
            videoAnalysis,
            audioAnalysis,
            multimodalScore: baseScore
          };
        }
      } catch (mediaAnalysisError) {
        console.error('Media analysis failed:', mediaAnalysisError);
        answerData.evaluation = {
          score: 50,
          feedback: {
            strengths: [hasVideoAnswer ? 'Video recording provided' : 'Audio recording provided'],
            weaknesses: ['Automated analysis failed'],
            suggestions: ['Provide a brief text summary to enable analysis']
          },
          keywords: { found: [], missing: [] },
          confidence: 50,
          relevance: 50,
          clarity: 50,
          videoAnalysis,
          audioAnalysis
        };
      }
    }
    
    interview.answers.push(answerData);
    interview.session.currentQuestion += 1;
    
    // Check if interview is complete
    if (interview.session.currentQuestion >= interview.questions.length) {
      interview.status = 'completed';
      interview.session.endTime = new Date();
      
      console.log('Interview completed, calculating performance...');
      console.log('Total answers before calculation:', interview.answers.length);
      
      // Calculate final performance
      interview.calculatePerformance();
      
      console.log('Performance after calculation:', {
        overallScore: interview.performance.overallScore,
        answeredQuestions: interview.performance.metrics.answeredQuestions,
        totalQuestions: interview.performance.metrics.totalQuestions,
        totalTime: interview.performance.metrics.totalTime
      });
      
      // Generate company recommendations
      try {
        const geminiService = require('../services/geminiService');
        const Resume = require('../models/Resume');
        
        // Get resume if available
        let resume = null;
        if (interview.resumeId) {
          resume = await Resume.findById(interview.resumeId);
        }
        
        // Generate company recommendations
        const companyRecommendations = await geminiService.generateCompanyRecommendations(
          req.user,
          interview,
          resume
        );
        
        // Add recommendations to interview performance
        if (!interview.performance.recommendations) {
          interview.performance.recommendations = [];
        }
        
        // Add company recommendations as a separate section
        interview.performance.companyRecommendations = companyRecommendations;
        
        console.log('Company recommendations generated:', companyRecommendations.length);
      } catch (recommendationError) {
        console.error('Error generating company recommendations:', recommendationError);
      }
    }

    console.log('Saving interview with answers count:', interview.answers.length);
    await interview.save();
    console.log('Interview saved successfully');

    res.json({
      message: 'Answer submitted successfully',
      evaluation: answerData.evaluation || {},
      interview: interview.toJSON()
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      error: 'Failed to submit answer',
      message: error.message || 'An error occurred while submitting the answer',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/interview/:id/end
// @desc    End an interview session
// @access  Private
router.post('/:id/end', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    if (interview.status !== 'in-progress' && interview.status !== 'paused') {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Interview can only be ended when in-progress or paused'
      });
    }

    interview.status = 'completed';
    interview.session.endTime = new Date();
    
    console.log('Ending interview, calculating performance...');
    console.log('Total answers:', interview.answers.length);
    console.log('Total questions:', interview.questions.length);
    
    // Calculate final performance
    interview.calculatePerformance();
    
    console.log('Performance calculated:', {
      overallScore: interview.performance.overallScore,
      answeredQuestions: interview.performance.metrics.answeredQuestions,
      totalQuestions: interview.performance.metrics.totalQuestions,
      totalTime: interview.performance.metrics.totalTime
    });
    
    // Generate company recommendations
    try {
      const geminiService = require('../services/geminiService');
      const Resume = require('../models/Resume');
      
      // Get resume if available
      let resume = null;
      if (interview.resumeId) {
        resume = await Resume.findById(interview.resumeId);
      }
      
      // Generate company recommendations
      const companyRecommendations = await geminiService.generateCompanyRecommendations(
        req.user,
        interview,
        resume
      );
      
      // Add recommendations to interview performance
      if (!interview.performance.recommendations) {
        interview.performance.recommendations = [];
      }
      
      // Add company recommendations as a separate section
      interview.performance.companyRecommendations = companyRecommendations;
      
      console.log('Company recommendations generated:', companyRecommendations.length);
    } catch (recommendationError) {
      console.error('Error generating company recommendations:', recommendationError);
    }

    await interview.save();
    console.log('Interview ended and saved successfully');

    res.json({
      message: 'Interview ended successfully',
      interview: interview.toJSON(),
      performance: interview.performance
    });

  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({
      error: 'Failed to end interview',
      message: 'An error occurred while ending the interview'
    });
  }
});

// @route   DELETE /api/interview/:id
// @desc    Delete interview
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    res.json({
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({
      error: 'Failed to delete interview',
      message: 'An error occurred while deleting the interview'
    });
  }
});

module.exports = router;