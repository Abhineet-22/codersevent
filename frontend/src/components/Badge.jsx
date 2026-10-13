import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;
  const s = String(status).toUpperCase();

  let variant = 'badge-slate';
  if (['AVAILABLE', 'GOOD', 'FAIR', 'APPROVED', 'ACTIVE'].includes(s)) {
    variant = 'badge-emerald';
  } else if (['ISSUED', 'OPEN', 'PENDING'].includes(s)) {
    variant = 'badge-blue';
  } else if (['DAMAGED', 'NEEDS_MAINTENANCE', 'MAINTENANCE'].includes(s)) {
    variant = 'badge-amber';
  } else if (['LOST', 'REJECTED', 'OVERDUE'].includes(s)) {
    variant = 'badge-rose';
  } else if (['ADMIN', 'COORDINATOR'].includes(s)) {
    variant = 'badge-purple';
  }

  return (
    <span className={`badge ${variant}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {s.replace(/_/g, ' ')}
    </span>
  );
}

export function RoleBadge({ role }) {
  const r = String(role || '').toUpperCase();
  const colors = {
    ADMIN: 'badge-purple',
    COORDINATOR: 'badge-blue',
    STAFF: 'badge-emerald',
    STUDENT: 'badge-amber',
  };
  return <span className={`badge ${colors[r] || 'badge-slate'}`}>{r}</span>;
}
