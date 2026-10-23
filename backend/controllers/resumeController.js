const {
  createResumeInDb,
  getResumesByUserIdInDb,
  getResumeByIdInDb,
  updateResumeInDb,
  deleteResumeInDb
} = require('../config/db');
const { generateResumePdf } = require('../services/pdfGenerator');

// Helper to extract user_id from query, body or headers
const getUserId = (req) => {
  return req.headers['x-user-id'] || req.query.user_id || req.body.user_id || 1;
};

// POST /api/resumes - Create new resume
const createResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      title, personal_info, summary,
      education, skills, projects, experience, certifications, achievements
    } = req.body;

    // Basic Validation
    if (!personal_info || !personal_info.full_name || !personal_info.email) {
      return res.status(400).json({
        success: false,
        message: 'Personal info (Full Name and Email) is required.'
      });
    }

    if (!education || education.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one education entry is required.'
      });
    }

    if (!skills || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill is required.'
      });
    }

    if (!projects || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one project is required.'
      });
    }

    const newResume = await createResumeInDb({
      user_id: userId,
      title: title || `${personal_info.full_name}'s Resume`,
      personal_info,
      summary,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements
    });

    return res.status(201).json({
      success: true,
      message: 'Resume saved successfully!',
      resume: newResume
    });
  } catch (error) {
    console.error('Error creating resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating resume.'
    });
  }
};

// GET /api/resumes - Get all resumes for logged-in user
const getUserResumes = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumes = await getResumesByUserIdInDb(userId);
    return res.status(200).json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    console.error('Error fetching user resumes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching resumes.'
    });
  }
};

// GET /api/resumes/:id - Get single resume by ID
const getSingleResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumeId = req.params.id;

    const resume = await getResumeByIdInDb(resumeId, userId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Error fetching single resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching single resume.'
    });
  }
};

// PUT /api/resumes/:id - Update resume
const updateResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumeId = req.params.id;
    const {
      title, personal_info, summary,
      education, skills, projects, experience, certifications, achievements
    } = req.body;

    // Basic Validation
    if (!personal_info || !personal_info.full_name || !personal_info.email) {
      return res.status(400).json({
        success: false,
        message: 'Personal info (Full Name and Email) is required.'
      });
    }

    const updated = await updateResumeInDb(resumeId, userId, {
      title: title || `${personal_info.full_name}'s Resume`,
      personal_info,
      summary,
      education,
      skills,
      projects,
      experience,
      certifications,
      achievements
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume updated successfully!'
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating resume.'
    });
  }
};

// DELETE /api/resumes/:id - Delete resume
const deleteResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumeId = req.params.id;

    const deleted = await deleteResumeInDb(resumeId, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting resume.'
    });
  }
};

// GET /api/resumes/:id/pdf - Generate and Stream Resume PDF
const downloadResumePdf = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumeId = req.params.id;

    const resume = await getResumeByIdInDb(resumeId, userId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or access denied.'
      });
    }

    generateResumePdf(resume, res);
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error while generating PDF.'
      });
    }
  }
};

module.exports = {
  createResume,
  getUserResumes,
  getSingleResume,
  updateResume,
  deleteResume,
  downloadResumePdf
};
