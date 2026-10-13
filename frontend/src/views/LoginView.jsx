import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldCheck, Lock, User, Key, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export function LoginView() {
  const { login } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(username, password);
      toast.success(`Welcome back, ${loggedInUser.username}! (${loggedInUser.role})`);
    } catch (err) {
      toast.error(err.message || 'Invalid credentials or account locked');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.15) 0%, rgba(10, 13, 20, 0.95) 70%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
            Dept<span style={{ color: 'var(--primary)' }}>Secure</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Department Inventory & Student Item Issue System
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <User size={14} /> Username
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. admin or enrolment number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Key size={14} /> Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading || !username || !password}
            >
              {loading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  Authenticate & Enter <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              <ShieldAlert size={14} color="var(--primary)" />
              <strong>Zero-Trust Security Controls</strong>
            </div>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Argon2id password hashing with secret pepper</li>
              <li>AES-256-GCM encrypted student PII</li>
              <li>Rate limited & account lockout on failed attempts</li>
              <li>Append-only HMAC tamper-evident audit ledger</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
