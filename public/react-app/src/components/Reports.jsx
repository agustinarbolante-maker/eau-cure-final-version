import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Page.css';

export function Reports() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem('auth_token');
      const delRes = await axios.get('http://localhost:3000/api/deliveries', { headers: { Authorization: `Bearer ${token}` } });
      const dels = delRes.data || [];
      setDeliveries(dels);

      if (dels.length > 0) {
        const totalQty = dels.reduce((sum, d) => sum + (d.bottles_delivered || 0), 0);
        const totalReturned = dels.reduce((sum, d) => sum + (d.bottles_returned || 0), 0);
        setStats({
          totalDeliveries: dels.length,
          totalBottles: totalQty,
          totalReturned: totalReturned,
          avgPerDelivery: (totalQty / dels.length).toFixed(2)
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div className="page">
      <nav className="navbar">
        <div><h1>Eau Cure</h1><p>Reports</p></div>
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
          <a href="/reports" className="active">Reports</a>
          {['owner', 'software_engineer', 'admin'].includes(user?.role) && <a href="/companies">Companies</a>}
          {['owner', 'software_engineer'].includes(user?.role) && <a href="/settings">Settings</a>}
        </div>

        <div className="main">
          <h2>Daily Reports</h2>

          {loading ? <p>Loading...</p> : !stats ? <p>No data yet</p> : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Deliveries</h3>
                  <div className="stat-value">{stats.totalDeliveries}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Bottles Delivered</h3>
                  <div className="stat-value">{stats.totalBottles}</div>
                </div>
                <div className="stat-card">
                  <h3>Average per Delivery</h3>
                  <div className="stat-value">{stats.avgPerDelivery}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Bottles Returned</h3>
                  <div className="stat-value">{stats.totalReturned}</div>
                </div>
              </div>

              <div className="card">
                <h3>Recent Deliveries</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Delivered</th>
                      <th>Returned</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.slice(0, 10).map(d => (
                      <tr key={d.id}>
                        <td>{d.company}</td>
                        <td>{d.bottles_delivered}</td>
                        <td>{d.bottles_returned}</td>
                        <td>{new Date(d.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
