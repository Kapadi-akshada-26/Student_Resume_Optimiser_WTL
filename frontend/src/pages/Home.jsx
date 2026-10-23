import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section with Split Visual Preview */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center', padding: '2.5rem 0' }}>
        <div>
          <span style={{ backgroundColor: 'var(--soft-mint)', color: 'var(--primary-dark-emerald)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block', marginBottom: '1rem' }}>
            🎓 Student Resume Optimiser
          </span>

          <h1 className="hero-title" style={{ textAlign: 'left', fontSize: '2.6rem', lineHeight: 1.2, margin: '0 0 1rem' }}>
            Optimise Your Resume.<br />Make Every Section Count.
          </h1>

          <p className="hero-subtitle" style={{ textAlign: 'left', margin: '0 0 2rem' }}>
            Analyse your existing resume, identify what needs improvement, and present your skills professionally for campus placements and internships.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.6rem' }}>
              Optimise My Resume
            </Link>
            <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '0.75rem 1.6rem' }}>
              How It Works
            </a>
          </div>
        </div>

        {/* Visual Resume Sample & Score Badge */}
        <div style={{ position: 'relative' }}>
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--soft-border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ borderBottom: '2px solid var(--primary-teal)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark-emerald)', margin: 0 }}>RAHUL SHARMA</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Computer Science Student • rahul@college.edu</p>
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--primary-teal)', textTransform: 'uppercase', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>SUMMARY</strong>
              B.Tech CS student skilled in React, Node.js, and SQL...
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--primary-teal)', textTransform: 'uppercase', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>SKILLS</strong>
              C++ • JavaScript • React • Node.js • MySQL
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
              <strong style={{ color: 'var(--primary-teal)', textTransform: 'uppercase', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>PROJECTS</strong>
              Student Resume Optimiser — Full Stack Web App
            </div>
          </div>

          {/* Floating Score Badge */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-15px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--soft-mint)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '280px'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning-amber)', lineHeight: 1 }}>
              82<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Resume Score<br />
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Good start — a few sections can be improved.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{ marginTop: '4rem' }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span style={{ color: 'var(--primary-teal)', fontWeight: 800, fontSize: '0.9rem' }}>01</span>
            <h3 className="feature-title" style={{ marginTop: '0.3rem' }}>Enter Resume Information</h3>
            <p className="feature-desc">Input your existing resume details, education, skills, and projects into the structured editor.</p>
          </div>
          <div className="feature-card">
            <span style={{ color: 'var(--primary-teal)', fontWeight: 800, fontSize: '0.9rem' }}>02</span>
            <h3 className="feature-title" style={{ marginTop: '0.3rem' }}>Analyse & Identify Gaps</h3>
            <p className="feature-desc">Calculate your 100-point score and receive transparent, actionable recommendations.</p>
          </div>
          <div className="feature-card">
            <span style={{ color: 'var(--primary-teal)', fontWeight: 800, fontSize: '0.9rem' }}>03</span>
            <h3 className="feature-title" style={{ marginTop: '0.3rem' }}>Preview & Download PDF</h3>
            <p className="feature-desc">See your formatted resume in a professional template and download a clean PDF document.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
