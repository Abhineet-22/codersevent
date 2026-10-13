import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

export function ReportsView() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [activeReport, setActiveReport] = useState('stock'); // 'stock', 'transactions', 'audit'
  const [stockData, setStockData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditVerification, setAuditVerification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Transaction Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('');

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'stock') {
        const data = await api.getStockReport();
        setStockData(data || []);
      } else if (activeReport === 'transactions') {
        const data = await api.getTransactionReport({
          date_from: dateFrom || null,
          date_to: dateTo || null,
          programme: filterProgramme || null,
          limit: 300,
        });
        setTransactions(data || []);
      } else if (activeReport === 'audit' && isAdmin) {
        const verifyRes = await api.verifyAuditChain();
        setAuditVerification(verifyRes);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      toast.info('Preparing CSV export...');
      let blob;
      let filename = 'report.csv';
      if (activeReport === 'stock') {
        blob = await api.downloadCsv('stock');
        filename = 'inventory-stock-matrix.csv';
      } else {
        blob = await api.downloadCsv('transactions', {
          date_from: dateFrom || null,
          date_to: dateTo || null,
          programme: filterProgramme || null,
        });
        filename = 'inventory-transactions-ledger.csv';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV downloaded successfully (Formula injection neutralised).');
    } catch (err) {
      toast.error('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Audit & Reporting Suite</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Comprehensive inventory balance sheets, transactional event records, and cryptographic audit proofs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
            <button
              className={`btn ${activeReport === 'stock' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setActiveReport('stock')}
            >
              Stock Ledger
            </button>
            <button
              className={`btn ${activeReport === 'transactions' ? 'btn-primary' : 'btn-icon'}`}
              onClick={() => setActiveReport('transactions')}
            >
              Transaction Log
            </button>
            {isAdmin && (
              <button
                className={`btn ${activeReport === 'audit' ? 'btn-primary' : 'btn-icon'}`}
                onClick={() => setActiveReport('audit')}
              >
                HMAC Audit Proof
              </button>
            )}
          </div>

          {activeReport !== 'audit' && (
            <button className="btn btn-secondary" onClick={handleDownloadCsv}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* STOCK REPORT TAB */}
      {activeReport === 'stock' && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Kind</th>
                <th>Category</th>
                <th>Total Inventory</th>
                <th>Available</th>
                <th>Issued</th>
                <th>Overdue</th>
                <th>Damaged</th>
                <th>Maintenance</th>
                <th>Lost</th>
              </tr>
            </thead>
            <tbody>
              {stockData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No stock data available.
                  </td>
                </tr>
              ) : (
                stockData.map((row) => (
                  <tr key={row.item_id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{row.code}</td>
                    <td><strong>{row.name}</strong></td>
                    <td><StatusBadge status={row.kind} /></td>
                    <td>{row.category}</td>
                    <td style={{ fontWeight: 800 }}>{row.total}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{row.available}</td>
                    <td style={{ color: 'var(--blue)' }}>{row.issued}</td>
                    <td style={{ color: row.overdue > 0 ? 'var(--rose)' : 'inherit', fontWeight: row.overdue > 0 ? 700 : 400 }}>
                      {row.overdue}
                    </td>
                    <td>{row.damaged || 0}</td>
                    <td>{row.maintenance || 0}</td>
                    <td>{row.lost || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTION REPORT TAB */}
      {activeReport === 'transactions' && (
        <div>
          {/* Date & Filter Controls */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0 }}>From:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px' }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0 }}>To:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: '150px' }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <input
              type="text"
              className="form-input"
              style={{ width: '180px' }}
              placeholder="Programme (e.g. M.Sc. DFIS)"
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
            />

            <button className="btn btn-secondary" onClick={loadReport} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Filter Ledger
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event Type</th>
                  <th>Item / Equipment</th>
                  <th>Asset Tag</th>
                  <th>Quantity</th>
                  <th>Student Borrower</th>
                  <th>Enrolment</th>
                  <th>Details</th>
                  <th>Staff Actor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No transaction records match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((ev, i) => (
                    <tr key={i}>
                      <td className="mono">{ev.date}</td>
                      <td>
                        <StatusBadge status={ev.event} />
                      </td>
                      <td><strong>{ev.item}</strong></td>
                      <td className="mono">{ev.asset_tag ? <span className="badge badge-purple">{ev.asset_tag}</span> : '—'}</td>
                      <td style={{ fontWeight: 700 }}>{ev.quantity}</td>
                      <td>{ev.student || <span style={{ color: 'var(--text-muted)' }}>Internal Stock</span>}</td>
                      <td className="mono">{ev.enrolment_no || '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.detail || '—'}</td>
                      <td>{ev.by || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT PROOF TAB (ADMIN ONLY) */}
      {activeReport === 'audit' && isAdmin && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 'var(--radius-lg)',
                  background: auditVerification?.valid ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {auditVerification?.valid ? (
                  <ShieldCheck size={28} color="var(--emerald)" />
                ) : (
                  <AlertTriangle size={28} color="var(--rose)" />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>
                  {auditVerification?.valid ? 'Cryptographic Audit Trail Verified' : 'Integrity Verification Check'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Blockchain-style HMAC-SHA256 block chain covering all historical ledger actions
                </p>
              </div>
            </div>

            {auditVerification ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chain Validation Status:</span>
                    <strong style={{ color: auditVerification.valid ? 'var(--emerald)' : 'var(--rose)' }}>
                      {auditVerification.valid ? 'PASSED (Zero Tampering Detected)' : 'CORRUPTED / TAMPERED'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sequential Blocks Checked:</span>
                    <strong className="mono">{auditVerification.checked} entries verified</strong>
                  </div>

                  {!auditVerification.valid && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--rose)' }}>
                      <span>Chain Broken At Record ID:</span>
                      <strong className="mono">#{auditVerification.broken_at_id}</strong>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--blue-bg)',
                    border: '1px solid var(--blue-border)',
                    fontSize: '0.8125rem',
                    color: 'var(--blue)',
                    lineHeight: 1.6,
                  }}
                >
                  <strong>How Verification Works:</strong> Each entry's HMAC signature binds the previous row's cryptographic digest together with timestamp, actor ID, action name, target entity, detail JSON, and client IP. Database triggers prevent SQL update/delete operations, guaranteeing repudiation resistance.
                </div>

                <button className="btn btn-primary" onClick={loadReport} disabled={loading} style={{ alignSelf: 'flex-start' }}>
                  <RefreshCw size={15} /> Re-Verify Entire Chain Now
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                Verifying cryptographic integrity...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
