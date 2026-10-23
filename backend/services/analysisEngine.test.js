const { analyseResumeContent } = require('./analysisEngine');

function assertValidScore(result) {
  expect(result).toBeTruthy();
  expect(typeof result.score).toBe('number');
  expect(Number.isNaN(result.score)).toBe(false);
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
  expect(result.overall_score).toBe(result.score);
  expect(result.breakdown).toBeTypeOf('object');
  expect(Array.isArray(result.suggestions)).toBe(true);
  expect(Array.isArray(result.rules)).toBe(true);
}

describe('analyseResumeContent', () => {
  it('returns a valid numeric score for an empty resume', () => {
    const result = analyseResumeContent({});
    assertValidScore(result);
    expect(result.score).toBeLessThan(40);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('returns a valid numeric score for a partial resume', () => {
    const result = analyseResumeContent({
      personal_info: { full_name: 'Asha Rao', email: 'asha@college.edu' },
      summary: 'CS student.',
      skills: ['Python', 'SQL']
    });
    assertValidScore(result);
    expect(result.score).toBeGreaterThan(0);
    expect(result.section_scores.contact_info).toBeGreaterThan(0);
  });

  it('returns a high valid score for a full student resume', () => {
    const result = analyseResumeContent({
      personal_info: {
        full_name: 'Rahul Sharma',
        email: 'rahul@college.edu',
        phone: '+91 9876543210',
        linkedin: 'https://linkedin.com/in/rahul',
        github: 'https://github.com/rahul'
      },
      summary: 'B.Tech Computer Science student skilled in React, Node.js and MySQL. Built three production-style projects, interned at a startup, and enjoy turning messy data into clear product features for campus and internship applications.',
      education: [{ degree: 'B.Tech CSE', college: 'VIT', year: 'Jun 2026', cgpa: '8.7' }],
      skills: ['JavaScript', 'React', 'Node.js', 'MySQL', 'Git', 'Python'],
      projects: [
        {
          title: 'Resume Optimiser',
          description: 'Built a full-stack tool that scored 120 student resumes and reduced review time by 40%.'
        },
        {
          title: 'Campus Lost & Found',
          description: 'Developed a React + Express app used by 80 students; implemented search that cut lookup time by 25%.'
        }
      ],
      experience: [
        {
          org: 'ByteLabs',
          role: 'SDE Intern',
          duration: 'Jun 2025 – Aug 2025',
          description: 'Implemented REST APIs in Express and increased test coverage from 30% to 70%.'
        }
      ],
      certifications: [{ name: 'AWS Cloud Practitioner', org: 'Amazon', year: '2025' }],
      achievements: ['Winner, Smart India Hackathon 2025']
    });
    assertValidScore(result);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.band).toMatch(/Good|Excellent/);
  });

  it('returns a valid numeric score for malformed data', () => {
    const result = analyseResumeContent({
      personal_info: 'not-an-object',
      skills: 'python, react',
      education: null,
      projects: { title: 'oops' },
      experience: 'intern',
      certifications: 12,
      achievements: { 0: null }
    });
    assertValidScore(result);
  });

  it('never throws on null / undefined input', () => {
    assertValidScore(analyseResumeContent(null));
    assertValidScore(analyseResumeContent(undefined));
  });
});
