import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  ClockAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

export function RenewalsView() {
  const { isCoordinator } = useAuth();
  const toast = useToast();

  const [renewals, setRenewals] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Decision modal state
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [decisionApprove, setDecisionApprove] = useState(true);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadRenewals();
  }, [filterStatus]);

  const loadRenewals = async () => {
    setLoading(true);
    try {
      const data = await api.listRenewals({
        status: filterStatus || null,
        limit: 100,
      });
      setRenewals(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load renewal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRenewal) return;

    if (!decisionApprove && !remarks.trim()) {
      toast.warning('Remarks are required when rejecting a renewal request');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.decideRenewal(selectedRenewal.id, {
        approve: decisionApprove,
        remarks: remarks.trim() || null,
      });
      toast.success(
        decisionApprove
          ? `Renewal approved! Due date extended to ${updated.revised_due}`
          : 'Renewal request rejected.'
      );
      setSelectedRenewal(null);
      setRemarks('');
      loadRenewals();
    } catch (err) {
      toast.error(err.message || 'Failed to process decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Renewals Decision Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Review loan extension petitions. Approved renewals extend the existing due date by exactly 15 days.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: '160px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING Only</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Item / Asset</th>
              <th>Requested On</th>
              <th>Student Reason</th>
              <th>Current Due</th>
              <th>Revised Due</th>
              <th>Status</th>
              {isCoordinator && <th>Decision</th>}
            </tr>
          </thead>
          <tbody>
            {renewals.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  No renewal requests found.
                </td>
              </tr>
            ) : (
              renewals.map((r) => (
                <tr key={r.id}>
                  <td className="mono">#{r.id}</td>
                  <td>
                    <strong>{r.item_name}</strong>
                    {r.asset_tag && <span className="mono badge badge-purple" style={{ marginLeft: '6px' }}>{r.asset_tag}</span>}
                  </td>
                  <td>{r.requested_on}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '240px' }}>
                    {r.reason || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None specified</span>}
                  </td>
                  <td className="mono">{r.previous_due || '—'}</td>
                  <td className="mono" style={{ color: r.revised_due ? 'var(--emerald)' : 'inherit', fontWeight: r.revised_due ? 700 : 400 }}>
                    {r.revised_due || '—'}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  {isCoordinator && (
                    <td>
                      {r.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setSelectedRenewal(r);
                              setDecisionApprove(true);
                              setRemarks('Approved for extended lab practical work');
                            }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setSelectedRenewal(r);
                              setDecisionApprove(false);
                              setRemarks('');
                            }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.remarks || 'Decided'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DECISION MODAL */}
      {selectedRenewal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>
                {decisionApprove ? 'Approve Renewal Request' : 'Reject Renewal Request'}
              </h3>
              <span className="mono badge badge-blue">#{selectedRenewal.id}</span>
            </div>

            <form onSubmit={handleDecisionSubmit}>
              <div className="modal-body">
                <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 700 }}>{selectedRenewal.item_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Reason: <em>"{selectedRenewal.reason || 'No reason provided'}"</em>
                  </div>
                </div>

                {decisionApprove ? (
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--emerald-bg)',
                      border: '1px solid var(--emerald-border)',
                      color: 'var(--emerald)',
                      fontSize: '0.8125rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong>Policy Rule:</strong> Approval extends the due date by <strong>+15 days</strong> from the existing deadline.
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--rose-bg)',
                      border: '1px solid var(--rose-border)',
                      color: 'var(--rose)',
                      fontSize: '0.8125rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong>Mandatory:</strong> Please provide explanatory remarks explaining why the renewal is denied.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{decisionApprove ? 'Coordinator Remarks (Optional)' : 'Rejection Reason (Required)'}</label>
                  <textarea
                    className="form-textarea"
                    placeholder={decisionApprove ? 'e.g. Approved for semester project' : 'e.g. Item required for upcoming exam practicals'}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required={!decisionApprove}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRenewal(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={decisionApprove ? 'btn btn-success' : 'btn btn-danger'}
                  disabled={loading}
                >
                  {decisionApprove ? 'Confirm Approval (+15 Days)' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
