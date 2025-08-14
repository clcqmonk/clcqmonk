import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import UserDashboard from './components/UserDashboard';
import Admin from './Admin';
import AuthModal from './components/AuthModal';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('userToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('userToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('userToken', token);
    setUser(userData);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
    setCurrentPage('home');
  };

  const showLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const showRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  // Handle URL parameters for email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const page = urlParams.get('page');
    
    if (token && window.location.pathname === '/verify-email') {
      verifyEmail(token);
    }
    
    if (page) {
      setCurrentPage(page);
    }
  }, []);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        alert('Email verified successfully! You can now login.');
        window.history.replaceState({}, document.title, '/');
      } else {
        alert('Email verification failed: ' + data.detail);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      alert('Email verification failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading RafflekTM360...</div>
      </div>
    );
  }

  // Admin page
  if (currentPage === 'admin') {
    return <Admin />;
  }

  // Terms page
  if (currentPage === 'terms') {
    return <TermsPage onBack={() => setCurrentPage('home')} />;
  }

  // Privacy page
  if (currentPage === 'privacy') {
    return <PrivacyPage onBack={() => setCurrentPage('home')} />;
  }

  // User dashboard page
  if (currentPage === 'dashboard' && user) {
    return (
      <UserDashboard 
        user={user} 
        onBack={() => setCurrentPage('home')}
        onLogout={handleLogout}
      />
    );
  }

  // Main homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              <h1 className="text-2xl font-bold text-white">RafflekTM360</h1>
              <span className="ml-2 text-yellow-400">🎯</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`text-white hover:text-yellow-400 transition-colors ${currentPage === 'home' ? 'text-yellow-400' : ''}`}
              >
                Home
              </button>
              {user && (
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  My Tickets
                </button>
              )}
              <button 
                onClick={() => setCurrentPage('terms')}
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => setCurrentPage('privacy')}
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Privacy
              </button>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-white">
                    <span className="hidden md:inline">Welcome, </span>
                    <span className="font-semibold">{user.full_name}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={showLogin}
                    className="text-white hover:text-yellow-400 transition-colors font-medium"
                  >
                    Login
                  </button>
                  <button 
                    onClick={showRegister}
                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => setCurrentPage('admin')}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <HomePage 
        user={user}
        onLogin={showLogin}
        onRegister={showRegister}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onModeChange={setAuthMode}
        />
      )}

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">🎯 RafflekTM360</h3>
              <p className="text-white/80 mb-4">
                Nepal's most trusted raffle platform. Win luxury houses, cars, land, and more 
                with transparent draws and verified prizes.
              </p>
              <div className="text-white/60 text-sm">
                <p>🏆 Transparent draws • ✅ Verified prizes • 🔒 Secure payments</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="block text-white/80 hover:text-white transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => setCurrentPage('terms')}
                  className="block text-white/80 hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
                <button 
                  onClick={() => setCurrentPage('privacy')}
                  className="block text-white/80 hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="text-white/60 text-sm space-y-1">
                <p>Licensed Raffle Platform</p>
                <p>Nepal Gaming Authority</p>
                <p>Age Restriction: 18+</p>
                <p>Responsible Gaming</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              &copy; 2024 RafflekTM360. All rights reserved. 
              <span className="mx-2">•</span>
              Must be 18+ to participate
              <span className="mx-2">•</span>
              Gamble responsibly
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;