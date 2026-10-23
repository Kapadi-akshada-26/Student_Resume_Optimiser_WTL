import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ResumePreview from '../components/ResumePreview';
import { getSingleResumeApi, downloadResumePdfApi, runAnalysisApi } from '../services/api';

const PreviewResumePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  useEffect(() => {
    setLoading(true);
    getSingleResumeApi(id, user.id).then((res) => {
      if (res.success && res.resume) {
        setResume(res.resume);
      } else {
        setError(res.message || 'Failed to load resume preview.');
      }
      setLoading(false);
    });
  }, [id, user.id]);

  const handleDownloadPdf = async () => {
    if (!resume) return;
    setDownloadingPdf(true);
    const name = resume.personal_info?.full_name || 'Student';
    await downloadResumePdfApi(id, user.id, name);
    setDownloadingPdf(false);
  };

  const handleAnalyse = async () => {
    if (!resume) return;
    setAnalysing(true);
    const res = await runAnalysisApi(id, user.id);
    setAnalysing(false);
    if (res.success && res.analysis) {
      navigate(`/analysis/${res.analysis.analysis_id}`);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <p className="feature-title">Loading Resume Preview...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 className="feature-title">{error || 'Resume Not Found'}</h3>
        <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>Unable to preview requested resume.</p>
        <Link to="/my-resumes" className="btn btn-primary">Back to My Resumes</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Action Bar */}
      <div className="preview-action-bar">
        <div>
          <h1 className="card-title" style={{ fontSize: '1.5rem', margin: 0 }}>
            {resume.title || 'Student Resume Preview'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Last updated: {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="preview-action-buttons">
          <Link to={`/optimise?edit=${id}`} className="btn btn-secondary">
            ✏️ Edit Resume
          </Link>

          <button className="btn btn-secondary" onClick={handleAnalyse} disabled={analysing}>
            {analysing ? 'Analysing...' : '📊 Analyse Resume'}
          </button>

          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? 'Generating PDF...' : '📥 Download Resume PDF'}
          </button>
        </div>
      </div>

      {/* Main Resume Paper Component */}
      <ResumePreview resume={resume} />
    </div>
  );
};

export default PreviewResumePage;
