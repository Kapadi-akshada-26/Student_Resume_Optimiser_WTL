import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserResumesApi, getAnalysisHistoryApi, runAnalysisApi } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysingId, setAnalysingId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Student', id: 1 };

  useEffect(() => {
    Promise.all([
      getUserResumesApi(user.id),
      getAnalysisHistoryApi(user.id)
    ]).then(([resumesRes, historyRes]) => {
      if (resumesRes.success) setResumes(resumesRes.resumes || []);
      if (historyRes.success) setHistory(historyRes.history || []);
      setLoading(false);
    });
  }, [user.id]);

  const handleAnalyseResume = async (resumeId) => {
    setAnalysingId(resumeId);
    const res = await runAnalysisApi(resumeId, user.id);
    setAnalysingId(null);
    if (res.success && res.analysis) {
      navigate(`/analysis/${res.analysis.analysis_id}`);
    }
  };

  const latestScore = history.length > 0 ? history[0].overall_score : null;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
          Good morning, {user.name} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Keep improving your resume and make every section count.
        </p>
      </div>

      {/* Real Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Resumes */}
        <div className="card" style={{ margin: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL RESUMES</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-dark-emerald)', margin: '0.2rem 0' }}>
            {loading ? '...' : resumes.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary-teal)', fontWeight: 600 }}>Active saved profiles</span>
        </div>

        {/* Analysed Resumes */}
        <div className="card" style={{ margin: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ANALYSED RESUMES</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-dark-emerald)', margin: '0.2rem 0' }}>
            {loading ? '...' : history.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary-teal)', fontWeight: 600 }}>Total gap evaluations run</span>
        </div>

        {/* Latest Score */}
        <div className="card" style={{ margin: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LATEST SCORE</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: latestScore !== null ? (latestScore >= 80 ? 'var(--success-green)' : 'var(--warning-amber)') : 'var(--text-muted)', margin: '0.2rem 0' }}>
            {latestScore !== null ? `${latestScore}/100` : 'N/A'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {latestScore !== null ? 'Based on latest analysis' : 'No analysis run yet'}
          </span>
        </div>
      </div>

      {/* Prominent Action Card */}
      <div className="card" style={{ backgroundColor: 'var(--soft-mint)', borderColor: '#bbf7d0', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark-emerald)', margin: 0 }}>Continue Your Resume</h3>
          <p style={{ color: 'var(--secondary-color)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>Add or edit information to keep your resume profile up to date.</p>
        </div>

        <Link to="/optimise" className="btn btn-primary">
          ✦ Optimise Resume
        </Link>
      </div>

      {/* Recent Resumes */}
      <div className="card">
        <h2 className="card-title">Recent Resumes</h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading recent resumes...</p>
        ) : resumes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
            <p className="feature-title" style={{ marginBottom: '0.5rem' }}>No resumes yet</p>
            <p className="feature-desc" style={{ marginBottom: '1.25rem' }}>Create your first resume profile and start optimising it.</p>
            <Link to="/optimise" className="btn btn-primary">Create Resume</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {resumes.map((r) => (
              <div key={r.resume_id} style={{ background: '#f8faf8', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--soft-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark-emerald)' }}>📄 {r.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Updated: {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/preview/${r.resume_id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    👁️ Preview
                  </Link>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    onClick={() => handleAnalyseResume(r.resume_id)}
                    disabled={analysingId === r.resume_id}
                  >
                    {analysingId === r.resume_id ? 'Analysing...' : '📊 Analyse'}
                  </button>

                  <Link to={`/optimise?edit=${r.resume_id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    ✏️ Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
