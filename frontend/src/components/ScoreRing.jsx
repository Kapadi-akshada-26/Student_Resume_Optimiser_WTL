import React, { useEffect, useState } from 'react';

export function getBandColor(score) {
  const n = Number(score) || 0;
  if (n >= 75) return '#16A34A';
  if (n >= 50) return '#F59E0B';
  return '#DC2626';
}

export function getScoreBand(score) {
  const n = Number(score) || 0;
  if (n >= 80) return 'Excellent';
  if (n >= 65) return 'Good';
  if (n >= 50) return 'Fair';
  return 'Poor';
}

const ScoreRing = ({ score = 0, size = 168, label = 'ATS score' }) => {
  const [display, setDisplay] = useState(0);
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (clamped / 100) * circ;
  const color = getBandColor(clamped);
  const band = getScoreBand(clamped);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const duration = 800;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (clamped - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 800ms ease, stroke 200ms ease' }}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-number" style={{ color }}>{display}</span>
        <span className="score-label">/ 100</span>
        <span className="score-band" style={{ color }}>{band}</span>
      </div>
      <p className="sr-only" aria-live="polite">
        {label}: {clamped} out of 100, {band}
      </p>
    </div>
  );
};

export default ScoreRing;
