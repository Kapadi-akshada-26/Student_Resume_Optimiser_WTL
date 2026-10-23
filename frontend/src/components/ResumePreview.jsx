import React from 'react';

const ResumePreview = ({ resume }) => {
  if (!resume) return null;

  const info = resume.personal_info || {};
  const summary = (resume.summary || '').trim();
  const education = Array.isArray(resume.education) ? resume.education : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
  const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];

  const validEdu = education.filter(e => e.degree || e.college);
  const validSkills = skills.filter(s => s && s.trim());
  const validProjects = projects.filter(p => p.title || p.description);
  const validExp = experience.filter(e => e.org || e.role);
  const validCerts = certifications.filter(c => c.name);
  const validAch = achievements.filter(a => typeof a === 'string' ? a.trim() : a);

  return (
    <div className="resume-paper">
      {/* Header */}
      <header className="resume-header">
        <h1 className="resume-name">{info.full_name || 'Student Name'}</h1>
        
        <div className="resume-contact-line">
          {info.email && <span>{info.email}</span>}
          {info.phone && <span>• {info.phone}</span>}
          {info.linkedin && (
            <span>
              • <a href={info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}`} target="_blank" rel="noreferrer">LinkedIn</a>
            </span>
          )}
          {info.github && (
            <span>
              • <a href={info.github.startsWith('http') ? info.github : `https://${info.github}`} target="_blank" rel="noreferrer">GitHub</a>
            </span>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="resume-section">
          <h2 className="resume-section-title">Professional Summary</h2>
          <p className="resume-summary-text">{summary}</p>
        </section>
      )}

      {/* Education */}
      {validEdu.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Education</h2>
          <div className="resume-list">
            {validEdu.map((edu, idx) => (
              <div key={idx} className="resume-item">
                <div className="resume-item-row">
                  <span className="resume-item-bold">{edu.degree}</span>
                  <span className="resume-item-meta">{edu.year}</span>
                </div>
                <div className="resume-item-row">
                  <span>{edu.college}</span>
                  {edu.cgpa && <span className="resume-item-meta">CGPA: {edu.cgpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {validSkills.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Technical Skills</h2>
          <div className="resume-skills-list">
            {validSkills.join(' • ')}
          </div>
        </section>
      )}

      {/* Projects */}
      {validProjects.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Projects</h2>
          <div className="resume-list">
            {validProjects.map((proj, idx) => (
              <div key={idx} className="resume-item">
                <div className="resume-item-row">
                  <span className="resume-item-bold">{proj.title}</span>
                  {proj.tech && <span className="resume-item-meta">({proj.tech})</span>}
                </div>
                {proj.link && (
                  <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" className="resume-link">
                    {proj.link}
                  </a>
                )}
                {proj.description && <p className="resume-desc">• {proj.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {validExp.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Work Experience & Internships</h2>
          <div className="resume-list">
            {validExp.map((exp, idx) => (
              <div key={idx} className="resume-item">
                <div className="resume-item-row">
                  <span className="resume-item-bold">{exp.role} — {exp.org}</span>
                  {exp.duration && <span className="resume-item-meta">{exp.duration}</span>}
                </div>
                {exp.description && <p className="resume-desc">• {exp.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {validCerts.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Certifications</h2>
          <ul className="resume-bullet-list">
            {validCerts.map((cert, idx) => (
              <li key={idx}>
                <strong>{cert.name}</strong> {cert.org ? `— ${cert.org}` : ''} {cert.year ? `(${cert.year})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Achievements */}
      {validAch.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-title">Key Achievements</h2>
          <ul className="resume-bullet-list">
            {validAch.map((ach, idx) => (
              <li key={idx}>{ach}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ResumePreview;
