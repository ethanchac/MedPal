import React, { useState } from 'react';
import { supabase } from '../../data/supabase-client.js';

export default function Authentication() {
  const [authMode, setAuthMode] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setMessage('');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the confirmation link!');
      setFormData({ email: '', password: '', confirmPassword: '' });
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Clear form data on successful sign in
      setFormData({ email: '', password: '', confirmPassword: '' });
      setMessage('Successfully signed in!');
      // Don't set loading to false here - let the auth state change handle the redirect
      // The MainScreen component will handle the user state automatically
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirect back to your app
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Don't set loading to false on success - let auth state change handle it
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Section */}
      <div className="flex-1 bg-red-500 text-white p-8 flex flex-col justify-center items-center rounded-l-2xl">
        <div className="bg-white text-red-500 rounded-full w-20 h-20 flex items-center justify-center font-bold text-xl">
          MedPal
        </div>
        <p className="mt-8 text-center text-lg max-w-xs">
          Feeling sick? MedPal can help you diagnose your illness in an instance.
        </p>
        <div className="mt-8">
          <img
            src="/assets/Stethoscope.png"
            alt="Stethoscope"
            className="w-30"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 bg-white p-12 rounded-r-2xl flex flex-col justify-center">
        <h2 className="text-red-500 text-3xl font-bold mb-4">
          Welcome, Please {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h2>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center border border-gray-300 px-4 py-2 rounded mb-6 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="w-5 mr-2"
          />
          {loading && authMode === 'google' ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-red-500 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full border-b-2 border-red-500 focus:outline-none py-2 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-red-500 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full border-b-2 border-red-500 focus:outline-none py-2 disabled:opacity-50"
            />
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="block text-red-500 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full border-b-2 border-red-500 focus:outline-none py-2 disabled:opacity-50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-red-500 text-white py-2 px-6 rounded-full font-bold text-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => {
            setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
            setError('');
            setMessage('');
          }}
          disabled={loading}
          className="mt-4 text-red-500 underline hover:text-red-600 transition disabled:opacity-50"
        >
          {authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {message && <p className="text-green-600 mt-4">{message}</p>}
      </div>
    </div>
  );
}