import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Deliveries.css';

export function Deliveries() {
  const { user, logout } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      if (editing) {
        await axios.put(`http://localhost:3000/api/deliveries/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setEditing(null);
      } else {
        await axios.post('http://localhost:3000/api/deliveries', form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setForm({ company: '', quantity: '', date: new Date().toISOString().split('T')[0], location: '', notes: '' });
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this delivery?')) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`http://localhost:3000/api/deliveries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        loadData();
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
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
    <div className="deliveries">
      <nav className="navbar">
        <div><h1>Eau Cure</h1><p>Deliveries</p></div>
        <div className="user-info">
          <span>{user?.username} ({user?.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="sidebar">
          <a href="/dashboard">Dashboard</a>
          <a href="/deliveries" className="active">Deliveries</a>
          <a href="/billing">Billing</a>
          <a href="/reports">Reports</a>
          {['owner', 'software_engineer', 'admin'].includes(user?.role) && <a href="/companies">Companies</a>}
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings">Settings</a>}
        </div>

        <div className="main">
          {canEdit && (
            <div className="form-card">
              <h2>{editing ? 'Edit Delivery' : 'New Delivery'}</h2>
              <form onSubmit={handleSubmit}>
                <select value={form.company} onChange={e => setForm({...form, company: e.target.value})} required>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                <button type="submit">{editing ? 'Update' : 'Add'} Delivery</button>
                {editing && <button type="button" onClick={() => {setEditing(null); setForm({company: '', quantity: '', date: new Date().toISOString().split('T')[0], location: '', notes: ''});}}>Cancel</button>}
              </form>
            </div>
          )}

          <div className="list-card">
            <h2>Deliveries ({deliveries.length})</h2>
            {loading ? <p>Loading...</p> : deliveries.length === 0 ? <p>No deliveries yet</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Notes</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id}>
                      <td>{d.company}</td>
                      <td>{d.bottles_delivered}</td>
                      <td>{new Date(d.timestamp).toLocaleDateString()}</td>
                      <td>{d.location || '-'}</td>
                      <td>{d.notes || '-'}</td>
                      {canEdit && <td>
                        {canEdit && <button onClick={() => {setEditing(d.id); setForm({company: d.company, quantity: d.bottles_delivered, date: d.timestamp.split('T')[0], location: d.location || '', notes: d.notes || ''});}}>Edit</button>}
                        {canDelete && <button onClick={() => handleDelete(d.id)} className="delete">Delete</button>}
                      </td>}
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
