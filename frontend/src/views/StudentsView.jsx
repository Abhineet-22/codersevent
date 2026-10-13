import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/Badge';
import {
  Users,
  UserPlus,
  Search,
  Key,
  Copy,
  Check,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

export function StudentsView() {
  const { isCoordinator } = useAuth();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [enrolmentSearch, setEnrolmentSearch] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');

  // Register Student Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    enrolment_no: '',
    name: '',
    programme: 'M.Sc. DFIS',
    semester: 1,
    email: '',
    phone: '',
  });

  // Generated Credential Modal
  const [createdStudentData, setCreatedStudentData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [programmeFilter]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.listStudents({
        programme: programmeFilter || null,
        enrolment_no: enrolmentSearch.trim() || null,
        limit: 100,
      });
      setStudents(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.createStudent({
        enrolment_no: formData.enrolment_no.trim().toUpperCase(),
        name: formData.name.trim(),
        programme: formData.programme.trim(),
        semester: parseInt(formData.semester, 10),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
      });

      toast.success('Student registered successfully!');
      setShowModal(false);
      setCreatedStudentData(result);
      setFormData({
        enrolment_no: '',
        name: '',
        programme: 'M.Sc. DFIS',
        semester: 1,
        email: '',
        phone: '',
      });
      loadStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudentData) return;
    const text = `DeptSecure Student Login:\nUsername: ${createdStudentData.username}\nTemporary Password: ${createdStudentData.temporary_password}\n(You will be required to change this upon first login.)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Students Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Registered student borrowers. PII is encrypted at rest (AES-256-GCM) with blind HMAC indexing.
          </p>
        </div>

        {isCoordinator && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={16} /> Register Student
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by exact Enrolment No (blind index lookup)..."
            value={enrolmentSearch}
            onChange={(e) => setEnrolmentSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '200px' }}
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
        >
          <option value="">All Programmes</option>
          <option value="M.Sc. DFIS">M.Sc. DFIS</option>
          <option value="B.Tech. CSE">B.Tech. CSE</option>
          <option value="M.Tech. Cyber Security">M.Tech. Cyber Security</option>
        </select>

        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {/* Students Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Enrolment No</th>
              <th>Full Name</th>
              <th>Programme</th>
              <th>Semester</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td className="mono">#{s.id}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.enrolment_no}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <GraduationCap size={15} color="var(--text-muted)" />
                      {s.programme}
                    </div>
                  </td>
                  <td>Sem {s.semester}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                  <td className="mono">{s.phone || '—'}</td>
                  <td>
                    <StatusBadge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REGISTER STUDENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Student & Generate Credentials</h3>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Enrolment Number</label>
                    <input
                      type="text"
                      className="form-input mono"
                      placeholder="e.g. ENR2026101"
                      value={formData.enrolment_no}
                      onChange={(e) => setFormData({ ...formData, enrolment_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alex Johnson"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Programme</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. M.Sc. DFIS"
                      value={formData.programme}
                      onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="12"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@university.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+919876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
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
                  }}
                >
                  <ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  A random 16-character temporary password will be generated for student portal access.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED CREDENTIAL DISPLAY MODAL */}
      {createdStudentData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--emerald)" />
                <h3>Temporary Credentials Issued</h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Provide these credentials to the student. They will be prompted to replace the temporary password on first login.
              </p>

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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Name:</div>
                  <strong style={{ fontSize: '1rem' }}>{createdStudentData.student?.name}</strong>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Username:</div>
                  <div className="mono" style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {createdStudentData.username}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temporary Password:</div>
                  <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '0.05em' }}>
                    {createdStudentData.temporary_password}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '0.75rem' }}
                onClick={handleCopyCredentials}
              >
                {copied ? <Check size={16} color="var(--emerald)" /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Login Details'}
              </button>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setCreatedStudentData(null)}>
                Done & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
