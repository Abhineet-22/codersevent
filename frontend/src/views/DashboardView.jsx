import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  Calendar,
} from 'lucide-react';

export function DashboardView({ setTab }) {
  const { user, isStaff, isStudent } = useAuth();
  const [stockData, setStockData] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (isStaff) {
        const [stock, overdue, upcoming] = await Promise.all([
          api.getStockReport(),
          api.getOverdue(),
          api.getUpcoming(3),
        ]);
        setStockData(stock || []);
        setOverdueList(overdue || []);
        setUpcomingList(upcoming || []);
      } else if (isStudent) {
        const reminders = await api.getMyReminders(3);
        setOverdueList(reminders?.overdue || []);
        setUpcomingList(reminders?.due_soon || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [isStaff, isStudent]);

  // Aggregate totals
  const totals = stockData.reduce(
    (acc, row) => ({
      total: acc.total + (row.total || 0),
      available: acc.available + (row.available || 0),
      issued: acc.issued + (row.issued || 0),
      damaged: acc.damaged + (row.damaged || 0),
      maintenance: acc.maintenance + (row.maintenance || 0),
      overdue: acc.overdue + (row.overdue || 0),
    }),
    { total: 0, available: 0, issued: 0, damaged: 0, maintenance: 0, overdue: 0 }
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Operations Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time stock ledger, active equipment loans, and compliance tracking
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overdue Warning Alert Bar */}
      {overdueList.length > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="var(--rose)" />
            <div>
              <strong style={{ color: 'var(--rose)' }}>Attention: {overdueList.length} Item(s) Overdue</strong>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Students with overdue items are blocked from requesting new equipment until returned.
              </div>
            </div>
          </div>
          {isStaff && (
            <button className="btn btn-danger" onClick={() => setTab('desk')}>
              Review at Desk <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      {isStaff && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span className="form-label">Total Inventory</span>
              <Package size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
              {totals.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Across {stockData.length} registered items
            </div>
          </div>

          <div className="card card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span className="form-label">Available Now</span>
              <CheckCircle2 size={18} color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--emerald)', fontFamily: 'var(--font-display)' }}>
              {totals.available}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Ready for immediate issue
            </div>
          </div>

          <div className="card card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span className="form-label">Currently Issued</span>
              <Clock size={18} color="var(--blue)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--blue)', fontFamily: 'var(--font-display)' }}>
              {totals.issued}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Held by active students
            </div>
          </div>

          <div className="card card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span className="form-label">Overdue Loans</span>
              <AlertTriangle size={18} color="var(--rose)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--rose)', fontFamily: 'var(--font-display)' }}>
              {overdueList.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Exceeded 15-day policy
            </div>
          </div>

          <div className="card card-interactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span className="form-label">Maintenance / Repairs</span>
              <Wrench size={18} color="var(--amber)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--amber)', fontFamily: 'var(--font-display)' }}>
              {totals.maintenance + totals.damaged}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {totals.damaged} damaged, {totals.maintenance} maintenance
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Bar */}
      {isStaff && (
        <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-elevated)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Operational Shortcuts</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => setTab('desk')}>
              <PlusCircle size={16} /> New Item Issue
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('desk')}>
              <FileCheck2 size={16} /> Process Return
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('renewals')}>
              <Calendar size={16} /> Review Renewals
            </button>
            <button className="btn btn-secondary" onClick={() => setTab('inventory')}>
              <Package size={16} /> Manage Inventory
            </button>
          </div>
        </div>
      )}

      {/* Stock Snapshot Table */}
      {isStaff && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Inventory Balance Snapshot</h3>
            <button className="btn btn-secondary" onClick={() => setTab('reports')}>
              Full Stock Ledger <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Item Name</th>
                  <th>Kind</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Issued</th>
                  <th>Overdue</th>
                  <th>Damaged / Maint.</th>
                </tr>
              </thead>
              <tbody>
                {stockData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No items registered yet. Use the Inventory tab to create items.
                    </td>
                  </tr>
                ) : (
                  stockData.map((item) => (
                    <tr key={item.item_id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{item.code}</td>
                      <td>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</div>
                      </td>
                      <td>
                        <StatusBadge status={item.kind} />
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.total}</td>
                      <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{item.available}</td>
                      <td style={{ color: 'var(--blue)' }}>{item.issued}</td>
                      <td style={{ color: item.overdue > 0 ? 'var(--rose)' : 'inherit', fontWeight: item.overdue > 0 ? 700 : 400 }}>
                        {item.overdue}
                      </td>
                      <td>
                        {(item.damaged || 0) + (item.maintenance || 0) > 0 ? (
                          <span style={{ color: 'var(--amber)' }}>
                            {item.damaged} dam / {item.maintenance} maint
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
