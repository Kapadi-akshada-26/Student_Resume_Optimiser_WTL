const multer = require('multer');

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.pdf', '.docx', '.txt'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const ok = ALLOWED_EXT.some((ext) => name.endsWith(ext));
    if (!ok) {
      cb(new Error('Only PDF, DOCX and TXT files are allowed (max 5 MB).'));
      return;
    }
    cb(null, true);
  }
});

function handleMulterError(err, req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is larger than 5 MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
}

module.exports = { upload, handleMulterError, MAX_BYTES };
