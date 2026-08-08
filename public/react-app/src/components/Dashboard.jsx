import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div>
          <h1>Eau Cure</h1>
          <p>Water Station Tracker</p>
        </div>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="sidebar">
          <a href="/dashboard" className="active">Dashboard</a>
          <a href="/deliveries">Deliveries</a>
          <a href="/billing">Billing</a>
          <a href="/reports">Reports</a>
          {['owner', 'software_engineer', 'admin'].includes(user?.role) && <a href="/companies">Companies</a>}
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings">Settings</a>}
        </div>

        <div className="main">
          <h2>Welcome, {user?.username}!</h2>
          <p className="role-badge">Role: <strong>{user?.role}</strong></p>

          <div className="dashboard-grid">
            <div className="card">
              <h3>👤 User Info</h3>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>ID:</strong> {user?.id}</p>
            </div>

            <div className="card">
              <h3>🎯 Quick Actions</h3>
              <p>✅ Authentication working</p>
              <p>✅ User logged in</p>
              <p>✅ Backend connected</p>
            </div>
          </div>

          {['owner', 'software_engineer'].includes(user?.role) && (
            <div className="admin-section">
              <h3>🔑 Admin Panel</h3>
              <p>You have full access to create/delete users and manage the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
