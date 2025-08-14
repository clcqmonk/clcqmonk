import React, { useState, useEffect } from 'react';

const UserDashboard = ({ user, onBack, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchUserTickets();
  }, []);

  const fetchUserTickets = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${backendUrl}/api/user/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        console.error('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRaffleStatus = (status) => {
    switch (status) {
      case 'active': return { text: 'Active', color: 'text-green-600 bg-green-100' };
      case 'completed': return { text: 'Draw Complete', color: 'text-blue-600 bg-blue-100' };
      case 'cancelled': return { text: 'Cancelled', color: 'text-red-600 bg-red-100' };
      default: return { text: status, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const calculateStats = () => {
    const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.ticket_quantity, 0);
    const totalSpent = tickets.reduce((sum, ticket) => sum + ticket.total_amount, 0);
    const activeTickets = tickets.filter(ticket => ticket.raffle?.status === 'active').length;
    
    return {
      totalTickets,
      totalSpent,
      activeTickets,
      totalRaffles: tickets.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={onBack}
                className="mr-4 text-white hover:text-yellow-400 transition-colors"
              >
                ← Back to Home
              </button>
              <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white">
                Welcome, <span className="font-semibold">{user.full_name}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-white hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🎫</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Tickets</p>
                <p className="text-2xl font-semibold text-white">{stats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Spent</p>
                <p className="text-2xl font-semibold text-white">{formatPrice(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">⏰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Active Entries</p>
                <p className="text-2xl font-semibold text-white">{stats.activeTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Raffles Joined</p>
                <p className="text-2xl font-semibold text-white">{stats.totalRaffles}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 mb-8 border border-white/20">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'tickets'
                ? 'bg-yellow-400 text-black'
                : 'text-white hover:text-yellow-400'
            }`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-yellow-400 text-black'
                : 'text-white hover:text-yellow-400'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tickets' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">My Tickets</h2>
              <p className="text-white/80 text-sm mt-1">All your raffle entries and their status</p>
            </div>

            {tickets.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-lg font-medium text-white mb-2">No Tickets Yet</h3>
                <p className="text-white/60 mb-6">You haven't purchased any raffle tickets yet.</p>
                <button
                  onClick={onBack}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
                >
                  Browse Raffles
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          {ticket.raffle?.image_url && (
                            <img
                              src={ticket.raffle.image_url}
                              alt={ticket.raffle?.title || 'Raffle'}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {ticket.raffle?.title || 'Unknown Raffle'}
                            </h3>
                            <p className="text-white/60 text-sm">
                              Purchase Date: {formatDate(ticket.purchase_date)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-white/60">Tickets</p>
                            <p className="text-white font-semibold">{ticket.ticket_quantity}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Amount Paid</p>
                            <p className="text-white font-semibold">{formatPrice(ticket.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Ticket Status</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-white/60">Draw Status</p>
                            {ticket.raffle?.status && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRaffleStatus(ticket.raffle.status).color}`}>
                                {getRaffleStatus(ticket.raffle.status).text}
                              </span>
                            )}
                          </div>
                        </div>

                        {ticket.raffle?.draw_date && (
                          <div className="mt-3">
                            <p className="text-white/60 text-sm">
                              Draw Date: <span className="text-white">{formatDate(ticket.raffle.draw_date)}</span>
                            </p>
                          </div>
                        )}

                        <div className="mt-3">
                          <p className="text-white/60 text-sm">Ticket IDs:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ticket.ticket_ids.map((ticketId, index) => (
                              <span
                                key={index}
                                className="bg-white/20 text-white px-2 py-1 rounded text-xs font-mono"
                              >
                                {ticketId.substring(0, 8)}...
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
              <p className="text-white/80 text-sm mt-1">Your account details and preferences</p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {user.full_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {user.email}
                    {user.is_verified && (
                      <span className="ml-2 text-green-400 text-sm">✓ Verified</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {user.phone}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date of Birth</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {user.date_of_birth}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Member Since</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {formatDate(user.created_at)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Account Status</label>
                  <div className="bg-white/20 text-white px-4 py-3 rounded-lg">
                    {user.is_verified ? (
                      <span className="text-green-400">✓ Verified Account</span>
                    ) : (
                      <span className="text-yellow-400">⚠ Pending Verification</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Account Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{user.total_tickets_purchased || 0}</div>
                    <div className="text-white/80 text-sm">Total Tickets</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{formatPrice(user.total_amount_spent || 0)}</div>
                    <div className="text-white/80 text-sm">Total Spent</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.totalRaffles}</div>
                    <div className="text-white/80 text-sm">Raffles Joined</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Keep Your Account Secure
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Never share your login credentials with anyone</li>
                        <li>Log out from public devices</li>
                        <li>Keep your contact information updated</li>
                        <li>Report any suspicious activity immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;