import React, { useState, useEffect } from 'react';

const ResumeForm = ({ initialData, onSubmit, onChange, loading, isEditing }) => {
  const [resumeTitle, setResumeTitle] = useState('Student Resume');
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: ''
  });

  const [summary, setSummary] = useState('');
  const [educationList, setEducationList] = useState([{ degree: '', college: '', year: '', cgpa: '' }]);
  const [skillsList, setSkillsList] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [projectsList, setProjectsList] = useState([{ title: '', description: '', tech: '', link: '' }]);
  const [experienceList, setExperienceList] = useState([]);
  const [certificationsList, setCertificationsList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);

  const [errors, setErrors] = useState({});

  // Prefill initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setResumeTitle(initialData.title);
      if (initialData.personal_info) setPersonalInfo(initialData.personal_info);
      if (initialData.summary) setSummary(initialData.summary);
      if (initialData.education && initialData.education.length > 0) setEducationList(initialData.education);
      if (initialData.skills) setSkillsList(initialData.skills);
      if (initialData.projects && initialData.projects.length > 0) setProjectsList(initialData.projects);
      if (initialData.experience) setExperienceList(initialData.experience);
      if (initialData.certifications) setCertificationsList(initialData.certifications);
      if (initialData.achievements) setAchievementsList(initialData.achievements);
    }
  }, [initialData]);

  // Propagate state changes live to parent for split-screen live preview!
  useEffect(() => {
    if (onChange) {
      onChange({
        title: resumeTitle,
        personal_info: personalInfo,
        summary,
        education: educationList,
        skills: skillsList,
        projects: projectsList,
        experience: experienceList,
        certifications: certificationsList,
        achievements: achievementsList
      });
    }
  }, [resumeTitle, personalInfo, summary, educationList, skillsList, projectsList, experienceList, certificationsList, achievementsList]);

  // Section completion check helpers
  const isPersonalComplete = Boolean(personalInfo.full_name.trim() && personalInfo.email.trim());
  const isSummaryComplete = Boolean(summary.trim().length >= 20);
  const isEducationComplete = educationList.some(e => e.degree.trim() && e.college.trim());
  const isSkillsComplete = skillsList.length >= 3;
  const isProjectsComplete = projectsList.some(p => p.title.trim() && p.description.trim());
  const isExpComplete = experienceList.some(e => e.org.trim());
  const isCertComplete = certificationsList.some(c => c.name.trim());
  const isAchComplete = achievementsList.some(a => typeof a === 'string' && a.trim());

  // Personal Info change handler
  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  // Education Handlers
  const handleEducationChange = (index, field, value) => {
    const updated = [...educationList];
    updated[index][field] = value;
    setEducationList(updated);
    if (errors.education) setErrors({ ...errors, education: '' });
  };

  const addEducation = () => {
    setEducationList([...educationList, { degree: '', college: '', year: '', cgpa: '' }]);
  };

  const removeEducation = (index) => {
    if (educationList.length === 1) return;
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  // Skills Handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setSkillInput('');
      if (errors.skills) setErrors({ ...errors, skills: '' });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  // Projects Handlers
  const handleProjectChange = (index, field, value) => {
    const updated = [...projectsList];
    updated[index][field] = value;
    setProjectsList(updated);
    if (errors.projects) setErrors({ ...errors, projects: '' });
  };

  const addProject = () => {
    setProjectsList([...projectsList, { title: '', description: '', tech: '', link: '' }]);
  };

  const removeProject = (index) => {
    if (projectsList.length === 1) return;
    setProjectsList(projectsList.filter((_, i) => i !== index));
  };

  // Experience Handlers
  const handleExperienceChange = (index, field, value) => {
    const updated = [...experienceList];
    updated[index][field] = value;
    setExperienceList(updated);
  };

  const addExperience = () => {
    setExperienceList([...experienceList, { org: '', role: '', duration: '', description: '' }]);
  };

  const removeExperience = (index) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  // Certification Handlers
  const handleCertChange = (index, field, value) => {
    const updated = [...certificationsList];
    updated[index][field] = value;
    setCertificationsList(updated);
  };

  const addCertification = () => {
    setCertificationsList([...certificationsList, { name: '', org: '', year: '' }]);
  };

  const removeCertification = (index) => {
    setCertificationsList(certificationsList.filter((_, i) => i !== index));
  };

  // Achievement Handlers
  const handleAchievementChange = (index, value) => {
    const updated = [...achievementsList];
    updated[index] = value;
    setAchievementsList(updated);
  };

  const addAchievement = () => {
    setAchievementsList([...achievementsList, '']);
  };

  const removeAchievement = (index) => {
    setAchievementsList(achievementsList.filter((_, i) => i !== index));
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!personalInfo.full_name.trim()) newErrors.full_name = 'Full Name is required.';
    if (!personalInfo.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const validEdu = educationList.filter(e => e.degree.trim() && e.college.trim());
    if (validEdu.length === 0) newErrors.education = 'At least one complete education entry is required.';

    if (skillsList.length === 0) newErrors.skills = 'Please add at least one skill.';

    const validProj = projectsList.filter(p => p.title.trim() && p.description.trim());
    if (validProj.length === 0) newErrors.projects = 'At least one project is required.';

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onSubmit({
      title: resumeTitle || `${personalInfo.full_name}'s Resume`,
      personal_info: personalInfo,
      summary,
      education: educationList,
      skills: skillsList,
      projects: projectsList,
      experience: experienceList,
      certifications: certificationsList,
      achievements: achievementsList
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Resume Title */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <label className="form-label" htmlFor="resumeTitle">Resume Title</label>
        <input
          id="resumeTitle"
          type="text"
          className="form-input"
          value={resumeTitle}
          onChange={(e) => setResumeTitle(e.target.value)}
          placeholder="e.g. Software Engineer Resume 2026"
        />
      </div>

      {/* 01. Personal Information */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>01 Personal Information</h3>
          <span className={`section-badge ${isPersonalComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isPersonalComplete ? '✓ Complete' : '→ Required'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="full_name"
              className="form-input"
              value={personalInfo.full_name}
              onChange={handlePersonalInfoChange}
              placeholder="Rahul Sharma"
            />
            {errors.full_name && <p className="error-text">{errors.full_name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={personalInfo.email}
              onChange={handlePersonalInfoChange}
              placeholder="rahul@college.edu"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              value={personalInfo.phone}
              onChange={handlePersonalInfoChange}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input
              type="text"
              name="linkedin"
              className="form-input"
              value={personalInfo.linkedin}
              onChange={handlePersonalInfoChange}
              placeholder="https://linkedin.com/in/rahul"
            />
          </div>

          <div className="form-group">
            <label className="form-label">GitHub URL</label>
            <input
              type="text"
              name="github"
              className="form-input"
              value={personalInfo.github}
              onChange={handlePersonalInfoChange}
              placeholder="https://github.com/rahul"
            />
          </div>
        </div>
      </div>

      {/* 02. Professional Summary */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>02 Professional Summary</h3>
          <span className={`section-badge ${isSummaryComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isSummaryComplete ? '✓ Complete' : '→ Recommended'}
          </span>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <textarea
            className="form-input"
            rows="3"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enthusiastic B.Tech Computer Science student with strong foundations in React, Node.js, and MySQL..."
          ></textarea>
        </div>
      </div>

      {/* 03. Education */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>03 Education *</h3>
          <span className={`section-badge ${isEducationComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isEducationComplete ? '✓ Complete' : '→ Required'}
          </span>
        </div>

        {errors.education && <p className="error-text" style={{ marginBottom: '1rem' }}>{errors.education}</p>}

        {educationList.map((edu, index) => (
          <div key={index} style={{ borderBottom: index < educationList.length - 1 ? '1px solid var(--soft-border)' : 'none', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Degree</label>
                <input
                  type="text"
                  className="form-input"
                  value={edu.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">College / University</label>
                <input
                  type="text"
                  className="form-input"
                  value={edu.college}
                  onChange={(e) => handleEducationChange(index, 'college', e.target.value)}
                  placeholder="e.g. DTU"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Year</label>
                <input
                  type="text"
                  className="form-input"
                  value={edu.year}
                  onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                  placeholder="e.g. 2022 - 2026"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CGPA / Score</label>
                <input
                  type="text"
                  className="form-input"
                  value={edu.cgpa}
                  onChange={(e) => handleEducationChange(index, 'cgpa', e.target.value)}
                  placeholder="e.g. 8.8 CGPA"
                />
              </div>
            </div>

            {educationList.length > 1 && (
              <button type="button" className="btn-logout" style={{ marginTop: '0.5rem' }} onClick={() => removeEducation(index)}>
                ✕ Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addEducation}>
          + Add Education
        </button>
      </div>

      {/* 04. Skills */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>04 Skills *</h3>
          <span className={`section-badge ${isSkillsComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isSkillsComplete ? `✓ ${skillsList.length} Skills` : '→ Min 5 Skills'}
          </span>
        </div>

        {errors.skills && <p className="error-text" style={{ marginBottom: '1rem' }}>{errors.skills}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g. C++, React, MySQL, Python"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(e); }}
          />
          <button type="button" className="btn btn-primary" onClick={handleAddSkill}>
            + Add Skill
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {skillsList.map((skill, index) => (
            <span
              key={index}
              style={{
                backgroundColor: 'var(--soft-mint)',
                color: 'var(--primary-dark-emerald)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid #bbf7d0'
              }}
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-dark-emerald)', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 05. Projects */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>05 Projects *</h3>
          <span className={`section-badge ${isProjectsComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isProjectsComplete ? '✓ Complete' : '→ Required'}
          </span>
        </div>

        {errors.projects && <p className="error-text" style={{ marginBottom: '1rem' }}>{errors.projects}</p>}

        {projectsList.map((proj, index) => (
          <div key={index} style={{ borderBottom: index < projectsList.length - 1 ? '1px solid var(--soft-border)' : 'none', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={proj.title}
                  onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                  placeholder="e.g. Student Resume Optimiser"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Technologies</label>
                <input
                  type="text"
                  className="form-input"
                  value={proj.tech}
                  onChange={(e) => handleProjectChange(index, 'tech', e.target.value)}
                  placeholder="e.g. React, Node.js, Express, MySQL"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <label className="form-label">Project / GitHub Link</label>
              <input
                type="text"
                className="form-input"
                value={proj.link}
                onChange={(e) => handleProjectChange(index, 'link', e.target.value)}
                placeholder="https://github.com/user/project"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="2"
                value={proj.description}
                onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                placeholder="Built full stack web app that analyses student resumes, spots missing skills, and calculates readiness score..."
              ></textarea>
            </div>

            {projectsList.length > 1 && (
              <button type="button" className="btn-logout" style={{ marginTop: '0.5rem' }} onClick={() => removeProject(index)}>
                ✕ Remove Project
              </button>
            )}
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addProject}>
          + Add Project
        </button>
      </div>

      {/* 06. Experience (Optional) */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>06 Work Experience (Optional)</h3>
          <span className={`section-badge ${isExpComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isExpComplete ? '✓ Complete' : '→ Optional'}
          </span>
        </div>

        {experienceList.map((exp, index) => (
          <div key={index} style={{ borderBottom: index < experienceList.length - 1 ? '1px solid var(--soft-border)' : 'none', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company / Org</label>
                <input
                  type="text"
                  className="form-input"
                  value={exp.org}
                  onChange={(e) => handleExperienceChange(index, 'org', e.target.value)}
                  placeholder="e.g. TechCorp Solutions"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={exp.role}
                  onChange={(e) => handleExperienceChange(index, 'role', e.target.value)}
                  placeholder="e.g. Software Engineer Intern"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-input"
                  value={exp.duration}
                  onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                  placeholder="e.g. 3 Months"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="2"
                value={exp.description}
                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                placeholder="Developed frontend interfaces using React and integrated REST APIs..."
              ></textarea>
            </div>

            <button type="button" className="btn-logout" style={{ marginTop: '0.5rem' }} onClick={() => removeExperience(index)}>
              ✕ Remove
            </button>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addExperience}>
          + Add Experience
        </button>
      </div>

      {/* 07. Certifications (Optional) */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>07 Certifications (Optional)</h3>
          <span className={`section-badge ${isCertComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isCertComplete ? '✓ Complete' : '→ Optional'}
          </span>
        </div>

        {certificationsList.map((cert, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              value={cert.name}
              onChange={(e) => handleCertChange(index, 'name', e.target.value)}
              placeholder="Cert Name"
            />
            <input
              type="text"
              className="form-input"
              value={cert.org}
              onChange={(e) => handleCertChange(index, 'org', e.target.value)}
              placeholder="Issuing Org"
            />
            <input
              type="text"
              className="form-input"
              value={cert.year}
              onChange={(e) => handleCertChange(index, 'year', e.target.value)}
              placeholder="Year"
            />
            <button type="button" className="btn-logout" onClick={() => removeCertification(index)}>✕</button>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addCertification}>
          + Add Certification
        </button>
      </div>

      {/* 08. Achievements (Optional) */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>08 Key Achievements (Optional)</h3>
          <span className={`section-badge ${isAchComplete ? 'section-badge-complete' : 'section-badge-pending'}`}>
            {isAchComplete ? '✓ Complete' : '→ Optional'}
          </span>
        </div>

        {achievementsList.map((ach, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              value={ach}
              onChange={(e) => handleAchievementChange(index, e.target.value)}
              placeholder="e.g. 1st Rank in Annual College Hackathon 2025"
            />
            <button type="button" className="btn-logout" onClick={() => removeAchievement(index)}>✕</button>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addAchievement}>
          + Add Achievement
        </button>
      </div>

      {/* Submit Card */}
      <div className="card" style={{ textAlign: 'right' }}>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1.05rem' }} disabled={loading}>
          {loading ? 'Saving Resume...' : isEditing ? 'Save Changes & Update Resume' : '✦ Save Resume'}
        </button>
      </div>
    </form>
  );
};

export default ResumeForm;
