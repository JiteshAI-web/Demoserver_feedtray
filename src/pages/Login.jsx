// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BASE_URL;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/');
    }
  }, []);

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/login/`, {
        identifier,
        password,
      });

      const data = response.data;
      localStorage.setItem('Device_id', data.Device_id);
      localStorage.setItem('User_name', data.User_name);
      localStorage.setItem('Mob', data.Mob);
      localStorage.setItem('Email', data.Email);
      localStorage.setItem('isLoggedIn', 'true');

      console.log('Login successful:', data);
      navigate('/pilotfeedtraydashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      await axios.post(`${apiUrl}/forgot_password/`, { email });
      alert('Password reset link sent to your email.');
      setEmail('');
      setShowForgotPassword(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      alert('Failed to send reset link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {showForgotPassword ? 'Reset your password' : 'Sign in to your feedtray dashboard'}
        </h2>

        {showForgotPassword ? (
          <form className="space-y-6" onSubmit={onForgotSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Enter your email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow"
            >
              Send Reset Link
            </button>

            <p className="text-sm text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setEmail('');
                }}
                className="text-blue-600 hover:underline"
              >
                Back to login
              </button>
            </p>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={onLoginSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                User Name
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your User Name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your password"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
