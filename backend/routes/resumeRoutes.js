const express = require('express');
const router = express.Router();
const {
  createResume,
  getUserResumes,
  getSingleResume,
  updateResume,
  deleteResume,
  downloadResumePdf
} = require('../controllers/resumeController');

// POST /api/resumes - Create resume
router.post('/', createResume);

// GET /api/resumes - Get all user resumes
router.get('/', getUserResumes);

// GET /api/resumes/:id/pdf - Download Resume PDF
router.get('/:id/pdf', downloadResumePdf);

// GET /api/resumes/:id - Get single resume
router.get('/:id', getSingleResume);

// PUT /api/resumes/:id - Update resume
router.put('/:id', updateResume);

// DELETE /api/resumes/:id - Delete resume
router.delete('/:id', deleteResume);

module.exports = router;
