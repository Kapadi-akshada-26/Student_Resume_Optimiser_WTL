import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserResumesApi, deleteResumeApi, runAnalysisApi, downloadResumePdfApi } from '../services/api';

const MyResumes = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysingId, setAnalysingId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  const fetchResumes = async () => {
    setLoading(true);
    const res = await getUserResumesApi(user.id);
    if (res.success) {
      setResumes(res.resumes || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleAnalyse = async (resumeId) => {
    setAnalysingId(resumeId);
    const res = await runAnalysisApi(resumeId, user.id);
    setAnalysingId(null);
    if (res.success && res.analysis) {
      navigate(`/analysis/${res.analysis.analysis_id}`);
    } else {
      setAlertMessage(res.message || 'Analysis failed.');
    }
  };

  const handleDownloadPdf = async (resume) => {
    setDownloadingPdfId(resume.resume_id);
    const name = resume.personal_info?.full_name || 'Student';
    await downloadResumePdfApi(resume.resume_id, user.id, name);
    setDownloadingPdfId(null);
  };

  const handleDelete = async (id) => {
    const res = await deleteResumeApi(id, user.id);
    if (res.success) {
      setAlertMessage('Resume deleted successfully!');
      setResumes(resumes.filter(r => r.resume_id !== id));
      setTimeout(() => setAlertMessage(''), 2500);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>My Saved Resumes</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            View formatted templates, edit details, run gap analysis, or download PDFs.
          </p>
        </div>

        <Link to="/optimise" className="btn btn-primary">
          + Create New Resume
        </Link>
      </div>

      {alertMessage && (
        <div className="alert-popup" style={{ marginBottom: '1.5rem' }}>
          ✅ {alertMessage}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="feature-title">Loading your resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
          <h3 className="feature-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Saved Resumes Found</h3>
          <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>
            You have not created any resume profiles yet. Enter your details to generate your first formatted resume.
          </p>
          <Link to="/optimise" className="btn btn-primary">
            + Optimise Your First Resume
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {resumes.map((resume) => (
            <div key={resume.resume_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 className="feature-title" style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
                    {resume.title || 'Student Resume'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#f0fdf4', color: 'var(--primary-color)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                    Saved
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <strong>Student:</strong> {resume.personal_info?.full_name || 'N/A'}
                </p>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <strong>Skills Listed:</strong> {Array.isArray(resume.skills) ? resume.skills.slice(0, 4).join(', ') + (resume.skills.length > 4 ? '...' : '') : 'None'}
                </p>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  📅 Last Updated: {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Link
                  to={`/preview/${resume.resume_id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  👁️ Preview
                </Link>

                <Link
                  to={`/optimise?edit=${resume.resume_id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  ✏️ Edit
                </Link>

                <button
                  className="btn btn-primary"
                  style={{ flex: 1.2, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                  onClick={() => handleAnalyse(resume.resume_id)}
                  disabled={analysingId === resume.resume_id}
                >
                  {analysingId === resume.resume_id ? 'Analysing...' : '📊 Analyse'}
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flex: 1.2, padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                  onClick={() => handleDownloadPdf(resume)}
                  disabled={downloadingPdfId === resume.resume_id}
                >
                  {downloadingPdfId === resume.resume_id ? 'Generating...' : '📥 PDF'}
                </button>

                <button
                  className="btn-logout"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  onClick={() => setDeleteConfirmId(resume.resume_id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', margin: 0, textAlign: 'center' }}>
            <h3 className="card-title">Delete Resume</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this resume profile? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--danger-color)' }}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResumes;
