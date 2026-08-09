import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export function Settings() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' });

  useEffect(() => {
    if (!['owner', 'software_engineer'].includes(user?.role)) {
      window.location.href = '/dashboard';
      return;
    }
    loadUsers();
  }, [user]);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/users', form, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', 'User created successfully');
      setForm({ username: '', email: '', password: '', role: 'admin' });
      loadUsers();
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(id) {
    if (id === user?.id) {
      showMessage('error', 'Cannot delete your own account');
      return;
    }
    if (window.confirm('Delete this user? This action cannot be undone.')) {
      setDeleting(id);
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`http://localhost:3000/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('success', 'User deleted');
        loadUsers();
      } catch (err) {
        showMessage('error', 'Failed to delete user');
      } finally {
        setDeleting(null);
      }
    }
  }

  async function handleChangeRole(id, newRole) {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`http://localhost:3000/api/users/${id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('success', 'Role updated');
      loadUsers();
    } catch (err) {
      showMessage('error', 'Failed to update role');
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--color-dark)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Eau Cure</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Settings</p>
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
          <a href="/billing" className="nav-link">Billing</a>
          <a href="/reports" className="nav-link">Reports</a>
          <a href="/companies" className="nav-link">Companies</a>
          <a href="/settings" className="nav-link active">Settings</a>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Message Alert */}
          {message.text && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
              {message.text}
            </div>
          )}

          {/* Create User Form */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Create New User</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddUser} className="form" style={{ gap: '16px', maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                    className="form-control"
                  >
                    <option value="admin">Admin</option>
                    <option value="software_engineer">Software Engineer</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Users <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>({users.length})</span>
              </h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                  <p>No users found</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Role</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ opacity: u.id === user?.id ? 0.7 : 1 }}>
                          <td style={{ fontWeight: 500 }}>
                            {u.username}
                            {u.id === user?.id && <span style={{ fontSize: '12px', marginLeft: '8px', color: 'var(--color-text-secondary)' }}>(You)</span>}
                          </td>
                          <td style={{ fontSize: '13px' }}>{u.email}</td>
                          <td style={{ textAlign: 'center' }}>
                            <select
                              value={u.role}
                              onChange={e => handleChangeRole(u.id, e.target.value)}
                              disabled={u.id === user?.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'white',
                                fontSize: '13px',
                                cursor: u.id === user?.id ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="software_engineer">Software Engineer</option>
                              <option value="owner">Owner</option>
                            </select>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn btn-sm btn-danger"
                              disabled={u.id === user?.id || deleting === u.id}
                              style={{ opacity: u.id === user?.id ? 0.5 : 1 }}
                            >
                              {deleting === u.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
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
