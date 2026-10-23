import React, { useState, useEffect } from 'react';
import { getUserResumesApi, getAnalysisHistoryApi } from '../services/api';

const Profile = () => {
  const [stats, setStats] = useState({ resumesCount: 0, analysisCount: 0, latestScore: 'N/A' });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Student', email: 'student@college.edu', id: 1 };

  useEffect(() => {
    Promise.all([
      getUserResumesApi(user.id),
      getAnalysisHistoryApi(user.id)
    ]).then(([resumesRes, historyRes]) => {
      const resumes = resumesRes.resumes || [];
      const history = historyRes.history || [];

      setStats({
        resumesCount: resumes.length,
        analysisCount: history.length,
        latestScore: history.length > 0 ? `${history[0].overall_score} / 100` : 'N/A'
      });
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Student Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your account information and view your activity summary.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Info Card */}
        <div className="card">
          <h2 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            👤 Personal Details
          </h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>FULL NAME</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>EMAIL ADDRESS</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.email}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>COURSE / SPECIALIZATION</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>B.Tech Computer Science / Engineering</span>
            </div>
          </div>
        </div>

        {/* Activity Summary Card */}
        <div className="card">
          <h2 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            📊 Activity Statistics
          </h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Saved Resume Profiles</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                {loading ? '...' : stats.resumesCount}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Completed Analyses</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                {loading ? '...' : stats.analysisCount}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Latest Optimisation Score</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#16a34a' }}>
                {loading ? '...' : stats.latestScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
