import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

export function StudentPortalView() {
  const { user, isStudent } = useAuth();
  const toast = useToast();

  const [myIssues, setMyIssues] = useState([]);
  const [myRenewals, setMyRenewals] = useState([]);
  const [reminders, setReminders] = useState({ overdue: [], due_soon: [] });
  const [loading, setLoading] = useState(false);

  // Request Renewal Modal
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedLineForRenewal, setSelectedLineForRenewal] = useState(null);
  const [renewalReason, setRenewalReason] = useState('');

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [issuesRes, renewalsRes, remRes] = await Promise.all([
        api.getMyIssues(),
        api.getMyRenewals(),
        api.getMyReminders(3),
      ]);
      setMyIssues(issuesRes || []);
      setMyRenewals(renewalsRes || []);
      setReminders(remRes || { overdue: [], due_soon: [] });
    } catch (err) {
      toast.error(err.message || 'Failed to load student portal records');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLineForRenewal) return;

    setLoading(true);
    try {
      await api.requestRenewal({
        line_id: selectedLineForRenewal.line_id,
        reason: renewalReason.trim() || null,
      });
      toast.success('Renewal request submitted for coordinator review!');
      setShowRenewalModal(false);
      setRenewalReason('');
      setSelectedLineForRenewal(null);
      loadStudentData();
    } catch (err) {
      toast.error(err.message || 'Renewal request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Student Self-Service Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage your active equipment loans, review due dates, and petition for renewals
          </p>
        </div>
      </div>

      {/* Reminders Banners */}
      {reminders.overdue?.length > 0 && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', color: 'var(--rose)', fontWeight: 700 }}>
            <AlertTriangle size={18} /> Overdue Item Notice
          </div>
          {reminders.overdue.map((msg, i) => (
            <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginLeft: '1.625rem' }}>
              • {msg}
            </div>
          ))}
        </div>
      )}

      {reminders.due_soon?.length > 0 && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', color: 'var(--amber)', fontWeight: 700 }}>
            <Clock size={18} /> Upcoming Return Reminder
          </div>
          {reminders.due_soon.map((msg, i) => (
            <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginLeft: '1.625rem' }}>
              • {msg}
            </div>
          ))}
        </div>
      )}

      {/* Active Loans Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Equipment Issued to You</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Asset Tag</th>
                <th>Quantity</th>
                <th>Due Date</th>
                <th>Renewals Used</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    You currently have no open equipment loans.
                  </td>
                </tr>
              ) : (
                myIssues.map((line) => (
                  <tr key={line.line_id}>
                    <td>
                      <strong>{line.item_name}</strong>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{line.item_code}</div>
                    </td>
                    <td className="mono">{line.asset_tag ? <span className="badge badge-purple">{line.asset_tag}</span> : 'Bulk Item'}</td>
                    <td style={{ fontWeight: 700 }}>{line.outstanding} unit(s)</td>
                    <td style={{ color: line.overdue ? 'var(--rose)' : 'var(--primary)', fontWeight: 700 }}>
                      {line.due_date} {line.overdue && `(Overdue by ${line.overdue_days} days)`}
                    </td>
                    <td>{line.renewals_used} / 2 allowed</td>
                    <td>
                      <StatusBadge status={line.overdue ? 'OVERDUE' : line.status} />
                    </td>
                    <td>
                      {line.pending_renewal ? (
                        <span className="badge badge-amber">Renewal Pending</span>
                      ) : line.overdue ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>Return Required</span>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedLineForRenewal(line);
                            setShowRenewalModal(true);
                          }}
                        >
                          <RotateCcw size={13} /> Request Renewal
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Requests History */}
      <div>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Your Renewal Requests</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Date Requested</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Coordinator Remarks</th>
                <th>Extended Due Date</th>
              </tr>
            </thead>
            <tbody>
              {myRenewals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No renewal requests submitted yet.
                  </td>
                </tr>
              ) : (
                myRenewals.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.item_name}</strong></td>
                    <td>{r.requested_on}</td>
                    <td style={{ maxWidth: '240px', color: 'var(--text-secondary)' }}>{r.reason || '—'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.remarks || '—'}</td>
                    <td className="mono" style={{ color: r.revised_due ? 'var(--emerald)' : 'inherit', fontWeight: r.revised_due ? 700 : 400 }}>
                      {r.revised_due || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENEWAL REQUEST MODAL */}
      {showRenewalModal && selectedLineForRenewal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Request 15-Day Renewal</h3>
            </div>
            <form onSubmit={handleRenewalSubmit}>
              <div className="modal-body">
                <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700 }}>{selectedLineForRenewal.item_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Current Due Date: <strong style={{ color: 'var(--primary)' }}>{selectedLineForRenewal.due_date}</strong>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--blue-bg)',
                    border: '1px solid var(--blue-border)',
                    fontSize: '0.8125rem',
                    color: 'var(--blue)',
                    marginBottom: '1rem',
                  }}
                >
                  Submitting this request will not alter your due date until explicitly reviewed and approved by the department coordinator.
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Extension</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe project requirements or ongoing experiments necessitating extension..."
                    value={renewalReason}
                    onChange={(e) => setRenewalReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenewalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
