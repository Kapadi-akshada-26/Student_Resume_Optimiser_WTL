import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { createResumeApi, getSingleResumeApi, updateResumeApi, downloadResumePdfApi, runAnalysisApi } from '../services/api';

const OptimiseResume = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editResumeId = searchParams.get('edit');

  const [initialData, setInitialData] = useState(null);
  const [liveResume, setLiveResume] = useState(null);
  const [savedResumeId, setSavedResumeId] = useState(editResumeId || null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

  // Fetch resume data if in edit mode
  useEffect(() => {
    if (editResumeId) {
      setFetchingData(true);
      getSingleResumeApi(editResumeId, user.id).then(res => {
        setFetchingData(false);
        if (res.success && res.resume) {
          setInitialData(res.resume);
          setLiveResume(res.resume);
          setSavedResumeId(res.resume.resume_id);
        } else {
          setToast({ type: 'error', message: res.message || 'Failed to load resume for editing.' });
        }
      });
    }
  }, [editResumeId, user.id]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setToast({ type: '', message: '' });

    try {
      let res;
      if (savedResumeId) {
        res = await updateResumeApi(savedResumeId, formData, user.id);
        if (res.success) {
          setToast({ type: 'success', message: '✓ Resume updated successfully! Live template updated below.' });
          setInitialData(formData);
        } else {
          setToast({ type: 'error', message: res.message || 'Failed to update resume.' });
        }
      } else {
        res = await createResumeApi(formData, user.id);
        if (res.success && res.resume) {
          setSavedResumeId(res.resume.resume_id);
          setInitialData(formData);
          setToast({ type: 'success', message: '✓ Resume saved successfully!' });
        } else {
          setToast({ type: 'error', message: res.message || 'Failed to save resume.' });
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: 'An unexpected error occurred while saving.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!savedResumeId) return;
    setDownloadingPdf(true);
    const name = liveResume?.personal_info?.full_name || 'Student';
    await downloadResumePdfApi(savedResumeId, user.id, name);
    setDownloadingPdf(false);
  };

  const handleAnalyse = async () => {
    if (!savedResumeId) return;
    setAnalysing(true);
    const res = await runAnalysisApi(savedResumeId, user.id);
    setAnalysing(false);
    if (res.success && res.analysis) {
      navigate(`/analysis/${res.analysis.analysis_id}`);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Build Your Resume
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Add your information and see your professional resume come together in real time.
          </p>
        </div>

        {savedResumeId && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAnalyse} disabled={analysing}>
              {analysing ? 'Analysing...' : '📊 Analyse Resume'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? 'Generating PDF...' : '📥 Download PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div className={`toast-alert ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}

      {/* Split-Screen Layout: Form on Left, Live Preview on Right */}
      <div className="split-screen-layout">
        {/* Left Column: Form */}
        <div>
          {fetchingData ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="feature-title">Loading resume data...</p>
            </div>
          ) : (
            <ResumeForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onChange={setLiveResume}
              loading={loading}
              isEditing={Boolean(savedResumeId)}
            />
          )}
        </div>

        {/* Right Column: Sticky Live Resume Preview */}
        <div className="sticky-preview-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-dark-emerald)', letterSpacing: '0.04em' }}>
              LIVE RESUME PREVIEW
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Updates automatically
            </span>
          </div>

          <ResumePreview resume={liveResume} />
        </div>
      </div>
    </div>
  );
};

export default OptimiseResume;
