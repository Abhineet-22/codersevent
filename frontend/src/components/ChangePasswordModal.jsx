import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { KeyRound, ShieldAlert, Lock } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { changePassword, user, logout } = useAuth();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 12) {
      toast.error('New password must be at least 12 characters long');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success('Password updated successfully! Please log in with your new password.');
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ borderColor: 'var(--amber-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--amber-bg)',
                color: 'var(--amber)',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Password Change Required</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Temporary password must be replaced to proceed
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--amber-bg)',
                border: '1px solid var(--amber-border)',
                color: 'var(--amber)',
                fontSize: '0.8125rem',
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Security Policy:</strong> Passwords must be at least 12 characters long and contain both letters and digits.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Old / Temporary Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current temporary password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min 12 chars (letters + numbers)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => logout(false)}
            >
              Log Out Instead
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
