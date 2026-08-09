import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export function Deliveries() {
  const { user, logout } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ company: '', quantity: '', date: new Date().toISOString().split('T')[0], location: '', notes: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem('auth_token');
      const [delRes, comRes] = await Promise.all([
        axios.get('http://localhost:3000/api/deliveries', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/companies', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDeliveries(delRes.data || []);
      setCompanies(comRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      showMessage('error', 'Failed to load data');
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
      if (editing) {
        await axios.put(`http://localhost:3000/api/deliveries/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('success', 'Delivery updated successfully');
        setEditing(null);
      } else {
        await axios.post('http://localhost:3000/api/deliveries', form, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('success', 'Delivery added successfully');
      }
      setForm({ company: '', quantity: '', date: new Date().toISOString().split('T')[0], location: '', notes: '' });
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this delivery?')) {
      setDeleting(id);
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`http://localhost:3000/api/deliveries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('success', 'Delivery deleted');
        loadData();
      } catch (err) {
        showMessage('error', err.response?.data?.error || 'Failed to delete');
      } finally {
        setDeleting(null);
      }
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const canEdit = ['software_engineer', 'owner', 'admin'].includes(user?.role);
  const canDelete = ['software_engineer', 'owner'].includes(user?.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--color-dark)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Eau Cure</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Deliveries</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>{user?.username} ({user?.role})</span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', padding: '24px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/deliveries" className="nav-link active">Deliveries</a>
          <a href="/billing" className="nav-link">Billing</a>
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

          {/* Form Card */}
          {canEdit && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{editing ? 'Edit Delivery' : 'New Delivery'}</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="form" style={{ gap: '16px' }}>
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

                  <div className="form-group">
                    <label className="form-label">Quantity (Bottles) *</label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      value={form.quantity}
                      onChange={e => setForm({...form, quantity: e.target.value})}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({...form, date: e.target.value})}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      placeholder="Delivery location"
                      value={form.location}
                      onChange={e => setForm({...form, location: e.target.value})}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      placeholder="Additional notes"
                      value={form.notes}
                      onChange={e => setForm({...form, notes: e.target.value})}
                      className="form-control"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : (editing ? 'Update Delivery' : 'Add Delivery')}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditing(null);
                          setForm({company: '', quantity: '', date: new Date().toISOString().split('T')[0], location: '', notes: ''});
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* List Card */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Deliveries <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>({deliveries.length})</span>
              </h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>Loading deliveries...</p>
                </div>
              ) : deliveries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>No deliveries recorded yet</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Notes</th>
                        {canEdit && <th style={{ textAlign: 'center' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 500 }}>{d.company}</td>
                          <td>{d.bottles_delivered}</td>
                          <td>{new Date(d.timestamp).toLocaleDateString()}</td>
                          <td>{d.location || <span style={{ opacity: 0.5 }}>—</span>}</td>
                          <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{d.notes || <span style={{ opacity: 0.5 }}>—</span>}</td>
                          {canEdit && <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setEditing(d.id);
                                setForm({company: d.company, quantity: d.bottles_delivered, date: d.timestamp.split('T')[0], location: d.location || '', notes: d.notes || ''});
                              }}
                              className="btn btn-sm btn-secondary"
                              style={{ marginRight: '8px' }}
                            >
                              Edit
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(d.id)}
                                className="btn btn-sm btn-danger"
                                disabled={deleting === d.id}
                              >
                                {deleting === d.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
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
