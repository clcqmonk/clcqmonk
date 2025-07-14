import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [raffles, setRaffles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [raffleForm, setRaffleForm] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'House',
    value: '',
    ticket_price: '',
    total_tickets: '',
    draw_date: '',
    location: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Authentication functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setLoginForm({ username: '', password: '' });
        loadDashboardData();
      } else {
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        loadDashboardData();
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminToken');
    }
  };

  // Data loading functions
  const loadDashboardData = async () => {
    await Promise.all([
      loadRaffles(),
      loadStats(),
      loadTickets()
    ]);
  };

  const loadRaffles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/raffles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRaffles(data);
      }
    } catch (error) {
      console.error('Error loading raffles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  // Raffle management functions
  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/raffles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...raffleForm,
          value: parseFloat(raffleForm.value),
          ticket_price: parseFloat(raffleForm.ticket_price),
          total_tickets: parseInt(raffleForm.total_tickets),
          draw_date: new Date(raffleForm.draw_date).toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Raffle created successfully!');
        setShowCreateModal(false);
        setRaffleForm({
          title: '',
          description: '',
          image_url: '',
          category: 'House',
          value: '',
          ticket_price: '',
          total_tickets: '',
          draw_date: '',
          location: ''
        });
        loadRaffles();
      } else {
        alert('Failed to create raffle: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating raffle:', error);
      alert('Failed to create raffle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRaffle = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/raffles/${selectedRaffle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...raffleForm,
          value: parseFloat(raffleForm.value),
          ticket_price: parseFloat(raffleForm.ticket_price),
          total_tickets: parseInt(raffleForm.total_tickets),
          draw_date: new Date(raffleForm.draw_date).toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Raffle updated successfully!');
        setShowEditModal(false);
        setSelectedRaffle(null);
        loadRaffles();
      } else {
        alert('Failed to update raffle: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating raffle:', error);
      alert('Failed to update raffle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRaffle = async (raffleId) => {
    if (!confirm('Are you sure you want to delete this raffle?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/raffles/${raffleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        loadRaffles();
      } else {
        alert('Failed to delete raffle: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting raffle:', error);
      alert('Failed to delete raffle. Please try again.');
    }
  };

  const openEditModal = (raffle) => {
    setSelectedRaffle(raffle);
    setRaffleForm({
      title: raffle.title,
      description: raffle.description,
      image_url: raffle.image_url,
      category: raffle.category,
      value: raffle.value.toString(),
      ticket_price: raffle.ticket_price.toString(),
      total_tickets: raffle.total_tickets.toString(),
      draw_date: new Date(raffle.draw_date).toISOString().slice(0, 16),
      location: raffle.location || ''
    });
    setShowEditModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>🎯 RafflekTM360</h1>
            <h2>Admin Dashboard</h2>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
                placeholder="Enter username"
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
                placeholder="Enter password"
              />
            </div>
            
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="login-info">
            <p>Default credentials: admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🎯 RafflekTM360</h2>
          <p>Admin Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'raffles' ? 'active' : ''}
            onClick={() => setActiveTab('raffles')}
          >
            🎫 Manage Raffles
          </button>
          <button 
            className={activeTab === 'tickets' ? 'active' : ''}
            onClick={() => setActiveTab('tickets')}
          >
            🎟️ Tickets & Participants
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <h1>
            {activeTab === 'dashboard' && '📊 Dashboard'}
            {activeTab === 'raffles' && '🎫 Manage Raffles'}
            {activeTab === 'tickets' && '🎟️ Tickets & Participants'}
            {activeTab === 'analytics' && '📈 Analytics'}
          </h1>
        </div>

        <div className="admin-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎫</div>
                  <div className="stat-info">
                    <h3>{stats.total_raffles || 0}</h3>
                    <p>Total Raffles</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{stats.active_raffles || 0}</h3>
                    <p>Active Raffles</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎟️</div>
                  <div className="stat-info">
                    <h3>{stats.total_tickets_sold || 0}</h3>
                    <p>Tickets Sold</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <h3>{formatPrice(stats.total_revenue || 0)}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-sections">
                <div className="recent-activity">
                  <h3>Recent Purchases</h3>
                  <div className="activity-list">
                    {stats.recent_purchases?.slice(0, 5).map((purchase, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-info">
                          <strong>{purchase.user_name}</strong>
                          <span>bought {purchase.ticket_quantity} tickets</span>
                          <span className="activity-date">{formatDate(purchase.purchase_date)}</span>
                        </div>
                        <div className="activity-amount">
                          {formatPrice(purchase.total_amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="category-breakdown">
                  <h3>Category Breakdown</h3>
                  <div className="category-list">
                    {stats.category_stats?.map((category, index) => (
                      <div key={index} className="category-item">
                        <div className="category-info">
                          <span className="category-name">{category._id}</span>
                          <span className="category-count">{category.count} raffles</span>
                        </div>
                        <div className="category-value">
                          {formatPrice(category.total_value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raffles Tab */}
          {activeTab === 'raffles' && (
            <div className="raffles-tab">
              <div className="tab-header">
                <h3>Manage Raffles</h3>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="create-btn"
                >
                  + Create New Raffle
                </button>
              </div>

              <div className="raffles-grid">
                {raffles.map((raffle) => (
                  <div key={raffle.id} className="raffle-card">
                    <div className="raffle-image">
                      <img src={raffle.image_url} alt={raffle.title} />
                      <div className={`raffle-status ${raffle.status}`}>
                        {raffle.status}
                      </div>
                    </div>
                    
                    <div className="raffle-info">
                      <h4>{raffle.title}</h4>
                      <p className="raffle-category">{raffle.category}</p>
                      <p className="raffle-value">{formatPrice(raffle.value)}</p>
                      
                      <div className="raffle-stats">
                        <div className="stat">
                          <span>Tickets Sold:</span>
                          <span>{raffle.sold_tickets}/{raffle.total_tickets}</span>
                        </div>
                        <div className="stat">
                          <span>Draw Date:</span>
                          <span>{formatDate(raffle.draw_date)}</span>
                        </div>
                      </div>
                      
                      <div className="raffle-actions">
                        <button 
                          onClick={() => openEditModal(raffle)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteRaffle(raffle.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="tickets-tab">
              <h3>Tickets & Participants</h3>
              
              <div className="tickets-table">
                <table>
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Raffle</th>
                      <th>Tickets</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{formatDate(ticket.purchase_date)}</td>
                        <td>{ticket.user_name}</td>
                        <td>
                          <div>{ticket.user_email}</div>
                          <div>{ticket.user_phone}</div>
                        </td>
                        <td>
                          {raffles.find(r => r.id === ticket.raffle_id)?.title || 'Unknown'}
                        </td>
                        <td>{ticket.ticket_quantity}</td>
                        <td>{formatPrice(ticket.total_amount)}</td>
                        <td>
                          <span className={`status ${ticket.status}`}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <h3>Analytics & Reports</h3>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>Revenue Summary</h4>
                  <div className="summary-stats">
                    <div className="summary-item">
                      <span>Total Revenue:</span>
                      <strong>{formatPrice(stats.total_revenue || 0)}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Active Raffles:</span>
                      <strong>{stats.active_raffles || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Completed Raffles:</span>
                      <strong>{stats.completed_raffles || 0}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h4>Performance Metrics</h4>
                  <div className="metrics">
                    <div className="metric">
                      <span>Average Ticket Price:</span>
                      <strong>Rs. 500</strong>
                    </div>
                    <div className="metric">
                      <span>Total Participants:</span>
                      <strong>{tickets.length}</strong>
                    </div>
                    <div className="metric">
                      <span>Conversion Rate:</span>
                      <strong>12.5%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Raffle</h3>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateRaffle} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={raffleForm.title}
                    onChange={(e) => setRaffleForm({...raffleForm, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={raffleForm.category}
                    onChange={(e) => setRaffleForm({...raffleForm, category: e.target.value})}
                    required
                  >
                    <option value="House">House</option>
                    <option value="Car">Car</option>
                    <option value="Land">Land</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Experience">Experience</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={raffleForm.description}
                  onChange={(e) => setRaffleForm({...raffleForm, description: e.target.value})}
                  required
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={raffleForm.image_url}
                  onChange={(e) => setRaffleForm({...raffleForm, image_url: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Prize Value (NPR)</label>
                  <input
                    type="number"
                    value={raffleForm.value}
                    onChange={(e) => setRaffleForm({...raffleForm, value: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Ticket Price (NPR)</label>
                  <input
                    type="number"
                    value={raffleForm.ticket_price}
                    onChange={(e) => setRaffleForm({...raffleForm, ticket_price: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Total Tickets</label>
                  <input
                    type="number"
                    value={raffleForm.total_tickets}
                    onChange={(e) => setRaffleForm({...raffleForm, total_tickets: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Draw Date</label>
                  <input
                    type="datetime-local"
                    value={raffleForm.draw_date}
                    onChange={(e) => setRaffleForm({...raffleForm, draw_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={raffleForm.location}
                  onChange={(e) => setRaffleForm({...raffleForm, location: e.target.value})}
                  placeholder="e.g., Kathmandu, Nepal"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Raffle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Raffle Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Raffle</h3>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleEditRaffle} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={raffleForm.title}
                    onChange={(e) => setRaffleForm({...raffleForm, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={raffleForm.category}
                    onChange={(e) => setRaffleForm({...raffleForm, category: e.target.value})}
                    required
                  >
                    <option value="House">House</option>
                    <option value="Car">Car</option>
                    <option value="Land">Land</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Experience">Experience</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={raffleForm.description}
                  onChange={(e) => setRaffleForm({...raffleForm, description: e.target.value})}
                  required
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={raffleForm.image_url}
                  onChange={(e) => setRaffleForm({...raffleForm, image_url: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Prize Value (NPR)</label>
                  <input
                    type="number"
                    value={raffleForm.value}
                    onChange={(e) => setRaffleForm({...raffleForm, value: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Ticket Price (NPR)</label>
                  <input
                    type="number"
                    value={raffleForm.ticket_price}
                    onChange={(e) => setRaffleForm({...raffleForm, ticket_price: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Total Tickets</label>
                  <input
                    type="number"
                    value={raffleForm.total_tickets}
                    onChange={(e) => setRaffleForm({...raffleForm, total_tickets: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Draw Date</label>
                  <input
                    type="datetime-local"
                    value={raffleForm.draw_date}
                    onChange={(e) => setRaffleForm({...raffleForm, draw_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={raffleForm.location}
                  onChange={(e) => setRaffleForm({...raffleForm, location: e.target.value})}
                  placeholder="e.g., Kathmandu, Nepal"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Raffle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;