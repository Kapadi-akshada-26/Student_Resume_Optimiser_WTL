const { resolveSkill, CANONICAL_SKILLS } = require('../data/skillsDictionary');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'of', 'on', 'in', 'to', 'from',
  'with', 'by', 'as', 'at', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these',
  'those', 'it', 'its', 'we', 'you', 'your', 'our', 'they', 'their', 'will', 'can', 'must', 'should',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'using', 'use', 'used', 'via', 'per',
  'into', 'about', 'over', 'under', 'more', 'less', 'than', 'such', 'including', 'include', 'includes',
  'ability', 'able', 'strong', 'good', 'required', 'requirements', 'role', 'job', 'position', 'candidate',
  'experience', 'years', 'year', 'work', 'working', 'team', 'plus', 'etc', 'across', 'within', 'well'
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function extractJdSkills(jdText) {
  const tokens = tokenize(jdText);
  const weights = new Map();

  const add = (label, weight) => {
    if (!label) return;
    weights.set(label, (weights.get(label) || 0) + weight);
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const uni = resolveSkill(tokens[i]);
    add(uni, 1);
    if (i + 1 < tokens.length) {
      const bi = resolveSkill(`${tokens[i]} ${tokens[i + 1]}`);
      add(bi, 2);
    }
  }

  // Also scan the raw string for multi-word dictionary entries.
  const lower = String(jdText || '').toLowerCase();
  for (const skill of CANONICAL_SKILLS) {
    if (skill.includes(' ') && lower.includes(skill)) {
      add(skill, 2);
    }
  }

  return weights;
}

function extractResumeSkills(resume) {
  const skills = Array.isArray(resume?.skills) ? resume.skills : [];
  const found = new Set();
  for (const raw of skills) {
    const label = resolveSkill(typeof raw === 'string' ? raw : (raw && (raw.name || raw.skill))) ||
      (typeof raw === 'string' ? raw.trim().toLowerCase() : '');
    if (label) found.add(label);
  }

  const blob = [
    resume?.summary,
    ...(Array.isArray(resume?.projects) ? resume.projects.map((p) => `${p?.title || ''} ${p?.description || ''} ${p?.tech || ''}`) : []),
    ...(Array.isArray(resume?.experience) ? resume.experience.map((e) => `${e?.role || ''} ${e?.description || ''}`) : [])
  ].join(' ').toLowerCase();

  for (const skill of CANONICAL_SKILLS) {
    if (skill.length >= 3 && blob.includes(skill)) found.add(skill);
  }

  return found;
}

/**
 * Explainable JD match:
 * match% = (sum of weights of JD skills also found on the resume) / (total JD skill weight) * 100
 */
function matchJobDescription(resume, jdText) {
  const text = String(jdText || '').trim();
  if (!text) {
    return { match_percent: null, matched: [], missing: [], jd_skills: [] };
  }

  const jdWeights = extractJdSkills(text);
  const resumeSkills = extractResumeSkills(resume);

  if (jdWeights.size === 0) {
    return { match_percent: 0, matched: [], missing: [], jd_skills: [] };
  }

  let matchedWeight = 0;
  let totalWeight = 0;
  const matched = [];
  const missing = [];
  const jd_skills = [];

  for (const [skill, weight] of jdWeights.entries()) {
    totalWeight += weight;
    jd_skills.push({ skill, weight });
    const hit = [...resumeSkills].some((s) => s === skill || s.includes(skill) || skill.includes(s));
    if (hit) {
      matchedWeight += weight;
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const match_percent = totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 1000) / 10;
  return { match_percent, matched, missing, jd_skills };
}

module.exports = {
  tokenize,
  matchJobDescription,
  extractResumeSkills,
  extractJdSkills
};
