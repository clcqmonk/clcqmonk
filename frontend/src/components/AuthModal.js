import React, { useState } from 'react';

const AuthModal = ({ mode, onClose, onLogin, onModeChange }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register' ? formData : {
        email: formData.email,
        password: formData.password
      };

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === 'register') {
          alert('Registration successful! Please check your email to verify your account.');
          onModeChange('login');
        } else {
          onLogin(data.user, data.token);
        }
      } else {
        if (data.detail) {
          if (typeof data.detail === 'string') {
            setErrors({ general: data.detail });
          } else if (Array.isArray(data.detail)) {
            const fieldErrors = {};
            data.detail.forEach(error => {
              if (error.loc && error.loc.length > 1) {
                fieldErrors[error.loc[1]] = error.msg;
              }
            });
            setErrors(fieldErrors);
          }
        } else {
          setErrors({ general: 'An error occurred. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setFormData(prev => ({ ...prev, date_of_birth: dateValue }));
    
    if (dateValue && !validateAge(dateValue)) {
      setErrors(prev => ({ ...prev, date_of_birth: 'You must be 18 years or older to participate' }));
    } else {
      setErrors(prev => ({ ...prev, date_of_birth: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Age Verification Notice */}
          {mode === 'register' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Age Verification Required
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    You must be 18 years or older to participate in raffles. 
                    Gambling can be addictive - please play responsibly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., +977-9800000000"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Enter a valid Nepali phone number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleDateChange}
                    required
                    max={new Date(Date.now() - 567648000000).toISOString().split('T')[0]} // 18 years ago
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    You must be 18 years or older
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={mode === 'register' ? 'Create a password (min 6 characters)' : 'Enter your password'}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-500 text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Account Verification
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      After registration, you'll receive a verification email. 
                      Please check your inbox and verify your account to start participating.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (mode === 'register' ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => onModeChange(mode === 'register' ? 'login' : 'register')}
                className="ml-1 text-yellow-600 hover:text-yellow-800 font-medium"
              >
                {mode === 'register' ? 'Login here' : 'Sign up here'}
              </button>
            </p>
          </div>

          {mode === 'register' && (
            <div className="mt-6 text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms & Conditions and Privacy Policy. 
              You confirm that you are 18 years or older and understand the risks associated with raffles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;