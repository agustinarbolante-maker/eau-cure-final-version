import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Page.css';

export function Settings() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post('http://localhost:3000/api/users', form, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ username: '', email: '', password: '', role: 'admin' });
      loadUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleDeleteUser(id) {
    if (id === user?.id) {
      alert('Cannot delete your own account');
      return;
    }
    if (window.confirm('Delete this user?')) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.delete(`http://localhost:3000/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        loadUsers();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  }

  async function handleChangeRole(id, newRole) {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(`http://localhost:3000/api/users/${id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div className="page">
      <nav className="navbar">
        <div><h1>Eau Cure</h1><p>Settings</p></div>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="sidebar">
          <a href="/dashboard">Dashboard</a>
          <a href="/deliveries">Deliveries</a>
          <a href="/billing">Billing</a>
          <a href="/reports">Reports</a>
          <a href="/settings" className="active">Settings</a>
        </div>

        <div className="main">
          <div className="card">
            <h2>Create New User</h2>
            <form onSubmit={handleAddUser} className="form">
              <input type="text" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="software_engineer">Software Engineer</option>
                <option value="owner">Owner</option>
              </select>
              <button type="submit">Create User</button>
            </form>
          </div>

          <div className="card">
            <h2>Users ({users.length})</h2>
            {loading ? <p>Loading...</p> : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} style={{padding: '5px', borderRadius: '3px', border: '1px solid #ddd'}}>
                          <option value="admin">Admin</option>
                          <option value="software_engineer">Software Engineer</option>
                          <option value="owner">Owner</option>
                        </select>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td><button onClick={() => handleDeleteUser(u.id)} className="delete-btn" style={{padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}>Delete</button></td>
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
