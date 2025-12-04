const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const ensureDir = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // ignore if exists or cannot create
  }
};

const mediaDir = path.join(__dirname, '../../uploads/media');
ensureDir(mediaDir);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureDir(mediaDir);
      cb(null, mediaDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = new Set([
  // audio
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  // video
  'video/webm',
  'video/mp4',
  'video/ogg'
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio/video files are allowed.'));
    }
  }
});

// POST /api/upload
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = path.join('uploads', 'media', req.file.filename);
    const publicUrl = `${req.protocol}://${req.get('host')}/${relativePath.replace(/\\/g, '/')}`;

    res.status(201).json({
      message: 'File uploaded',
      file: {
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: publicUrl,
        path: `/${relativePath.replace(/\\/g, '/')}`
      }
    });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;


