import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export function Billing() {
  const { user, logout } = useAuth();
  const [billings, setBillings] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ company: '', month: new Date().toISOString().slice(0, 7), totalAmount: '', paid: false });
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem('auth_token');
      const [bilRes, comRes] = await Promise.all([
        axios.get('http://localhost:3000/api/billing-statements', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/companies', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBillings(bilRes.data || []);
      setCompanies(comRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      showMessage('error', 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/billing-statements', {
        company: form.company,
        startDate: form.month + '-01',
        endDate: form.month + '-31',
        totalAmount: parseFloat(form.totalAmount)
      }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', 'Billing statement created');
      setForm({ company: '', month: new Date().toISOString().slice(0, 7), totalAmount: '', paid: false });
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to create billing statement');
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePaid(id, isPaid) {
    setToggling(id);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`http://localhost:3000/api/billing-statements/${id}`, { isPaid: !isPaid }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', isPaid ? 'Marked as pending' : 'Marked as paid');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to update billing status');
    } finally {
      setToggling(null);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const canEdit = ['software_engineer', 'owner', 'admin'].includes(user?.role);

  const filteredBillings = filterStatus === 'all'
    ? billings
    : filterStatus === 'paid'
    ? billings.filter(b => b.is_paid)
    : billings.filter(b => !b.is_paid);

  const totalAmount = billings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const paidAmount = billings.filter(b => b.is_paid).reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--color-dark)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Eau Cure</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Billing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>{user?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', padding: '24px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/deliveries" className="nav-link">Deliveries</a>
          <a href="/billing" className="nav-link active">Billing</a>
          <a href="/reports" className="nav-link">Reports</a>
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings" className="nav-link">Settings</a>}
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/companies" className="nav-link">Companies</a>}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Message Alert */}
          {message.text && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
              {message.text}
            </div>
          )}

          {/* Stats Overview */}
          {billings.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Total Amount</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  ₱{totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Paid Amount</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-success)' }}>
                  ₱{paidAmount.toFixed(2)}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Pending Amount</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-warning)' }}>
                  ₱{(totalAmount - paidAmount).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          {canEdit && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Create Billing Statement</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="form" style={{ gap: '16px', maxWidth: '600px' }}>
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <select
                      value={form.company}
                      onChange={e => setForm({...form, company: e.target.value})}
                      required
                      className="form-control"
                    >
                      <option value="">Select a company</option>
                      {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Billing Month *</label>
                      <input
                        type="month"
                        value={form.month}
                        onChange={e => setForm({...form, month: e.target.value})}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.totalAmount}
                        onChange={e => setForm({...form, totalAmount: e.target.value})}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Billing Statement'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* List Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Billing Statements <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>({filteredBillings.length})</span>
              </h2>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'white',
                  fontSize: '13px'
                }}
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>Loading billing statements...</p>
                </div>
              ) : filteredBillings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>{filterStatus === 'all' ? 'No billing statements yet' : `No ${filterStatus} billing statements`}</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Period</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        {canEdit && <th style={{ textAlign: 'center' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBillings.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 500 }}>{b.company_name}</td>
                          <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {b.start_date} to {b.end_date}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--color-primary)' }}>
                            ₱{parseFloat(b.total_amount).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge badge-${b.is_paid ? 'success' : 'warning'}`}>
                              {b.is_paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          {canEdit && <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => togglePaid(b.id, b.is_paid)}
                              className={`btn btn-sm ${b.is_paid ? 'btn-secondary' : 'btn-primary'}`}
                              disabled={toggling === b.id}
                            >
                              {toggling === b.id ? 'Updating...' : (b.is_paid ? 'Mark Pending' : 'Mark Paid')}
                            </button>
                          </td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nav-link {
          padding: 10px 12px;
          text-decoration: none;
          color: var(--color-text-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
          display: block;
        }
        .nav-link:hover {
          background: var(--color-background);
        }
        .nav-link.active {
          background: var(--color-primary);
          color: white;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
