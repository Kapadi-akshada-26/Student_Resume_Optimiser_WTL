import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalysisHistoryApi } from '../services/api';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  useEffect(() => {
    getAnalysisHistoryApi(user.id).then(res => {
      if (res.success) {
        setHistory(res.history || []);
      }
      setLoading(false);
    });
  }, [user.id]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Resume Optimisation History</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review your past resume scores, gap evaluations, and suggestion logs over time.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="feature-title">Loading history logs...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
          <h3 className="feature-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Analysis History Found</h3>
          <p className="feature-desc" style={{ marginBottom: '1.5rem' }}>
            You have not run any resume analyses yet. Create or select a resume to calculate your score.
          </p>
          <Link to="/my-resumes" className="btn btn-primary">
            Go to My Resumes
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Resume Title</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Optimisation Score</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Analysis Date</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.analysis_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                      📄 {item.resume_title || 'Student Resume'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        color: getScoreColor(item.overall_score),
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                      }}>
                        {item.overall_score} / 100
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                      📅 {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/analysis/${item.analysis_id}`)}
                      >
                        View Report →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
