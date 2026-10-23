const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

const MIN_READABLE_CHARS = 80;

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return String(result?.text || '');
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  }
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value || '');
}

function extractTxt(buffer) {
  return Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer || '');
}

function assessExtraction(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  const char_count = cleaned.length;
  const machine_readable = char_count >= MIN_READABLE_CHARS;
  return {
    text: String(text || ''),
    cleaned,
    char_count,
    machine_readable,
    warning: machine_readable
      ? null
      : 'Very little text was extracted. This file is probably a scanned or image-based PDF and is not ATS-readable.'
  };
}

async function extractResumeText(file) {
  if (!file || !file.buffer) {
    throw new Error('No file data received.');
  }
  const name = String(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();

  let text = '';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    text = await extractPdfText(file.buffer);
  } else if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    text = await extractDocxText(file.buffer);
  } else if (mime === 'text/plain' || name.endsWith('.txt')) {
    text = extractTxt(file.buffer);
  } else {
    throw new Error('Unsupported file type. Upload a PDF, DOCX or TXT file.');
  }

  return assessExtraction(text);
}

module.exports = {
  extractResumeText,
  assessExtraction,
  MIN_READABLE_CHARS
};
