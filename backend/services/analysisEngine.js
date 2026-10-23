/**
 * Transparent rule-based resume scorer (no LLM).
 *
 * How scoring works (viva-ready):
 * 1. Normalise the resume so missing/malformed JSON never throws.
 * 2. Award points per section using fixed weights that sum to 100.
 * 3. Run ATS checks (contact, verbs, metrics, pronouns, length, dates, extraction).
 * 4. Apply small deductions for failed high/medium ATS rules.
 * 5. Always return { score: 0-100, breakdown, suggestions, rules, band }.
 */

const ACTION_VERBS = require('../data/actionVerbs');
const { matchJobDescription } = require('./keywordMatcher');

const SECTION_WEIGHTS = {
  contact_info: 15,
  summary: 10,
  education: 15,
  skills: 15,
  projects: 20,
  experience: 10,
  certifications: 5,
  achievements: 5,
  content_quality: 5
};

const FIRST_PERSON = /\b(i|me|my|mine|we|our|ours)\b/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const DATE_PATTERNS = [
  { id: 'month_year', re: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/i },
  { id: 'yyyy_mm', re: /\b\d{4}[-/]\d{1,2}\b/ },
  { id: 'mm_yyyy', re: /\b\d{1,2}[-/]\d{4}\b/ },
  { id: 'year_only', re: /\b(19|20)\d{2}\b/ }
];

function asString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    return String(value.name || value.title || value.value || value.text || value.label || '');
  }
  return '';
}

function safeJson(value) {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function asArray(value) {
  const parsed = safeJson(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'string') {
    return parsed.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof parsed === 'object') return [parsed];
  return [];
}

function asObject(value) {
  const parsed = safeJson(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return parsed;
}

function clampScore(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getScoreBand(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

function collectBullets(resume) {
  const chunks = [];
  for (const p of resume.projects) {
    chunks.push(asString(p.description), asString(p.highlights));
  }
  for (const e of resume.experience) {
    chunks.push(asString(e.description), asString(e.highlights));
  }
  return chunks
    .join('\n')
    .split(/\n|•|\u2022|\*|–|—|;/)
    .map((b) => b.replace(/^[\s\-–—*•]+/, '').trim())
    .filter((b) => b.length > 8);
}

function normalizeResume(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const info = asObject(source.personal_info || source.contact || source.personalInfo);
  const skills = asArray(source.skills).map((s) => {
    if (typeof s === 'string') return s.trim();
    if (s && typeof s === 'object') return asString(s.name || s.skill || s);
    return asString(s);
  }).filter(Boolean);

  return {
    title: asString(source.title),
    personal_info: {
      full_name: asString(info.full_name || info.name || info.fullName),
      email: asString(info.email),
      phone: asString(info.phone || info.mobile),
      linkedin: asString(info.linkedin),
      github: asString(info.github),
      location: asString(info.location)
    },
    summary: asString(source.summary || source.objective),
    education: asArray(source.education).map((e) => ({
      degree: asString(e && (e.degree || e.qualification || e.course)),
      college: asString(e && (e.college || e.institution || e.school || e.university)),
      year: asString(e && (e.year || e.end_year || e.endYear || e.dates)),
      cgpa: asString(e && (e.cgpa || e.gpa || e.score))
    })),
    skills,
    projects: asArray(source.projects).map((p) => ({
      title: asString(p && (p.title || p.name)),
      description: asString(p && (p.description || p.summary || p.details)),
      tech: asString(p && (p.tech || p.technologies)),
      link: asString(p && (p.link || p.url))
    })),
    experience: asArray(source.experience).map((e) => ({
      org: asString(e && (e.org || e.company || e.organisation || e.organization)),
      role: asString(e && (e.role || e.title || e.position)),
      duration: asString(e && (e.duration || e.dates || e.period)),
      description: asString(e && (e.description || e.summary || e.details))
    })),
    certifications: asArray(source.certifications).map((c) => (
      typeof c === 'string'
        ? { name: c.trim(), org: '', year: '' }
        : { name: asString(c && (c.name || c.title)), org: asString(c && (c.org || c.issuer)), year: asString(c && c.year) }
    )),
    achievements: asArray(source.achievements).map((a) => (typeof a === 'string' ? a : asString(a && (a.title || a.name || a)))).filter(Boolean)
  };
}

function emptyBreakdown() {
  const breakdown = {};
  for (const [key, max] of Object.entries(SECTION_WEIGHTS)) {
    breakdown[key] = { score: 0, max, label: key };
  }
  return breakdown;
}

function emptyResult(extra = {}) {
  const breakdown = extra.breakdown || emptyBreakdown();
  const section_scores = {};
  for (const [key, value] of Object.entries(breakdown)) {
    section_scores[key] = value.score || 0;
  }
  const score = clampScore(extra.score || 0);
  return {
    score,
    overall_score: score,
    breakdown,
    section_scores,
    suggestions: extra.suggestions || ['Add contact details, education, skills and projects so the engine can score your resume.'],
    strengths: extra.strengths || [],
    summary_text: extra.summary_text || 'Your resume needs significant additions before it is competitive.',
    band: getScoreBand(score),
    rules: extra.rules || [],
    keyword_match: extra.keyword_match || { match_percent: null, matched: [], missing: [] },
    extraction: extra.extraction || { machine_readable: true, char_count: 0, warning: null }
  };
}

function analyseResumeContent(rawResume, options = {}) {
  try {
    const resume = normalizeResume(rawResume);
    const extraction = options.extraction || { machine_readable: true, char_count: 0, warning: null };
    const suggestions = [];
    const strengths = [];
    const rules = [];
    const breakdown = emptyBreakdown();

    const addRule = (id, severity, passed, message, fix) => {
      rules.push({ id, severity, passed: Boolean(passed), message, fix_suggestion: fix });
      if (!passed) suggestions.push(fix || message);
    };

    const info = resume.personal_info;

    // 1. Contact (15)
    let contactPts = 0;
    if (info.full_name) contactPts += 3;
    if (info.email && EMAIL_RE.test(info.email)) contactPts += 3;
    if (info.phone && PHONE_RE.test(info.phone)) contactPts += 3;
    if (info.linkedin) contactPts += 3; else suggestions.push('Add your LinkedIn profile URL to improve your professional online presence.');
    if (info.github) contactPts += 3; else suggestions.push('Add your GitHub profile URL to showcase projects and code.');
    if (!info.phone) suggestions.push('Include a contact phone number so recruiters can easily reach you.');
    if (!info.email) suggestions.push('Add a professional email address.');
    breakdown.contact_info.score = contactPts;
    if (contactPts >= 12) strengths.push('Contact information is complete with essential links.');

    addRule('missing_email', 'high', Boolean(info.email && EMAIL_RE.test(info.email)),
      info.email ? 'Email address found.' : 'Email address is missing.',
      'Add a professional email such as name@college.edu.');
    addRule('missing_phone', 'high', Boolean(info.phone && PHONE_RE.test(info.phone)),
      info.phone ? 'Phone number found.' : 'Phone number is missing.',
      'Add a reachable mobile number with country code.');
    addRule('missing_linkedin', 'medium', Boolean(info.linkedin),
      info.linkedin ? 'LinkedIn URL found.' : 'LinkedIn URL is missing.',
      'Add your LinkedIn profile URL (https://linkedin.com/in/...).');

    // 2. Summary (10)
    const summaryWords = resume.summary.split(/\s+/).filter(Boolean);
    const wordCount = summaryWords.length;
    if (wordCount >= 30 && wordCount <= 80) {
      breakdown.summary.score = 10;
      strengths.push('Professional summary is a focused 30–80 words.');
    } else if (wordCount >= 20 && wordCount <= 120) {
      breakdown.summary.score = 7;
      suggestions.push('Tune your summary to about 30–80 words for ATS-friendly scanning.');
    } else if (wordCount > 0) {
      breakdown.summary.score = 4;
      suggestions.push('Expand your professional summary to 2–3 sentences (30–80 words).');
    } else {
      breakdown.summary.score = 0;
      suggestions.push('Add a professional summary describing your background, skills and target role.');
    }
    const summaryOk = wordCount >= 30 && wordCount <= 80;
    addRule('summary_length', 'medium', wordCount === 0 ? false : summaryOk,
      wordCount === 0 ? 'Summary is missing.' : `Summary is ${wordCount} words (ideal 30–80).`,
      'Write a 30–80 word summary with role, skills and one proof point.');

    // 3. Education (15)
    const validEdu = resume.education.filter((e) => e.degree && e.college);
    if (validEdu.length >= 1) {
      breakdown.education.score = 15;
      strengths.push('Academic qualifications are clearly documented.');
    } else {
      breakdown.education.score = 0;
      suggestions.push('Provide education details: degree, college, year and CGPA.');
    }

    // 4. Skills (15)
    const validSkills = resume.skills.filter((s) => asString(s).trim());
    if (validSkills.length >= 5) {
      breakdown.skills.score = 15;
      strengths.push(`Lists ${validSkills.length} skills, enough to pass basic keyword filters.`);
    } else if (validSkills.length >= 3) {
      breakdown.skills.score = 10;
      suggestions.push('Add more technical skills to reach at least 5.');
    } else if (validSkills.length >= 1) {
      breakdown.skills.score = 5;
      suggestions.push('List at least 5 core technical skills to pass ATS keyword filters.');
    } else {
      breakdown.skills.score = 0;
      suggestions.push('Add key technical skills (languages, frameworks, databases, tools).');
    }
    addRule('skills_count', 'high', validSkills.length >= 5,
      `Found ${validSkills.length} skills (need at least 5).`,
      'Add at least 5 concrete skills that appear in target job descriptions.');

    // 5. Projects (20)
    const validProjects = resume.projects.filter((p) => p.title && p.description);
    if (validProjects.length >= 2) {
      breakdown.projects.score = 20;
      strengths.push(`Includes ${validProjects.length} projects with descriptions.`);
    } else if (validProjects.length === 1) {
      breakdown.projects.score = 12;
      suggestions.push('Add at least one more project to show range.');
    } else {
      breakdown.projects.score = 0;
      suggestions.push('Add at least 2 projects with technologies used and outcomes.');
    }

    // 6. Experience (10)
    const validExp = resume.experience.filter((e) => e.org && e.role);
    if (validExp.length >= 1) {
      breakdown.experience.score = 10;
      strengths.push('Includes practical work or internship experience.');
    } else {
      breakdown.experience.score = 0;
      suggestions.push('Add internship, research, freelance or club experience if you have any.');
    }

    // 7. Certifications (5)
    const validCerts = resume.certifications.filter((c) => c.name);
    if (validCerts.length >= 1) {
      breakdown.certifications.score = 5;
      strengths.push('Lists at least one certification.');
    } else {
      breakdown.certifications.score = 0;
      suggestions.push('Add relevant certifications (AWS, Coursera, NPTEL, etc.).');
    }

    // 8. Achievements (5)
    if (resume.achievements.length >= 1) {
      breakdown.achievements.score = 5;
      strengths.push('Highlights honours, hackathons or awards.');
    } else {
      breakdown.achievements.score = 0;
      suggestions.push('Add achievements such as hackathon ranks, scholarships or awards.');
    }

    // 9. Content quality + ATS bullet rules (5)
    const bullets = collectBullets(resume);
    const combinedText = bullets.join(' ').toLowerCase();
    const verbHits = ACTION_VERBS.filter((verb) => combinedText.includes(verb)).length;
    const bulletsWithVerb = bullets.filter((b) => ACTION_VERBS.some((v) => b.toLowerCase().includes(v)));
    const bulletsWithMetric = bullets.filter((b) => /\d/.test(b));
    const longBullets = bullets.filter((b) => b.length > 200);
    const pronounBullets = bullets.filter((b) => FIRST_PERSON.test(b));

    if (combinedText.length >= 120 && verbHits >= 2) {
      breakdown.content_quality.score = 5;
      strengths.push('Descriptions use action verbs and enough detail.');
    } else if (combinedText.length >= 50) {
      breakdown.content_quality.score = 3;
      suggestions.push('Use stronger action verbs (Developed, Engineered, Integrated) and add measurable results.');
    } else {
      breakdown.content_quality.score = 0;
      suggestions.push('Expand project/experience bullets with your role, tools and results.');
    }

    addRule('bullets_action_verbs', 'medium', bullets.length === 0 ? false : bulletsWithVerb.length >= Math.ceil(bullets.length * 0.5),
      bullets.length === 0 ? 'No bullets found in projects/experience.' : `${bulletsWithVerb.length}/${bullets.length} bullets start from / contain action verbs.`,
      'Rewrite bullets to start with verbs such as Built, Developed, Designed, Implemented.');
    addRule('bullets_metrics', 'medium', bullets.length === 0 ? false : bulletsWithMetric.length >= 1,
      bulletsWithMetric.length ? `${bulletsWithMetric.length} bullets include numbers or metrics.` : 'Bullets lack numbers or measurable results.',
      'Add metrics, e.g. "Reduced load time by 40%" or "Mentored 12 students".');
    addRule('bullets_too_long', 'low', longBullets.length === 0,
      longBullets.length ? `${longBullets.length} bullets exceed ~200 characters.` : 'Bullet lengths are ATS-friendly.',
      'Keep each bullet under ~200 characters so ATS parsers and recruiters can scan them.');
    addRule('first_person', 'low', pronounBullets.length === 0,
      pronounBullets.length ? 'First-person pronouns (I/me/my) appear in bullets.' : 'No first-person pronouns in bullets.',
      'Drop "I" and "my"; start with a verb: "Built a REST API" not "I built a REST API".');

    const presentSections = {
      summary: Boolean(resume.summary),
      education: validEdu.length > 0,
      experience: validExp.length > 0,
      projects: validProjects.length > 0,
      skills: validSkills.length > 0,
      certifications: validCerts.length > 0,
      achievements: resume.achievements.length > 0
    };
    const missingStandard = ['summary', 'education', 'experience', 'projects', 'skills'].filter((s) => !presentSections[s]);
    addRule('missing_sections', 'high', missingStandard.length === 0,
      missingStandard.length ? `Missing standard sections: ${missingStandard.join(', ')}.` : 'Core sections are present.',
      `Add the missing sections: ${missingStandard.join(', ') || 'none'}.`);

    const dateTexts = [
      ...resume.education.map((e) => e.year),
      ...resume.experience.map((e) => e.duration)
    ].filter(Boolean);
    const matchedDateIds = new Set();
    for (const text of dateTexts) {
      for (const pat of DATE_PATTERNS) {
        if (pat.re.test(text)) matchedDateIds.add(pat.id);
      }
    }
    const datesConsistent = matchedDateIds.size <= 1;
    addRule('date_formats', 'low', dateTexts.length === 0 ? true : datesConsistent,
      datesConsistent ? 'Date formats look consistent.' : 'Mixed date formats detected (e.g. 2024-06 vs June 2024).',
      'Use one date style everywhere, e.g. "Jun 2024 – Present".');

    const machineReadable = extraction.machine_readable !== false;
    addRule('extraction_quality', 'high', machineReadable,
      machineReadable ? 'File/text is machine-readable.' : 'Extracted text is too thin — this file is probably scanned or image-based.',
      'Export a text-based PDF (not a scanned photo). ATS software cannot read images of text.');

    const pageChars = Number(extraction.char_count) || (
      JSON.stringify(resume).length
    );
    const estimatedPages = pageChars / 2800;
    const lengthOk = estimatedPages <= 1.4;
    addRule('resume_length', 'low', lengthOk,
      `Estimated length ~${Math.max(1, estimatedPages).toFixed(1)} page(s) (1 page is ideal for students).`,
      'Keep a student resume to one page unless you have extensive internships.');

    if (!machineReadable) {
      breakdown.content_quality.score = 0;
    }

    let baseScore = Object.values(breakdown).reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    const failedHigh = rules.filter((r) => !r.passed && r.severity === 'high').length;
    const failedMed = rules.filter((r) => !r.passed && r.severity === 'medium').length;
    const failedLow = rules.filter((r) => !r.passed && r.severity === 'low').length;
    // Light deductions so ATS issues are visible without collapsing a filled resume to 0.
    let score = baseScore - failedHigh * 2 - failedMed * 1 - failedLow * 0.5;
    if (!machineReadable) score = Math.min(score, 25);
    score = clampScore(score);

    const keyword_match = matchJobDescription(resume, options.jdText || options.jd_text || '');

    let summary_text = '';
    if (!machineReadable) {
      summary_text = 'This file does not look ATS-readable. Use a real text PDF or DOCX instead of a scan.';
    } else if (score >= 80) {
      summary_text = 'Excellent resume foundation — comprehensive, well-structured and job-ready.';
    } else if (score >= 60) {
      summary_text = 'Good foundation. Tighten bullets, links and missing sections to raise the ATS score.';
    } else {
      summary_text = 'Your resume needs significant additions in skills, projects and section details.';
    }

    const uniqueSuggestions = [...new Set(suggestions.map((s) => asString(s)).filter(Boolean))];

    return {
      score,
      overall_score: score,
      breakdown,
      section_scores: Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [k, v.score])),
      suggestions: uniqueSuggestions,
      strengths,
      summary_text,
      band: getScoreBand(score),
      rules,
      keyword_match,
      extraction,
      normalized_resume: resume
    };
  } catch (error) {
    return emptyResult({
      suggestions: [`Scoring recovered from malformed data: ${error.message}`],
      summary_text: 'The engine received malformed data but still returned a numeric score of 0.'
    });
  }
}

module.exports = {
  analyseResumeContent,
  scoreResume: analyseResumeContent,
  normalizeResume,
  getScoreBand,
  SECTION_WEIGHTS,
  emptyResult,
  clampScore
};
