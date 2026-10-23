const { getResumeByIdInDb, saveAnalysisInDb, getAnalysisByIdInDb, getUserAnalysisHistoryInDb } = require('../config/db');
const { analyseResumeContent, emptyResult } = require('../services/analysisEngine');

const getUserId = (req) => {
  return req.headers['x-user-id'] || req.query.user_id || req.body.user_id || 1;
};

const analyseResume = async (req, res) => {
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

    let analysisResult;
    try {
      analysisResult = analyseResumeContent(resume);
    } catch (engineError) {
      analysisResult = emptyResult({
        suggestions: [`Scoring recovered from an engine error: ${engineError.message}`]
      });
    }

    if (!analysisResult || !Number.isFinite(Number(analysisResult.score))) {
      analysisResult = emptyResult();
    }

    const savedAnalysis = await saveAnalysisInDb(resumeId, userId, analysisResult);

    return res.status(200).json({
      success: true,
      message: 'Resume analysed successfully!',
      analysis: {
        ...savedAnalysis,
        score: savedAnalysis.score,
        overall_score: savedAnalysis.overall_score,
        breakdown: analysisResult.breakdown,
        section_scores: analysisResult.section_scores,
        suggestions: analysisResult.suggestions,
        strengths: analysisResult.strengths,
        rules: analysisResult.rules,
        band: analysisResult.band,
        summary_text: analysisResult.summary_text
      }
    });
  } catch (error) {
    console.error('Error during resume analysis:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while evaluating resume.'
    });
  }
};

const getAnalysisHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const history = await getUserAnalysisHistoryInDb(userId);
    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching history.'
    });
  }
};

const getSingleAnalysis = async (req, res) => {
  try {
    const userId = getUserId(req);
    const analysisId = req.params.id;

    const analysis = await getAnalysisByIdInDb(analysisId, userId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error fetching single analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching analysis details.'
    });
  }
};

module.exports = {
  analyseResume,
  getAnalysisHistory,
  getSingleAnalysis
};
