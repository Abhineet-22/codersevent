import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './Badge';
import { api } from '../api';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  LogOut, 
  Activity, 
  KeyRound,
  User as UserIcon
} from 'lucide-react';

export function Navbar({ onOpenPasswordModal }) {
  const { user, logout, role } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('dept_theme') || 'dark');
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dept_theme', theme);
  }, [theme]);

  // Periodic health check
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await api.getHealth();
        if (mounted) setServerOnline(true);
      } catch {
        if (mounted) setServerOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid var(--border-accent)',
              display: 'flex',
            }}
          >
            <ShieldCheck size={22} color="var(--primary)" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>
              Dept<span style={{ color: 'var(--primary)' }}>Secure</span>
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              Inventory & Issue Portal
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            background: serverOnline ? 'var(--emerald-bg)' : 'var(--rose-bg)',
            color: serverOnline ? 'var(--emerald)' : 'var(--rose)',
            fontSize: '0.6875rem',
            fontWeight: 600,
          }}
        >
          <Activity size={12} />
          {serverOnline ? 'Backend Online' : 'Connecting...'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.username}
                <RoleBadge role={role} />
              </div>
            </div>

            <button
              className="btn-icon"
              onClick={onOpenPasswordModal}
              title="Change Password"
              style={{ marginLeft: '0.25rem' }}
            >
              <KeyRound size={16} />
            </button>

            <button
              className="btn-icon"
              onClick={() => logout(false)}
              title="Sign Out"
              style={{ color: 'var(--rose)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
