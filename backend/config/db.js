const mysql = require('mysql2/promise');
require('dotenv').config();

const dbMode = (process.env.DB_MODE || 'auto').toLowerCase();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_resume_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
if (dbMode !== 'memory') {
  try {
    pool = mysql.createPool(dbConfig);
  } catch {
    pool = null;
  }
}

// In-memory fallbacks when MySQL server is not connected
const inMemoryUsers = [];
const inMemoryResumes = [];
const inMemoryAnalysis = [];
const inMemoryResumeScores = [];
const inMemoryAtsChecks = [];
let isDbConnected = false;

function safeJsonParse(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hydrateResumeRow(r) {
  if (!r) return null;
  return {
    ...r,
    personal_info: safeJsonParse(r.personal_info, {}),
    education: safeJsonParse(r.education, []),
    skills: safeJsonParse(r.skills, []),
    projects: safeJsonParse(r.projects, []),
    experience: safeJsonParse(r.experience, []),
    certifications: safeJsonParse(r.certifications, []),
    achievements: safeJsonParse(r.achievements, [])
  };
}

function hydrateAnalysisRow(a) {
  if (!a) return null;
  const section_scores = safeJsonParse(a.section_scores, {});
  const score = Number(a.overall_score);
  return {
    ...a,
    score: Number.isFinite(score) ? score : 0,
    overall_score: Number.isFinite(score) ? score : 0,
    section_scores,
    breakdown: a.breakdown ? safeJsonParse(a.breakdown, section_scores) : section_scores,
    strengths: safeJsonParse(a.strengths, []),
    suggestions: safeJsonParse(a.suggestions, []),
    rules: safeJsonParse(a.rules, [])
  };
}

async function testConnection() {
  if (dbMode === 'memory') {
    isDbConnected = false;
    console.log('⚡ Database: Standalone In-Memory mode active (no MySQL needed).');
    return;
  }

  try {
    if (!pool) pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await connection.query(`USE \`${dbConfig.database}\`;`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create resumes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        resume_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) DEFAULT 'Student Resume',
        personal_info JSON,
        summary TEXT,
        education JSON,
        skills JSON,
        projects JSON,
        experience JSON,
        certifications JSON,
        achievements JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create analysis table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS analysis (
        analysis_id INT AUTO_INCREMENT PRIMARY KEY,
        resume_id INT NOT NULL,
        user_id INT NOT NULL,
        overall_score INT DEFAULT 0,
        section_scores JSON,
        strengths JSON,
        suggestions JSON,
        summary_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS resume_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resume_id INT NOT NULL,
        score INT NOT NULL DEFAULT 0,
        breakdown JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ats_checks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        file_name VARCHAR(255) DEFAULT NULL,
        score INT NOT NULL DEFAULT 0,
        breakdown JSON,
        parsed_resume JSON,
        jd_text TEXT,
        match_percent DECIMAL(6,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    isDbConnected = true;
    console.log('✅ Connected to MySQL database successfully.');
    connection.release();
  } catch (error) {
    isDbConnected = false;
    if (dbMode === 'mysql') {
      const errDetail = error.message || error.code || 'Connection refused on port ' + (dbConfig.port || 3306);
      console.warn(`⚠️ MySQL Database connection failed: ${errDetail}`);
      console.warn('ℹ️ Running backend with in-memory fallback for authentication & resumes.');
    } else {
      console.log(`⚡ Database: Standalone In-Memory mode active (MySQL server not detected on port ${dbConfig.port}).`);
    }
  }
}

// User Helpers
const findUserByEmail = async (email) => {
  if (isDbConnected) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  } else {
    return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
};

const createUser = async (name, email, passwordHash) => {
  if (isDbConnected) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    return { id: result.insertId, name, email };
  } else {
    const newUser = {
      id: inMemoryUsers.length + 1,
      name,
      email,
      password_hash: passwordHash,
      created_at: new Date()
    };
    inMemoryUsers.push(newUser);
    return { id: newUser.id, name: newUser.name, email: newUser.email };
  }
};

// Resume CRUD Helpers
const createResumeInDb = async (resumeData) => {
  const {
    user_id, title, personal_info, summary,
    education, skills, projects, experience, certifications, achievements
  } = resumeData;

  if (isDbConnected) {
    const [result] = await pool.query(
      `INSERT INTO resumes 
      (user_id, title, personal_info, summary, education, skills, projects, experience, certifications, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title || 'Student Resume',
        JSON.stringify(personal_info || {}),
        summary || '',
        JSON.stringify(education || []),
        JSON.stringify(skills || []),
        JSON.stringify(projects || []),
        JSON.stringify(experience || []),
        JSON.stringify(certifications || []),
        JSON.stringify(achievements || [])
      ]
    );
    return { resume_id: result.insertId, ...resumeData };
  } else {
    const newResume = {
      resume_id: inMemoryResumes.length + 1,
      user_id: Number(user_id),
      title: title || 'Student Resume',
      personal_info: personal_info || {},
      summary: summary || '',
      education: education || [],
      skills: skills || [],
      projects: projects || [],
      experience: experience || [],
      certifications: certifications || [],
      achievements: achievements || [],
      created_at: new Date(),
      updated_at: new Date()
    };
    inMemoryResumes.push(newResume);
    return newResume;
  }
};

const getResumesByUserIdInDb = async (userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows.map(r => hydrateResumeRow(r));
  } else {
    return inMemoryResumes.filter(r => Number(r.user_id) === Number(userId));
  }
};

const getResumeByIdInDb = async (resumeId, userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      'SELECT * FROM resumes WHERE resume_id = ? AND user_id = ?',
      [resumeId, userId]
    );
    if (rows.length === 0) return null;
    return hydrateResumeRow(rows[0]);
  } else {
    return inMemoryResumes.find(r => Number(r.resume_id) === Number(resumeId) && Number(r.user_id) === Number(userId)) || null;
  }
};

const updateResumeInDb = async (resumeId, userId, resumeData) => {
  const {
    title, personal_info, summary,
    education, skills, projects, experience, certifications, achievements
  } = resumeData;

  if (isDbConnected) {
    const [result] = await pool.query(
      `UPDATE resumes SET 
        title = ?,
        personal_info = ?,
        summary = ?,
        education = ?,
        skills = ?,
        projects = ?,
        experience = ?,
        certifications = ?,
        achievements = ?
      WHERE resume_id = ? AND user_id = ?`,
      [
        title || 'Student Resume',
        JSON.stringify(personal_info || {}),
        summary || '',
        JSON.stringify(education || []),
        JSON.stringify(skills || []),
        JSON.stringify(projects || []),
        JSON.stringify(experience || []),
        JSON.stringify(certifications || []),
        JSON.stringify(achievements || []),
        resumeId,
        userId
      ]
    );
    return result.affectedRows > 0;
  } else {
    const index = inMemoryResumes.findIndex(r => Number(r.resume_id) === Number(resumeId) && Number(r.user_id) === Number(userId));
    if (index === -1) return false;

    inMemoryResumes[index] = {
      ...inMemoryResumes[index],
      title: title || inMemoryResumes[index].title,
      personal_info: personal_info || inMemoryResumes[index].personal_info,
      summary: summary || inMemoryResumes[index].summary,
      education: education || inMemoryResumes[index].education,
      skills: skills || inMemoryResumes[index].skills,
      projects: projects || inMemoryResumes[index].projects,
      experience: experience || inMemoryResumes[index].experience,
      certifications: certifications || inMemoryResumes[index].certifications,
      achievements: achievements || inMemoryResumes[index].achievements,
      updated_at: new Date()
    };
    return true;
  }
};

const deleteResumeInDb = async (resumeId, userId) => {
  if (isDbConnected) {
    const [result] = await pool.query(
      'DELETE FROM resumes WHERE resume_id = ? AND user_id = ?',
      [resumeId, userId]
    );
    return result.affectedRows > 0;
  } else {
    const index = inMemoryResumes.findIndex(r => Number(r.resume_id) === Number(resumeId) && Number(r.user_id) === Number(userId));
    if (index === -1) return false;
    inMemoryResumes.splice(index, 1);
    return true;
  }
};

// Analysis Helpers
const saveResumeScoreInDb = async (resumeId, score, breakdown) => {
  const payload = {
    resume_id: Number(resumeId),
    score: Number.isFinite(Number(score)) ? Number(score) : 0,
    breakdown: breakdown || {},
    created_at: new Date()
  };

  if (isDbConnected) {
    const [result] = await pool.query(
      `INSERT INTO resume_scores (resume_id, score, breakdown) VALUES (?, ?, ?)`,
      [payload.resume_id, payload.score, JSON.stringify(payload.breakdown)]
    );
    return { id: result.insertId, ...payload };
  }

  const stored = { id: inMemoryResumeScores.length + 1, ...payload };
  inMemoryResumeScores.push(stored);
  return stored;
};

const saveAnalysisInDb = async (resumeId, userId, analysisData) => {
  const score = Number.isFinite(Number(analysisData.score))
    ? Number(analysisData.score)
    : Number(analysisData.overall_score) || 0;
  const section_scores = analysisData.section_scores || {};
  const breakdown = analysisData.breakdown || section_scores;
  const strengths = analysisData.strengths || [];
  const suggestions = analysisData.suggestions || [];
  const summary_text = analysisData.summary_text || '';

  let saved;
  if (isDbConnected) {
    const [result] = await pool.query(
      `INSERT INTO analysis (resume_id, user_id, overall_score, section_scores, strengths, suggestions, summary_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        resumeId,
        userId,
        score,
        JSON.stringify(section_scores),
        JSON.stringify(strengths),
        JSON.stringify(suggestions),
        summary_text
      ]
    );
    saved = {
      analysis_id: result.insertId,
      resume_id: Number(resumeId),
      user_id: Number(userId),
      score,
      overall_score: score,
      section_scores,
      breakdown,
      strengths,
      suggestions,
      summary_text,
      band: analysisData.band,
      rules: analysisData.rules || [],
      created_at: new Date()
    };
  } else {
    saved = {
      analysis_id: inMemoryAnalysis.length + 1,
      resume_id: Number(resumeId),
      user_id: Number(userId),
      score,
      overall_score: score,
      section_scores,
      breakdown,
      strengths,
      suggestions,
      summary_text,
      band: analysisData.band,
      rules: analysisData.rules || [],
      created_at: new Date()
    };
    inMemoryAnalysis.push(saved);
  }

  await saveResumeScoreInDb(resumeId, score, breakdown);
  return saved;
};

const saveAtsCheckInDb = async (userId, checkData) => {
  const record = {
    user_id: Number(userId),
    file_name: checkData.file_name || 'upload',
    score: Number(checkData.score) || 0,
    breakdown: checkData.breakdown || {},
    parsed_resume: checkData.parsed_resume || {},
    jd_text: checkData.jd_text || '',
    match_percent: checkData.match_percent == null ? null : Number(checkData.match_percent),
    created_at: new Date()
  };

  if (isDbConnected) {
    const [result] = await pool.query(
      `INSERT INTO ats_checks (user_id, file_name, score, breakdown, parsed_resume, jd_text, match_percent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.user_id,
        record.file_name,
        record.score,
        JSON.stringify(record.breakdown),
        JSON.stringify(record.parsed_resume),
        record.jd_text,
        record.match_percent
      ]
    );
    return { id: result.insertId, ...record };
  }

  const stored = { id: inMemoryAtsChecks.length + 1, ...record };
  inMemoryAtsChecks.push(stored);
  return stored;
};

const hydrateAtsCheck = (row) => {
  if (!row) return null;
  return {
    ...row,
    breakdown: safeJsonParse(row.breakdown, {}),
    parsed_resume: safeJsonParse(row.parsed_resume, {}),
    match_percent: row.match_percent == null ? null : Number(row.match_percent)
  };
};

const getAtsChecksByUserInDb = async (userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      `SELECT id, user_id, file_name, score, breakdown, jd_text, match_percent, created_at
       FROM ats_checks WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(hydrateAtsCheck);
  }
  return inMemoryAtsChecks
    .filter((c) => Number(c.user_id) === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((c) => {
      const { parsed_resume, ...rest } = c;
      return rest;
    });
};

const getAtsCheckByIdInDb = async (checkId, userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      `SELECT * FROM ats_checks WHERE id = ? AND user_id = ?`,
      [checkId, userId]
    );
    return hydrateAtsCheck(rows[0] || null);
  }
  return inMemoryAtsChecks.find(
    (c) => Number(c.id) === Number(checkId) && Number(c.user_id) === Number(userId)
  ) || null;
};

const getAnalysisByIdInDb = async (analysisId, userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      `SELECT a.*, r.title as resume_title 
       FROM analysis a 
       JOIN resumes r ON a.resume_id = r.resume_id 
       WHERE a.analysis_id = ? AND a.user_id = ?`,
      [analysisId, userId]
    );
    if (rows.length === 0) return null;
    const a = rows[0];
    return hydrateAnalysisRow(a);
  } else {
    const a = inMemoryAnalysis.find(item => Number(item.analysis_id) === Number(analysisId) && Number(item.user_id) === Number(userId));
    if (!a) return null;
    const resume = inMemoryResumes.find(r => Number(r.resume_id) === Number(a.resume_id));
    return {
      ...a,
      resume_title: resume ? resume.title : 'Student Resume'
    };
  }
};

const getUserAnalysisHistoryInDb = async (userId) => {
  if (isDbConnected) {
    const [rows] = await pool.query(
      `SELECT a.*, r.title as resume_title 
       FROM analysis a 
       JOIN resumes r ON a.resume_id = r.resume_id 
       WHERE a.user_id = ? 
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return rows.map((a) => hydrateAnalysisRow(a));
  } else {
    return inMemoryAnalysis
      .filter(a => Number(a.user_id) === Number(userId))
      .map(a => {
        const resume = inMemoryResumes.find(r => Number(r.resume_id) === Number(a.resume_id));
        return {
          ...a,
          resume_title: resume ? resume.title : 'Student Resume'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
};

module.exports = {
  pool,
  testConnection,
  findUserByEmail,
  createUser,
  createResumeInDb,
  getResumesByUserIdInDb,
  getResumeByIdInDb,
  updateResumeInDb,
  deleteResumeInDb,
  saveAnalysisInDb,
  saveResumeScoreInDb,
  saveAtsCheckInDb,
  getAtsChecksByUserInDb,
  getAtsCheckByIdInDb,
  getAnalysisByIdInDb,
  getUserAnalysisHistoryInDb
};
