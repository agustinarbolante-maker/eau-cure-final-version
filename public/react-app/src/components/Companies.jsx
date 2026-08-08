import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Companies.css';

export function Companies() {
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', unit_price: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ unit_price: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get('http://localhost:3000/api/companies/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCompany(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.unit_price) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/companies', {
        name: form.name.trim(),
        unit_price: parseFloat(form.unit_price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ name: '', unit_price: '' });
      loadCompanies();
    } catch (err) {
      alert('Error adding company: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleEditCompany(e) {
    e.preventDefault();
    if (!editForm.unit_price) {
      alert('Please enter unit price');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`http://localhost:3000/api/companies/${editing}`, {
        unit_price: parseFloat(editForm.unit_price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(null);
      setEditForm({ unit_price: '' });
      loadCompanies();
    } catch (err) {
      alert('Error updating company: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleDeleteCompany(name) {
    if (window.confirm(`Delete company "${name}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`http://localhost:3000/api/companies/${name}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadCompanies();
      } catch (err) {
        alert('Error deleting company: ' + (err.response?.data?.error || err.message));
      }
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  const canCreate = ['software_engineer', 'owner', 'admin'].includes(user?.role);
  const canEdit = ['software_engineer', 'owner'].includes(user?.role);
  const canDelete = ['software_engineer', 'owner'].includes(user?.role);

  return (
    <div className="companies">
      <nav className="navbar">
        <div><h1>Eau Cure</h1><p>Companies</p></div>
        <div className="user-info">
          <span>{user?.username} ({user?.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="sidebar">
          <a href="/dashboard">Dashboard</a>
          <a href="/deliveries">Deliveries</a>
          <a href="/billing">Billing</a>
          <a href="/reports">Reports</a>
          <a href="/companies" className="active">Companies</a>
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings">Settings</a>}
        </div>

        <div className="main">
          {canCreate && (
            <div className="form-card">
              <h2>Add New Company</h2>
              <form onSubmit={handleAddCompany}>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  step="0.01"
                  min="0"
                  value={form.unit_price}
                  onChange={e => setForm({...form, unit_price: e.target.value})}
                  required
                />
                <button type="submit">Add Company</button>
              </form>
            </div>
          )}

          <div className="list-card">
            <h2>Companies ({companies.length})</h2>
            {loading ? (
              <p>Loading...</p>
            ) : companies.length === 0 ? (
              <p>No companies yet. {canCreate && 'Add one above.'}</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Unit Price</th>
                      <th>Created</th>
                      {(canEdit || canDelete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => (
                      <tr key={company.name}>
                        <td>{company.name}</td>
                        <td>${parseFloat(company.unit_price).toFixed(2)}</td>
                        <td>{company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}</td>
                        {(canEdit || canDelete) && (
                          <td className="actions">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditing(company.name);
                                  setEditForm({ unit_price: company.unit_price });
                                }}
                                className="btn-edit"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteCompany(company.name)}
                                className="btn-delete"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {editing && (
            <div className="modal-overlay" onClick={() => setEditing(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Company - {editing}</h2>
                  <button className="close-btn" onClick={() => setEditing(null)}>×</button>
                </div>
                <form onSubmit={handleEditCompany}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Unit Price</label>
                      <input
                        type="number"
                        placeholder="Unit Price"
                        step="0.01"
                        min="0"
                        value={editForm.unit_price}
                        onChange={e => setEditForm({...editForm, unit_price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
