const { z } = require('zod');
const { extractResumeText } = require('../services/textExtractor');
const { parseResumeText } = require('../services/resumeParser');
const { analyseResumeContent } = require('../services/analysisEngine');
const {
  saveAtsCheckInDb,
  getAtsChecksByUserInDb,
  getAtsCheckByIdInDb,
  createResumeInDb
} = require('../config/db');

const getUserId = (req) => req.headers['x-user-id'] || req.query.user_id || req.body.user_id || 1;

const jdSchema = z.string().max(20000).optional();

const uploadAtsResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF, DOCX or TXT file (max 5 MB).' });
    }

    const jdParsed = jdSchema.safeParse(req.body?.jd_text || req.body?.jdText || '');
    if (!jdParsed.success) {
      return res.status(400).json({ success: false, message: 'Job description is too long (max 20,000 characters).' });
    }
    const jdText = (jdParsed.data || '').trim();

    const extraction = await extractResumeText(req.file);
    req.file.buffer = null;

    const parsed = parseResumeText(extraction.text);
    const analysis = analyseResumeContent(parsed, {
      extraction: {
        machine_readable: extraction.machine_readable,
        char_count: extraction.char_count,
        warning: extraction.warning
      },
      jdText
    });

    const saved = await saveAtsCheckInDb(userId, {
      file_name: req.file.originalname,
      score: analysis.score,
      breakdown: {
        section_scores: analysis.section_scores,
        breakdown: analysis.breakdown,
        rules: analysis.rules,
        band: analysis.band,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths,
        summary_text: analysis.summary_text,
        extraction,
        keyword_match: analysis.keyword_match
      },
      parsed_resume: parsed,
      jd_text: jdText,
      match_percent: analysis.keyword_match?.match_percent
    });

    return res.status(200).json({
      success: true,
      message: extraction.machine_readable
        ? 'ATS check complete. Uploaded file was processed and not stored.'
        : extraction.warning,
      check: {
        id: saved.id,
        file_name: saved.file_name,
        score: analysis.score,
        overall_score: analysis.score,
        band: analysis.band,
        breakdown: analysis.breakdown,
        section_scores: analysis.section_scores,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths,
        rules: analysis.rules,
        summary_text: analysis.summary_text,
        keyword_match: analysis.keyword_match,
        extraction: {
          machine_readable: extraction.machine_readable,
          char_count: extraction.char_count,
          warning: extraction.warning
        },
        parsed_resume: parsed,
        created_at: saved.created_at
      }
    });
  } catch (error) {
    console.error('ATS upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process the uploaded resume.'
    });
  }
};

const getAtsHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const history = await getAtsChecksByUserInDb(userId);
    return res.status(200).json({ success: true, count: history.length, history });
  } catch (error) {
    console.error('ATS history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load ATS history.' });
  }
};

const importAtsCheck = async (req, res) => {
  try {
    const userId = getUserId(req);
    const check = await getAtsCheckByIdInDb(req.params.id, userId);
    if (!check || !check.parsed_resume) {
      return res.status(404).json({ success: false, message: 'ATS check not found or has no parsed data.' });
    }

    const parsed = check.parsed_resume;
    const info = parsed.personal_info || {};
    const resume = await createResumeInDb({
      user_id: userId,
      title: `${info.full_name || 'Imported'} Resume (from ATS)`,
      personal_info: {
        full_name: info.full_name || 'Imported Candidate',
        email: info.email || 'imported@student.local',
        phone: info.phone || '',
        linkedin: info.linkedin || '',
        github: info.github || ''
      },
      summary: parsed.summary || '',
      education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : [{ degree: '', college: '', year: '', cgpa: '' }],
      skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : ['Add skills'],
      projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : [{ title: '', description: '', tech: '', link: '' }],
      experience: parsed.experience || [],
      certifications: parsed.certifications || [],
      achievements: parsed.achievements || []
    });

    return res.status(201).json({
      success: true,
      message: 'Parsed resume imported into Studio.',
      resume
    });
  } catch (error) {
    console.error('ATS import error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to import into Studio.' });
  }
};

module.exports = {
  uploadAtsResume,
  getAtsHistory,
  importAtsCheck
};
