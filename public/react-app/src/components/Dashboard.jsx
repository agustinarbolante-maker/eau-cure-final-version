import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--color-dark)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Eau Cure</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Water Station Tracker</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>{user?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: 'white', padding: '24px 16px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="/dashboard" className="nav-link active">Dashboard</a>
          <a href="/deliveries" className="nav-link">Deliveries</a>
          <a href="/billing" className="nav-link">Billing</a>
          <a href="/reports" className="nav-link">Reports</a>
          {['owner', 'software_engineer', 'admin'].includes(user?.role) && <a href="/companies" className="nav-link">Companies</a>}
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings" className="nav-link">Settings</a>}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px' }}>
          <div style={{ maxWidth: '1200px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Welcome, {user?.username}! 👋
              </h1>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Role: <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{user?.role}</span>
              </p>
            </div>

            {/* User Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>👤 Account Info</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Email</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{user?.email}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>User ID</span>
                      <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '13px' }}>{user?.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🎯 System Status</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-success)' }}>✓</span>
                      <span>Authentication working</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-success)' }}>✓</span>
                      <span>User logged in</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-success)' }}>✓</span>
                      <span>Backend connected</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>📊 Quick Access</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="/deliveries" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '14px' }}>
                      → View Deliveries
                    </a>
                    <a href="/billing" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '14px' }}>
                      → View Billing
                    </a>
                    <a href="/companies" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '14px' }}>
                      → Manage Companies
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Section */}
            {['owner', 'software_engineer'].includes(user?.role) && (
              <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🔑 Admin Panel</h3>
                </div>
                <div className="card-body">
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    You have full access to create, edit, and delete users, manage companies, and configure the system.
                  </p>
                  <a href="/settings" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                    Go to Settings
                  </a>
                </div>
              </div>
            )}
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
