import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Page.css';

export function Billing() {
  const { user, logout } = useAuth();
  const [billings, setBillings] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: '', month: new Date().toISOString().slice(0, 7), totalAmount: '', paid: false });

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
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/billing-statements', {
        company: form.company,
        startDate: form.month + '-01',
        endDate: form.month + '-31',
        totalAmount: parseFloat(form.totalAmount)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ company: '', month: new Date().toISOString().slice(0, 7), totalAmount: '', paid: false });
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  }

  async function togglePaid(id, isPaid) {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`http://localhost:3000/api/billing-statements/${id}`, { isPaid: !isPaid }, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const canEdit = ['software_engineer', 'owner', 'admin'].includes(user?.role);

  return (
    <div className="page">
      <nav className="navbar">
        <div><h1>Eau Cure</h1><p>Billing</p></div>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="sidebar">
          <a href="/dashboard">Dashboard</a>
          <a href="/deliveries">Deliveries</a>
          <a href="/billing" className="active">Billing</a>
          <a href="/reports">Reports</a>
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings">Settings</a>}
        </div>

        <div className="main">
          {canEdit && (
            <div className="card">
              <h2>Create Billing Statement</h2>
              <form onSubmit={handleSubmit} className="form">
                <select value={form.company} onChange={e => setForm({...form, company: e.target.value})} required>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="month" value={form.month} onChange={e => setForm({...form, month: e.target.value})} required />
                <input type="number" step="0.01" placeholder="Total Amount" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} required />
                <button type="submit">Create Billing</button>
              </form>
            </div>
          )}

          <div className="card">
            <h2>Billing Statements ({billings.length})</h2>
            {loading ? <p>Loading...</p> : billings.length === 0 ? <p>No billing statements</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                    {canEdit && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {billings.map(b => (
                    <tr key={b.id}>
                      <td>{b.company_name}</td>
                      <td>{b.start_date} to {b.end_date}</td>
                      <td>₱{parseFloat(b.total_amount).toFixed(2)}</td>
                      <td><span className={b.is_paid ? 'paid' : 'pending'}>{b.is_paid ? 'Paid' : 'Pending'}</span></td>
                      {canEdit && <td><button onClick={() => togglePaid(b.id, b.is_paid)}>{b.is_paid ? 'Mark Pending' : 'Mark Paid'}</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
