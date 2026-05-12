import React from 'react';

export const fmtNum = (n, fmt, unit) => {
  if (fmt === 'percent') return `${n}%`;
  if (fmt === 'currency') {
    if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n/1_000).toFixed(1)}k`;
    return `$${n}`;
  }
  if (fmt === 'duration') return `${n}`;
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toLocaleString();
};

export function Sparkline({ data, color = '#7C3AED', height = 28 }) {
  if (!data || !data.length) return null;
  const w = 100, h = 30;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  const lastX = w, lastY = h - ((data[data.length-1] - min) / range) * (h - 2) - 1;
  const gradId = `g-${color.replace('#','')}`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`}/>
      <circle cx={lastX} cy={lastY} r="2" fill={color}/>
    </svg>
  );
}

export const PRIORITY_COLOR = {
  urgent: '#DC2626',
  high:   '#D97706',
  medium: '#2563EB',
  low:    '#94A3B8',
};

export function PriorityDot({ priority }) {
  return (
    <span className="task-priority-dot">
      <span className="task-priority-indicator" style={{ background: PRIORITY_COLOR[priority] }}></span>
      <span style={{ textTransform: 'capitalize' }}>{priority}</span>
    </span>
  );
}

export function TerminalChip({ id, short }) {
  if (!id) return null;
  return <span className="term-tag">{short || id.toUpperCase()}</span>;
}

export function StatusBadge({ status }) {
  const labels = { success: 'Completed', hitl: 'Needs Input', running: 'Running', failed: 'Failed' };
  return <span className={`task-status-badge ${status}`}>{labels[status] || status}</span>;
}
