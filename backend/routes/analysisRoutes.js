const express = require('express');
const router = express.Router();
const { analyseResume, getAnalysisHistory, getSingleAnalysis } = require('../controllers/analysisController');

// POST /api/analyse/:id - Run analysis on resume
router.post('/analyse/:id', analyseResume);

// GET /api/analysis/history - Fetch history
router.get('/analysis/history', getAnalysisHistory);

// GET /api/analysis/:id - Fetch single analysis report
router.get('/analysis/:id', getSingleAnalysis);

module.exports = router;
