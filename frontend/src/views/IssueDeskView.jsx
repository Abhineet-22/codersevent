import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
} from 'lucide-react';

export function IssueDeskView() {
  const toast = useToast();
  const [subTab, setSubTab] = useState('issue'); // 'issue', 'return', 'overdue'

  // Master data
  const [students, setStudents] = useState([]);
  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [openLines, setOpenLines] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Issue Form State
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([{ itemId: '', assetId: '', quantity: 1 }]);
  const [acknowledgement, setAcknowledgement] = useState(null);

  // Return Modal State
  const [selectedReturnLine, setSelectedReturnLine] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnRemarks, setReturnRemarks] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [subTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'issue') {
        const [studRes, itemRes, assetRes] = await Promise.all([
          api.listStudents({ limit: 100 }),
          api.listItems({ limit: 100 }),
          api.listAssets({ status: 'AVAILABLE', limit: 200 }),
        ]);
        setStudents(studRes || []);
        setItems(itemRes || []);
        setAssets(assetRes || []);
      } else if (subTab === 'return') {
        const linesRes = await api.listLines({ open_only: true, limit: 200 });
        setOpenLines(linesRes || []);
      } else if (subTab === 'overdue') {
        const odRes = await api.getOverdue();
        setOverdueItems(odRes || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch desk data');
    } finally {
      setLoading(false);
    }
  };

  // Line item helpers
  const handleAddLine = () => {
    setLines([...lines, { itemId: '', assetId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (index) => {
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    if (field === 'itemId') {
      updated[index].assetId = '';
    }
    setLines(updated);
  };

  // Submit Issue
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      toast.warning('Please select a student');
      return;
    }
    if (!purpose.trim()) {
      toast.warning('Purpose of loan is required');
      return;
    }

    const payloadLines = lines.map((l) => ({
      item_id: parseInt(l.itemId, 10),
      asset_id: l.assetId ? parseInt(l.assetId, 10) : null,
      quantity: parseInt(l.quantity, 10) || 1,
    }));

    setLoading(true);
    try {
      const ack = await api.issueItems({
        student_id: parseInt(studentId, 10),
        purpose: purpose.trim(),
        issue_date: issueDate || null,
        lines: payloadLines,
      });
      setAcknowledgement(ack);
      toast.success(`Items issued successfully! Receipt: ${ack.ack_no}`);
      // Reset form
      setStudentId('');
      setPurpose('');
      setLines([{ itemId: '', assetId: '', quantity: 1 }]);
    } catch (err) {
      toast.error(err.message || 'Issue operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Return
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturnLine) return;

    setLoading(true);
    try {
      await api.returnLine(selectedReturnLine.line_id, {
        quantity: parseInt(returnQty, 10),
        condition: returnCondition,
        remarks: returnRemarks.trim() || null,
      });
      toast.success('Return recorded successfully! Stock balances updated.');
      setSelectedReturnLine(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to record return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Issue & Return Operations Desk</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Loan item tracking, 15-day strict duration policy, and physical condition inspections
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
          <button
            className={`btn ${subTab === 'issue' ? 'btn-primary' : 'btn-icon'}`}
            onClick={() => setSubTab('issue')}
          >
            New Issue
          </button>
          <button
            className={`btn ${subTab === 'return' ? 'btn-primary' : 'btn-icon'}`}
            onClick={() => setSubTab('return')}
          >
            Return Desk
          </button>
          <button
            className={`btn ${subTab === 'overdue' ? 'btn-danger' : 'btn-icon'}`}
            onClick={() => setSubTab('overdue')}
          >
            Overdue Tracker
          </button>
        </div>
      </div>

      {/* SUB-TAB: ISSUE EQUIPMENT */}
      {subTab === 'issue' && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <form onSubmit={handleIssueSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Student Recipient</label>
                <select
                  className="form-select"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Select Registered Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrolment_no}) - {s.programme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Purpose of Issue</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. M.Sc. DFIS Cyber Forensics Lab Practical"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9375rem' }}>Requested Equipment Lines</h4>
                <button type="button" className="btn btn-secondary" onClick={handleAddLine}>
                  <Plus size={14} /> Add Line Item
                </button>
              </div>

              {lines.map((line, index) => {
                const selectedItem = items.find((i) => String(i.id) === String(line.itemId));
                const itemAssets = assets.filter((a) => String(a.item_id) === String(line.itemId));

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 2fr 1fr auto',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: 'var(--bg-elevated)',
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.625rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <select
                        className="form-select"
                        value={line.itemId}
                        onChange={(e) => handleLineChange(index, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">-- Choose Item --</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            [{it.kind}] {it.name} ({it.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      {selectedItem?.kind === 'ASSET' ? (
                        <select
                          className="form-select"
                          value={line.assetId}
                          onChange={(e) => handleLineChange(index, 'assetId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Specific Asset Tag --</option>
                          {itemAssets.map((a) => (
                            <option key={a.id} value={a.id}>
                              Tag: {a.asset_tag} ({a.condition})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                          Bulk item (Quantity tracked)
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max={selectedItem?.kind === 'ASSET' ? 1 : selectedItem?.max_issue_qty || 100}
                        value={selectedItem?.kind === 'ASSET' ? 1 : line.quantity}
                        disabled={selectedItem?.kind === 'ASSET'}
                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={lines.length === 1}
                        onClick={() => handleRemoveLine(index)}
                        style={{ color: 'var(--rose)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-glow)',
                border: '1px solid var(--border-accent)',
                fontSize: '0.8125rem',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Calendar size={16} />
              <span>
                Standard loan period is <strong>15 days</strong>. Due date will be calculated automatically upon submission.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={loading}>
              {loading ? 'Processing Issue Request...' : 'Issue Equipment & Generate Acknowledgement'}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB: RETURN DESK */}
      {subTab === 'return' && (
        <div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line ID</th>
                  <th>Item / Code</th>
                  <th>Asset Tag</th>
                  <th>Issued</th>
                  <th>Returned</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openLines.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No open loans requiring return at this time.
                    </td>
                  </tr>
                ) : (
                  openLines.map((l) => (
                    <tr key={l.line_id}>
                      <td className="mono">#{l.line_id}</td>
                      <td>
                        <strong>{l.item_name}</strong>
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.item_code}</div>
                      </td>
                      <td>{l.asset_tag ? <span className="mono badge badge-purple">{l.asset_tag}</span> : '—'}</td>
                      <td>{l.quantity_issued}</td>
                      <td>{l.quantity_returned}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{l.outstanding}</td>
                      <td style={{ color: l.overdue ? 'var(--rose)' : 'inherit', fontWeight: l.overdue ? 700 : 400 }}>
                        {l.due_date} {l.overdue && `(+${l.overdue_days}d)`}
                      </td>
                      <td>
                        <StatusBadge status={l.overdue ? 'OVERDUE' : l.status} />
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedReturnLine(l);
                            setReturnQty(l.outstanding);
                            setReturnCondition('GOOD');
                            setReturnRemarks('');
                          }}
                        >
                          <RotateCcw size={14} /> Process Return
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: OVERDUE TRACKER */}
      {subTab === 'overdue' && (
        <div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Enrolment</th>
                  <th>Student Name</th>
                  <th>Item & Tag</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Overdue By</th>
                  <th>System Notification</th>
                </tr>
              </thead>
              <tbody>
                {overdueItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--emerald)', padding: '2.5rem' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                      All loans are in compliance! No items currently overdue.
                    </td>
                  </tr>
                ) : (
                  overdueItems.map((od) => (
                    <tr key={od.line_id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{od.enrolment_no}</td>
                      <td><strong>{od.student_name}</strong></td>
                      <td>
                        {od.item} {od.asset_tag && <span className="badge badge-purple">{od.asset_tag}</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{od.outstanding}</td>
                      <td style={{ color: 'var(--rose)' }}>{od.due_date}</td>
                      <td>
                        <span className="badge badge-rose">{od.overdue_days} days</span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                        {od.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACKNOWLEDGEMENT RECEIPT MODAL */}
      {acknowledgement && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="var(--emerald)" />
                <h3>Equipment Issue Acknowledgement</h3>
              </div>
              <span className="mono badge badge-blue">{acknowledgement.ack_no}</span>
            </div>

            <div className="modal-body" id="printable-ack">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Student Name:</div>
                  <strong style={{ fontSize: '0.9375rem' }}>{acknowledgement.student_name}</strong>
                  <div className="mono">{acknowledgement.enrolment_no}</div>
                  <div>{acknowledgement.programme}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Issued By:</div>
                  <strong>{acknowledgement.issued_by}</strong>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Issue Date:</div>
                  <div>{acknowledgement.issue_date}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-label" style={{ marginBottom: '0.5rem' }}>Purpose</div>
                <div style={{ fontSize: '0.875rem' }}>{acknowledgement.purpose}</div>
              </div>

              <div className="form-label" style={{ marginBottom: '0.5rem' }}>Issued Line Items</div>
              <div className="table-wrapper" style={{ marginBottom: '1.25rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Tag</th>
                      <th>Qty</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acknowledgement.lines?.map((ln) => (
                      <tr key={ln.line_id}>
                        <td>{ln.item_name}</td>
                        <td className="mono">{ln.asset_tag || '—'}</td>
                        <td style={{ fontWeight: 700 }}>{ln.quantity_issued}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{ln.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border)',
                  color: 'var(--amber)',
                  fontSize: '0.75rem',
                }}
              >
                <strong>Terms of Issue:</strong> {acknowledgement.note}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
              <button className="btn btn-primary" onClick={() => setAcknowledgement(null)}>
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS RETURN MODAL */}
      {selectedReturnLine && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Record Equipment Return</h3>
              <span className="mono badge badge-blue">Line #{selectedReturnLine.line_id}</span>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700 }}>{selectedReturnLine.item_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Outstanding: <strong>{selectedReturnLine.outstanding} units</strong>
                    {selectedReturnLine.asset_tag && ` | Asset: ${selectedReturnLine.asset_tag}`}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Return Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={selectedReturnLine.outstanding}
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inspected Physical Condition</label>
                  <select
                    className="form-select"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    required
                  >
                    <option value="GOOD">GOOD (Returns to Available stock)</option>
                    <option value="FAIR">FAIR (Usable condition)</option>
                    <option value="DAMAGED">DAMAGED (Routes to Damaged bucket)</option>
                    <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE (Requires servicing)</option>
                    <option value="LOST">LOST (Reported lost by student)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Inspector Remarks (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Notes regarding wear, cable integrity, or inspection observations"
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedReturnLine(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Recording Return...' : 'Confirm Return & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
