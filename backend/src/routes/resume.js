const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Resume = require('../models/Resume');
const { authenticateToken } = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const { parseResumeContent } = require('../utils/pdfParser');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// @route   POST /api/resume
// @desc    Upload and analyze a resume
// @access  Private
router.post('/', authenticateToken, upload.single('resume'), [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('targetJob').optional().isObject().withMessage('Target job must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a resume file'
      });
    }

    const { title, targetJob } = req.body;

    // Parse resume content
    let resumeContent;
    try {
      resumeContent = await parseResumeContent(req.file.path, req.file.mimetype);
    } catch (parseError) {
      console.error('Resume parsing error:', parseError);
      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
      
      return res.status(400).json({
        error: 'Failed to parse resume',
        message: 'Unable to extract content from the uploaded file. Please ensure the file is not corrupted.'
      });
    }
    
    if (!resumeContent || !resumeContent.text) {
      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
      
      return res.status(400).json({
        error: 'Failed to parse resume',
        message: 'Unable to extract content from the uploaded file'
      });
    }

    // Ensure structuredData has the correct format
    const structuredData = resumeContent.structured || {};
    
    // Ensure skills is in the correct format
    if (structuredData.skills && Array.isArray(structuredData.skills)) {
      // If skills is an array of strings, convert it to the expected format
      if (structuredData.skills.length > 0 && typeof structuredData.skills[0] === 'string') {
        structuredData.skills = [{
          category: 'Technical Skills',
          skills: structuredData.skills
        }];
      }
    } else {
      structuredData.skills = [];
    }

    const resume = new Resume({
      user: req.user._id,
      title: title || req.file.originalname,
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      content: {
        rawText: resumeContent.text,
        structuredData: structuredData
      },
      metadata: {
        targetJob: targetJob ? JSON.parse(targetJob) : null
      }
    });

    await resume.save();

    // Update user stats
    req.user.stats.totalResumes += 1;
    await req.user.save();

    // Try to analyze the resume locally/LLM; continue even if it fails
    try {
      const analysis = await geminiService.analyzeResume(resumeContent.text, targetJob ? JSON.parse(targetJob) : null);
      resume.analysis = analysis;
      resume.metadata.lastAnalyzed = new Date();
      resume.status = 'analyzed';
      if (!analysis.overallScore && resume.calculateOverallScore) {
        resume.calculateOverallScore();
      }
      await resume.save();
    } catch (analysisError) {
      console.error('Resume analysis failed:', analysisError);
    }

    res.status(201).json({
      message: 'Resume uploaded and analyzed successfully',
      resume: resume.toJSON()
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Resume data validation failed',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({
      error: 'Failed to upload resume',
      message: 'An error occurred while uploading the resume'
    });
  }
});

// @route   GET /api/resume
// @desc    Get all resumes for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user._id };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'content.rawText': { $regex: search, $options: 'i' } }
      ];
    }

    const resumes = await Resume.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resume.countDocuments(filter);

    res.json({
      resumes: resumes.map(resume => resume.toJSON()),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + resumes.length < total,
        hasPrev: parseInt(page) > 1,
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      error: 'Failed to get resumes',
      message: 'An error occurred while fetching resumes'
    });
  }
});

// @route   GET /api/resume/:id
// @desc    Get resume by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume not found',
        message: 'The requested resume does not exist'
      });
    }

    res.json({
      resume: resume.toJSON()
    });

  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      error: 'Failed to get resume',
      message: 'An error occurred while fetching the resume'
    });
  }
});

// @route   GET /api/resume/:id/download
// @desc    Download resume as PDF (converts non-PDF to PDF on the fly)
// @access  Private
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found', message: 'The requested resume does not exist' });
    }

    const filePath = resume.file?.filePath;
    const mimeType = resume.file?.mimeType;
    const originalName = resume.file?.originalName || resume.title || 'resume';
    const inline = req.query.inline === '1' || req.query.inline === 'true';

    // If original file exists and is PDF, stream it directly
    if (mimeType === 'application/pdf' && filePath) {
      try {
        const fs = require('fs');
        const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        
        // Check if file exists
        if (fs.existsSync(absolute)) {
          // Ensure filename has .pdf extension
          const pdfFileName = originalName.endsWith('.pdf') ? originalName : `${originalName}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${pdfFileName}"`);
          return fs.createReadStream(absolute).pipe(res);
        } else {
          console.log('PDF file not found at path:', absolute);
          // Fall through to generate PDF from text
        }
      } catch (e) {
        console.error('Error streaming PDF:', e);
        // Fall through to generate from text
      }
    }

    // For non-PDF or if file doesn't exist, generate PDF from content
    const text = resume.content?.rawText || '';

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No content available', 
        message: 'This resume has no content to download. Please re-upload the resume.' 
      });
    }

    // Generate PDF using pdfkit (already imported at top)
    const downloadName = originalName.endsWith('.pdf') ? originalName : `${originalName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${downloadName}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.info = { Title: resume.title || 'Resume', Author: 'AI Mock Interview Platform' };
    doc.pipe(res);

    // Add title
    doc.fontSize(20).font('Helvetica-Bold').text(resume.title || originalName || 'Resume', { align: 'center' });
    doc.moveDown(1.5);

    // Add content
    doc.fontSize(11).font('Helvetica');
    const lines = text.split('\n');
    lines.forEach((line) => {
      if (line.trim().length === 0) {
        doc.moveDown(0.5);
      } else {
        // Check if line looks like a header (all caps or short)
        if (line.trim().length < 50 && line === line.toUpperCase() && line.trim().length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text(line, { align: 'left' });
          doc.fontSize(11).font('Helvetica');
          doc.moveDown(0.3);
        } else {
          doc.text(line, { align: 'left' });
        }
      }
    });

    doc.end();
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({ 
      error: 'Failed to download resume', 
      message: 'An error occurred while preparing the resume. Please try again or contact support.' 
    });
  }
});

// @route   PUT /api/resume/:id
// @desc    Update resume (analyze, get suggestions)
// @access  Private
router.put('/:id', authenticateToken, [
  body('action').isIn(['analyze', 'suggestions']).withMessage('Action must be either "analyze" or "suggestions"'),
  body('targetJob').optional().isObject().withMessage('Target job must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { action, targetJob } = req.body;
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume not found',
        message: 'The requested resume does not exist'
      });
    }

    switch (action) {
      case 'analyze':
        try {
          const analysis = await geminiService.analyzeResume(resume.content.rawText, targetJob);
          resume.analysis = analysis;
        resume.metadata.lastAnalyzed = new Date();
        resume.status = 'analyzed';
        // Best-effort compute overallScore if missing
        if (!analysis.overallScore && resume.calculateOverallScore) {
          resume.calculateOverallScore();
        }
        } catch (analysisError) {
          console.error('Resume analysis error:', analysisError);
          return res.status(500).json({
            error: 'Analysis failed',
            message: 'Unable to analyze resume. Please try again later.'
          });
        }
        break;

      case 'suggestions':
        if (!resume.analysis) {
          return res.status(400).json({
            error: 'Analysis required',
            message: 'Please analyze the resume first before getting suggestions'
          });
        }
        try {
          const suggestions = await geminiService.generateResumeSuggestions(resume.analysis, targetJob);
          resume.suggestions = suggestions;
        } catch (suggestionsError) {
          console.error('Resume suggestions error:', suggestionsError);
          return res.status(500).json({
            error: 'Suggestions failed',
            message: 'Unable to generate suggestions. Please try again later.'
          });
        }
        break;

      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Invalid action specified'
        });
    }

    await resume.save();

    res.json({
      message: 'Resume updated successfully',
      resume: resume.toJSON()
    });

  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      error: 'Failed to update resume',
      message: 'An error occurred while updating the resume'
    });
  }
});

// @route   DELETE /api/resume/:id
// @desc    Delete resume
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume not found',
        message: 'The requested resume does not exist'
      });
    }

    // Delete the file from storage
    if (resume.file && resume.file.filePath) {
      try {
        await fs.unlink(resume.file.filePath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with deletion even if file cleanup fails
      }
    }

    // Update user stats
    req.user.stats.totalResumes = Math.max(0, req.user.stats.totalResumes - 1);
    await req.user.save();

    res.json({
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      error: 'Failed to delete resume',
      message: 'An error occurred while deleting the resume'
    });
  }
});

module.exports = router; 