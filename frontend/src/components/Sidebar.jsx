import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  ClockAlert,
  Users,
  FileSpreadsheet,
  ShieldAlert,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const { role, isStaff, isCoordinator, isAdmin, isStudent } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'desk',
      label: 'Issue & Returns',
      icon: ArrowLeftRight,
      visible: isStaff,
      badge: 'Desk',
    },
    {
      id: 'inventory',
      label: 'Inventory & Assets',
      icon: Layers,
      visible: isStaff,
    },
    {
      id: 'renewals',
      label: 'Renewals Hub',
      icon: ClockAlert,
      visible: isStaff,
    },
    {
      id: 'students',
      label: 'Students Directory',
      icon: Users,
      visible: isStaff,
    },
    {
      id: 'student_portal',
      label: 'Student Portal',
      icon: GraduationCap,
      visible: isStudent || isStaff, // Staff can also preview the student self-service flow
      badge: isStudent ? 'Personal' : 'Preview',
    },
    {
      id: 'reports',
      label: 'Audit & Reports',
      icon: FileSpreadsheet,
      visible: isStaff || isAdmin,
    },
    {
      id: 'admin_users',
      label: 'Access Control',
      icon: ShieldAlert,
      visible: isAdmin,
      badge: 'Admin',
    },
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Operations Suite
          </span>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {role} Workspace
        </div>
      </div>

      <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: active ? 'var(--primary-glow)' : 'transparent',
                  border: active ? '1px solid var(--border-accent)' : '1px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <Icon size={18} color={active ? 'var(--primary)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: 'var(--radius-full)',
                      background: active ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          Cryptographic Backend
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)' }}></span>
          HMAC Chain Active
        </div>
      </div>
    </aside>
  );
}
