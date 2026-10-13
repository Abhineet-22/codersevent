import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChangePasswordModal } from './components/ChangePasswordModal';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { IssueDeskView } from './views/IssueDeskView';
import { InventoryView } from './views/InventoryView';
import { RenewalsView } from './views/RenewalsView';
import { StudentsView } from './views/StudentsView';
import { StudentPortalView } from './views/StudentPortalView';
import { ReportsView } from './views/ReportsView';
import { AdminUsersView } from './views/AdminUsersView';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, mustChangePassword, loading, isStudent } = useAuth();
  const [currentTab, setTab] = useState('dashboard');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Loading Splash Screen
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px var(--primary-glow)',
          }}
        >
          <ShieldCheck size={28} color="#fff" />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Verifying security environment...
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Active view renderer
  const renderView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView setTab={setTab} />;
      case 'desk':
        return <IssueDeskView />;
      case 'inventory':
        return <InventoryView />;
      case 'renewals':
        return <RenewalsView />;
      case 'students':
        return <StudentsView />;
      case 'student_portal':
        return <StudentPortalView />;
      case 'reports':
        return <ReportsView />;
      case 'admin_users':
        return <AdminUsersView />;
      default:
        return <DashboardView setTab={setTab} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setTab={setTab} />

      {/* Main Container */}
      <div className="main-content">
        <Navbar onOpenPasswordModal={() => setShowPasswordModal(true)} />
        <main>{renderView()}</main>
      </div>

      {/* Forced Password Change Modal */}
      <ChangePasswordModal
        isOpen={mustChangePassword || showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
