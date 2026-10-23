import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSingleAnalysisApi, runAnalysisApi, downloadResumePdfApi, getSingleResumeApi } from '../services/api';

const AnalysisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reAnalysing, setReAnalysing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError('');
    const res = await getSingleAnalysisApi(id, user.id);
    if (res.success && res.analysis) {
      setAnalysis(res.analysis);
      if (res.analysis.resume_id) {
        const resumeRes = await getSingleResumeApi(res.analysis.resume_id, user.id);
        if (resumeRes.success) setResumeData(resumeRes.resume);
      }
    } else {
      setError(res.message || 'Failed to load analysis details.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [id]);

  const handleReAnalyse = async () => {
    if (!analysis || !analysis.resume_id) return;
    setReAnalysing(true);
    const res = await runAnalysisApi(analysis.resume_id, user.id);
    setReAnalysing(false);
    if (res.success && res.analysis) {
      navigate(`/analysis/${res.analysis.analysis_id}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysis || !analysis.resume_id) return;
    setDownloadingPdf(true);
    const name = resumeData?.personal_info?.full_name || 'Student';
    await downloadResumePdfApi(analysis.resume_id, user.id, name);
    setDownloadingPdf(false);
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p className="feature-title">Analysing resume & calculating score...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 className="feature-title">{error || 'Analysis Report Not Found'}</h3>
        <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>Unable to retrieve requested analysis report.</p>
        <Link to="/my-resumes" className="btn btn-primary">Back to My Resumes</Link>
      </div>
    );
  }

  const { overall_score, section_scores = {}, strengths = [], suggestions = [], summary_text, resume_title, resume_id } = analysis;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--primary-teal)';
    if (score >= 60) return 'var(--warning-amber)';
    return 'var(--error-coral)';
  };

  const sectionLimits = {
    contact_info: { name: 'Contact Information', max: 15 },
    summary: { name: 'Professional Summary', max: 10 },
    education: { name: 'Education', max: 15 },
    skills: { name: 'Skills & Tools', max: 15 },
    projects: { name: 'Projects', max: 20 },
    experience: { name: 'Work Experience', max: 10 },
    certifications: { name: 'Certifications', max: 5 },
    achievements: { name: 'Achievements', max: 5 },
    content_quality: { name: 'Content Quality', max: 5 }
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Resume Analysis Report
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Target: <strong>{resume_title || 'Student Resume'}</strong> | Generated on {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to={`/preview/${resume_id}`} className="btn btn-secondary">
            👁️ Preview Resume
          </Link>

          <Link to={`/optimise?edit=${resume_id}`} className="btn btn-secondary">
            ✏️ Edit Resume
          </Link>

          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? 'Generating PDF...' : '📥 Download PDF'}
          </button>
        </div>
      </div>

      {/* Score Ring Visual Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          OVERALL OPTIMISATION SCORE
        </span>

        <div className="score-circle" style={{ borderColor: getScoreColor(overall_score) }}>
          <span className="score-number" style={{ color: getScoreColor(overall_score) }}>{overall_score}</span>
          <span className="score-label">/ 100</span>
        </div>

        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary-dark-emerald)' }}>
          {summary_text}
        </p>
      </div>

      {/* Section Scores */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Section Scores Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {Object.keys(sectionLimits).map((key) => {
            const score = sectionScores[key] || 0;
            const max = sectionLimits[key].max;
            const percentage = Math.round((score / max) * 100);

            return (
              <div key={key} style={{ background: '#f8faf8', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--soft-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span>{sectionLimits[key].name}</span>
                  <span style={{ color: getScoreColor(percentage) }}>{score} / {max} pts</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: getScoreColor(percentage), transition: 'width 0.4s ease' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Suggestions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Strengths */}
        <div className="card" style={{ borderColor: '#bbf7d0' }}>
          <h2 className="card-title" style={{ color: 'var(--primary-dark-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✓ Key Strengths ({strengths.length})
          </h2>
          {strengths.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {strengths.map((item, index) => (
                <div key={index} style={{ background: 'var(--soft-mint)', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.925rem', color: 'var(--primary-dark-emerald)', fontWeight: 600 }}>
                  ✔ {item}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No key strengths identified yet.</p>
          )}
        </div>

        {/* Actionable Suggestions */}
        <div className="card" style={{ borderColor: '#fde68a' }}>
          <h2 className="card-title" style={{ color: 'var(--warning-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ Suggestions for Improvement ({suggestions.length})
          </h2>
          {suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {suggestions.map((item, index) => (
                <div key={index} style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.925rem', color: '#92400e', fontWeight: 600 }}>
                  📌 {item}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--soft-mint)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary-dark-emerald)', marginTop: '1rem', fontWeight: 600 }}>
              🎉 Excellent job! No major gaps detected in your resume structure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
