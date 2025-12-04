const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Create database file in the backend directory
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  console.log('📊 Initializing SQLite database...');
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      isVerified INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      verificationToken TEXT,
      verificationExpires TEXT,
      resetPasswordToken TEXT,
      resetPasswordExpires TEXT,
      lastActive TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      profile TEXT DEFAULT '{}',
      stats TEXT DEFAULT '{"totalInterviews": 0, "totalResumes": 0}'
    )
  `);

  // Create interviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      industry TEXT,
      jobRole TEXT,
      status TEXT DEFAULT 'scheduled',
      settings TEXT DEFAULT '{}',
      questions TEXT DEFAULT '[]',
      answers TEXT DEFAULT '[]',
      performance TEXT DEFAULT '{}',
      session TEXT DEFAULT '{}',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  // Create resumes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      file TEXT DEFAULT '{}',
      content TEXT DEFAULT '{}',
      analysis TEXT DEFAULT '{}',
      suggestions TEXT DEFAULT '{}',
      metadata TEXT DEFAULT '{}',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);

  console.log('✅ Database initialized successfully');
}

// User operations
const userOperations = {
  createUser: db.prepare(`
    INSERT INTO users (email, password, firstName, lastName, verificationToken, verificationExpires)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  
  updateUser: db.prepare(`
    UPDATE users 
    SET firstName = ?, lastName = ?, email = ?, isVerified = ?, profile = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  updateLastActive: db.prepare(`
    UPDATE users 
    SET lastActive = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  updatePassword: db.prepare(`
    UPDATE users 
    SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL
    WHERE id = ?
  `),
  
  verifyEmail: db.prepare(`
    UPDATE users 
    SET isVerified = 1, verificationToken = NULL, verificationExpires = NULL
    WHERE verificationToken = ? AND verificationExpires > datetime('now')
  `),
  
  setResetToken: db.prepare(`
    UPDATE users 
    SET resetPasswordToken = ?, resetPasswordExpires = ?
    WHERE email = ?
  `),
  
  resetPassword: db.prepare(`
    UPDATE users 
    SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL
    WHERE resetPasswordToken = ? AND resetPasswordExpires > datetime('now')
  `)
};

// Interview operations
const interviewOperations = {
  createInterview: db.prepare(`
    INSERT INTO interviews (userId, title, type, difficulty, industry, jobRole, settings, questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  findInterviewsByUser: db.prepare(`
    SELECT * FROM interviews 
    WHERE userId = ? 
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `),
  
  findInterviewById: db.prepare(`
    SELECT * FROM interviews 
    WHERE id = ? AND userId = ?
  `),
  
  updateInterview: db.prepare(`
    UPDATE interviews 
    SET status = ?, session = ?, answers = ?, performance = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  deleteInterview: db.prepare('DELETE FROM interviews WHERE id = ? AND userId = ?'),
  
  countInterviews: db.prepare('SELECT COUNT(*) as count FROM interviews WHERE userId = ?')
};

// Resume operations
const resumeOperations = {
  createResume: db.prepare(`
    INSERT INTO resumes (userId, title, file, content, analysis)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  findResumesByUser: db.prepare(`
    SELECT * FROM resumes 
    WHERE userId = ? 
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `),
  
  findResumeById: db.prepare(`
    SELECT * FROM resumes 
    WHERE id = ? AND userId = ?
  `),
  
  updateResume: db.prepare(`
    UPDATE resumes 
    SET analysis = ?, suggestions = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  deleteResume: db.prepare('DELETE FROM resumes WHERE id = ? AND userId = ?'),
  
  countResumes: db.prepare('SELECT COUNT(*) as count FROM resumes WHERE userId = ?')
};

// Initialize database
initializeDatabase();

module.exports = {
  db,
  userOperations,
  interviewOperations,
  resumeOperations,
  initializeDatabase
};
