const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../middleware/upload');
const { uploadAtsResume, getAtsHistory, importAtsCheck } = require('../controllers/atsController');

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, uploadAtsResume);

router.get('/history', getAtsHistory);
router.post('/:id/import', importAtsCheck);

module.exports = router;
