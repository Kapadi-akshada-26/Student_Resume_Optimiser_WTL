const { resolveSkill, CANONICAL_SKILLS } = require('../data/skillsDictionary');

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/g;
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+/gi;
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9\-]+/gi;

const HEADING_MAP = {
  summary: ['summary', 'professional summary', 'profile', 'objective', 'career objective', 'about me'],
  education: ['education', 'academic background', 'academics', 'qualifications'],
  experience: ['experience', 'work experience', 'internship', 'internships', 'employment', 'work history'],
  projects: ['projects', 'academic projects', 'personal projects', 'project work'],
  skills: ['skills', 'technical skills', 'skill set', 'technologies', 'tools'],
  certifications: ['certifications', 'certificates', 'courses', 'licenses'],
  achievements: ['achievements', 'accomplishments', 'awards', 'honours', 'honors', 'extra curricular', 'extracurricular']
};

function headingType(line) {
  const normalised = line.toLowerCase().replace(/[:\-–—]/g, '').trim();
  if (!normalised || normalised.length > 48) return null;
  for (const [type, labels] of Object.entries(HEADING_MAP)) {
    if (labels.includes(normalised)) return type;
  }
  return null;
}

function splitBullets(text) {
  return String(text || '')
    .split(/\n|•|\u2022|\*|–|—/)
    .map((b) => b.replace(/^[\s\-–—*•]+/, '').trim())
    .filter((b) => b.length > 1);
}

function extractSkillsFromText(text) {
  const found = [];
  const seen = new Set();
  const lower = String(text || '').toLowerCase();

  const add = (label) => {
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push(label);
  };

  for (const token of lower.split(/[^a-z0-9+.#]+/)) {
    add(resolveSkill(token));
  }
  for (const skill of CANONICAL_SKILLS) {
    if (skill.includes(' ') && lower.includes(skill)) add(skill);
  }
  return found;
}

function parseEducation(block) {
  const lines = splitBullets(block);
  return lines.slice(0, 4).map((line) => {
    const cgpaMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:cgpa|gpa)/i);
    const yearMatch = line.match(/\b((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}|present))?\b/i);
    return {
      degree: line.split(/,|-|–|at|from/i)[0].trim().slice(0, 80),
      college: line,
      year: yearMatch ? yearMatch[0] : '',
      cgpa: cgpaMatch ? cgpaMatch[1] : ''
    };
  });
}

function parseExperience(block) {
  const lines = splitBullets(block);
  const items = [];
  let current = null;
  for (const line of lines) {
    const looksLikeHeader = line.length < 90 && !line.endsWith('.');
    if (looksLikeHeader && /intern|engineer|developer|analyst|assistant|member|volunteer/i.test(line)) {
      if (current) items.push(current);
      current = { org: line, role: line, duration: '', description: '' };
    } else if (current) {
      current.description = `${current.description} ${line}`.trim();
    } else {
      current = { org: line, role: line, duration: '', description: line };
    }
  }
  if (current) items.push(current);
  return items.slice(0, 6);
}

function parseProjects(block) {
  const lines = splitBullets(block);
  const items = [];
  let current = null;
  for (const line of lines) {
    if (line.length < 80 && items.length < 8 && !/^(built|developed|designed|created|implemented)/i.test(line)) {
      if (current) items.push(current);
      current = { title: line, description: '', tech: '', link: '' };
    } else if (current) {
      current.description = `${current.description} ${line}`.trim();
    } else {
      current = { title: line.slice(0, 60), description: line, tech: '', link: '' };
    }
  }
  if (current) items.push(current);
  return items.slice(0, 6);
}

function parseNamedList(block) {
  return splitBullets(block).slice(0, 8).map((line) => ({ name: line, org: '', year: '' }));
}

/**
 * Rule-based text → structured resume. No AI.
 */
function parseResumeText(rawText) {
  const text = String(rawText || '').replace(/\r/g, '');
  const emails = text.match(EMAIL_RE) || [];
  const phones = text.match(PHONE_RE) || [];
  const linkedin = (text.match(LINKEDIN_RE) || [])[0] || '';
  const github = (text.match(GITHUB_RE) || [])[0] || '';

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const firstContentLine = lines.find((l) => !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !headingType(l)) || '';

  const sections = {
    summary: '',
    education: '',
    experience: '',
    projects: '',
    skills: '',
    certifications: '',
    achievements: ''
  };
  let current = 'summary';
  const preamble = [];

  for (const line of lines) {
    const type = headingType(line);
    if (type) {
      current = type;
      continue;
    }
    if (!Object.keys(sections).includes(current) || (current === 'summary' && preamble.length < 8 && !sections.summary)) {
      preamble.push(line);
    }
    sections[current] = `${sections[current] || ''}\n${line}`.trim();
  }

  const summarySource = sections.summary || preamble.slice(1, 6).join(' ');
  const skillsBlock = sections.skills || text;
  const skills = extractSkillsFromText(skillsBlock);

  return {
    personal_info: {
      full_name: firstContentLine.slice(0, 80),
      email: emails[0] || '',
      phone: (phones[0] || '').trim(),
      linkedin,
      github
    },
    summary: summarySource.split(/\s+/).slice(0, 90).join(' ').trim(),
    education: parseEducation(sections.education),
    skills,
    projects: parseProjects(sections.projects),
    experience: parseExperience(sections.experience),
    certifications: parseNamedList(sections.certifications),
    achievements: splitBullets(sections.achievements)
  };
}

module.exports = {
  parseResumeText,
  extractSkillsFromText,
  headingType
};
