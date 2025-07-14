import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [raffles, setRaffles] = useState([]);
  const [filteredRaffles, setFilteredRaffles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchRaffles();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredRaffles(raffles);
    } else {
      setFilteredRaffles(raffles.filter(raffle => raffle.category === selectedCategory));
    }
  }, [selectedCategory, raffles]);

  const fetchRaffles = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/raffles`);
      const data = await response.json();
      setRaffles(data);
      setFilteredRaffles(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching raffles:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatTimeRemaining = (drawDate) => {
    const now = new Date();
    const draw = new Date(drawDate);
    const diff = draw - now;
    
    if (diff <= 0) return 'Draw completed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    
    if (!selectedRaffle) return;
    
    const totalAmount = selectedRaffle.ticket_price * purchaseForm.quantity;
    
    try {
      const response = await fetch(`${backendUrl}/api/tickets/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffle_id: selectedRaffle.id,
          user_name: purchaseForm.name,
          user_email: purchaseForm.email,
          user_phone: purchaseForm.phone,
          ticket_quantity: purchaseForm.quantity,
          total_amount: totalAmount
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`🎉 Congratulations! You've successfully purchased ${purchaseForm.quantity} ticket(s)!\n\nTicket IDs: ${result.ticket_ids.join(', ')}\n\nGood luck in the draw!`);
        setShowPurchaseModal(false);
        setPurchaseForm({ name: '', email: '', phone: '', quantity: 1 });
        fetchRaffles(); // Refresh to show updated ticket counts
      } else {
        alert('Purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const categories = ['All', 'House', 'Car', 'Land'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading amazing raffles...</div>
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
              <h1 className="text-2xl font-bold text-white">RafflekTM360</h1>
              <span className="ml-2 text-yellow-400">🎯</span>
            </div>
            <div className="text-white text-sm">
              <span className="mr-4">🏆 {stats.total_raffles || 0} Active Raffles</span>
              <span>👥 {stats.total_participants || 0} Participants</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Win a <span className="text-yellow-400">House</span>, <span className="text-green-400">Land</span> or <span className="text-red-400">Luxury Car</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            from Just <span className="text-yellow-400 font-bold">Rs. 500!</span>
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
            Join thousands of participants in Nepal's most trusted raffle platform. 
            Transparent draws, verified prizes, and life-changing opportunities await you.
          </p>
          <button 
            onClick={() => document.getElementById('raffles').scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-full text-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            🎟️ View Live Raffles
          </button>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-yellow-400 text-black shadow-lg transform scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Raffles Grid */}
      <section id="raffles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRaffles.map(raffle => (
            <div 
              key={raffle.id} 
              className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-xl border border-white/20 hover:shadow-2xl"
            >
              <div className="relative">
                <img 
                  src={raffle.image_url} 
                  alt={raffle.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  {raffle.category}
                </div>
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  ⏰ {formatTimeRemaining(raffle.draw_date)}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{raffle.title}</h3>
                <p className="text-white/80 text-sm mb-4 line-clamp-2">{raffle.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Prize Value:</span>
                    <span className="text-green-400 font-bold">{formatPrice(raffle.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Ticket Price:</span>
                    <span className="text-yellow-400 font-bold">{formatPrice(raffle.ticket_price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Tickets Sold:</span>
                    <span className="text-white">{raffle.sold_tickets.toLocaleString()} / {raffle.total_tickets.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(raffle.sold_tickets / raffle.total_tickets) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedRaffle(raffle)}
                    className="flex-1 bg-white/20 text-white py-3 px-4 rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRaffle(raffle);
                      setShowPurchaseModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg"
                  >
                    Buy Tickets
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Raffle Details Modal */}
      {selectedRaffle && !showPurchaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="relative">
              <img 
                src={selectedRaffle.image_url} 
                alt={selectedRaffle.title}
                className="w-full h-64 object-cover rounded-t-2xl"
              />
              <button 
                onClick={() => setSelectedRaffle(null)}
                className="absolute top-4 right-4 bg-black/70 text-white w-8 h-8 rounded-full hover:bg-black/90 transition-all duration-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedRaffle.title}</h3>
              <p className="text-gray-600 mb-6">{selectedRaffle.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Prize Value</div>
                  <div className="text-xl font-bold text-green-600">{formatPrice(selectedRaffle.value)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Ticket Price</div>
                  <div className="text-xl font-bold text-yellow-600">{formatPrice(selectedRaffle.ticket_price)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="text-lg font-semibold text-gray-800">{selectedRaffle.location}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Draw Date</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {new Date(selectedRaffle.draw_date).toLocaleDateString('en-NP')}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tickets Sold</span>
                  <span className="font-semibold">{selectedRaffle.sold_tickets.toLocaleString()} / {selectedRaffle.total_tickets.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedRaffle.sold_tickets / selectedRaffle.total_tickets) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedRaffle(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Close
                </button>
                <button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg"
                >
                  Buy Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedRaffle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Buy Tickets</h3>
                <button 
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="text-sm text-gray-500 mb-1">Selected Raffle</div>
                <div className="font-semibold text-gray-800">{selectedRaffle.title}</div>
                <div className="text-yellow-600 font-bold">{formatPrice(selectedRaffle.ticket_price)} per ticket</div>
              </div>
              
              <form onSubmit={handlePurchase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.name}
                    onChange={(e) => setPurchaseForm({...purchaseForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={purchaseForm.email}
                    onChange={(e) => setPurchaseForm({...purchaseForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={purchaseForm.phone}
                    onChange={(e) => setPurchaseForm({...purchaseForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Tickets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Total Amount:</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {formatPrice(selectedRaffle.ticket_price * purchaseForm.quantity)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg"
                  >
                    🎟️ Buy Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white/80 mb-4">
            <p>🏆 Nepal's Most Trusted Raffle Platform</p>
            <p className="text-sm mt-2">Transparent draws • Verified prizes • Secure payments</p>
          </div>
          <div className="text-white/60 text-sm">
            <p>&copy; 2024 RafflekTM360. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;