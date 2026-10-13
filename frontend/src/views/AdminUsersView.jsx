import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { RoleBadge, StatusBadge } from '../components/Badge';
import {
  ShieldAlert,
  UserPlus,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  History,
} from 'lucide-react';

export function AdminUsersView() {
  const { user } = useAuth();
  const toast = useToast();

  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [subTab, setSubTab] = useState('users'); // 'users', 'logs'
  const [loading, setLoading] = useState(false);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    role: 'STAFF',
    password: '',
  });

  // Credential Display Modal
  const [tempCredData, setTempCredData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'users') {
        const u = await api.listUsers({ limit: 100 });
        setUsersList(u || []);
      } else {
        const logs = await api.getAuditLogs({ limit: 100 });
        setAuditLogs(logs || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createUser({
        username: createForm.username.trim().toLowerCase(),
        role: createForm.role,
        password: createForm.password.trim() || null,
      });
      toast.success('User created successfully!');
      setShowCreateModal(false);
      setTempCredData(res);
      setCreateForm({ username: '', role: 'STAFF', password: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockUser = async (targetUser) => {
    try {
      await api.patchUser(targetUser.id, { unlock: true });
      toast.success(`Account for ${targetUser.username} unlocked!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to unlock user');
    }
  };

  const handleToggleActive = async (targetUser) => {
    try {
      const newState = !targetUser.is_active;
      await api.patchUser(targetUser.id, { is_active: newState });
      toast.success(
        newState
          ? `User ${targetUser.username} activated.`
          : `User ${targetUser.username} deactivated. Active tokens revoked immediately.`
      );
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (targetUser) => {
    if (!window.confirm(`Reset password for ${targetUser.username}? A new temporary password will be generated.`)) {
      return;
    }
    try {
      const res = await api.resetPassword(targetUser.id);
      setTempCredData(res);
      toast.success('Password reset! Active sessions invalidated.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Access Control & Security Administration</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Staff account provisioning, emergency account lockouts, and raw tamper-evident audit ledger
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
            <button
              className={`btn ${subTab === 'users' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setSubTab('users')}
            >
              Staff Users
            </button>
            <button
              className={`btn ${subTab === 'logs' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setSubTab('logs')}
            >
              Raw Audit Ledger
            </button>
          </div>

          {subTab === 'users' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <UserPlus size={16} /> Provision User
            </button>
          )}
        </div>
      </div>

      {/* USERS TAB */}
      {subTab === 'users' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>Must Change PW</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td className="mono">#{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    {u.must_change_password ? (
                      <span className="badge badge-amber">Temporary PW</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Standard</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={u.is_active ? 'ACTIVE' : 'DEACTIVATED'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleResetPassword(u)}
                        title="Generate temporary password"
                      >
                        <Key size={13} /> Reset PW
                      </button>

                      <button
                        className={`btn ${u.is_active ? 'btn-secondary' : 'btn-success'}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === user?.id} // Don't deactivate self
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleUnlockUser(u)}
                        title="Clear lockout timer"
                      >
                        <Unlock size={13} /> Unlock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {subTab === 'logs' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Block #</th>
                <th>Timestamp (UTC)</th>
                <th>Action</th>
                <th>Actor Role</th>
                <th>Entity Target</th>
                <th>IP Address</th>
                <th>HMAC Hash Digest</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="mono">#{log.id}</td>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{log.ts}</td>
                  <td><span className="badge badge-blue">{log.action}</span></td>
                  <td><RoleBadge role={log.role || 'SYSTEM'} /></td>
                  <td>
                    {log.entity} {log.entity_id && `#${log.entity_id}`}
                  </td>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{log.ip || '127.0.0.1'}</td>
                  <td className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }} title={log.hash}>
                    {log.hash ? `${log.hash.substring(0, 16)}...` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PROVISION USER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Provision Operator Account</h3>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. coord_physics or staff_john"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select
                    className="form-select"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Issue, return, view inventory)</option>
                    <option value="COORDINATOR">COORDINATOR (Catalog, approvals, policy)</option>
                    <option value="ADMIN">ADMIN (Full system access)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Custom Password (Optional)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Leave empty for auto-generated temporary password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    If omitted, a secure 16-character temporary password is generated.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIAL DISPLAY MODAL */}
      {tempCredData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--emerald)" />
                <h3>Operator Credentials Ready</h3>
              </div>
            </div>

            <div className="modal-body">
              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-accent)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username:</div>
                  <strong className="mono" style={{ fontSize: '1.0625rem' }}>{tempCredData.user?.username}</strong>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temporary Password:</div>
                  <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '0.05em' }}>
                    {tempCredData.temporary_password}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `DeptSecure Login Credentials:\nUsername: ${tempCredData.user?.username}\nPassword: ${tempCredData.temporary_password}`
                  );
                  setCopied(true);
                  toast.success('Copied to clipboard!');
                  setTimeout(() => setCopied(false), 3000);
                }}
              >
                {copied ? <Check size={16} color="var(--emerald)" /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setTempCredData(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
