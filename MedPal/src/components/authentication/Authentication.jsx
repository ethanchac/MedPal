import React, { useState } from 'react';
import { supabase } from '../../data/supabase-client.js';
import MedPalLogo from '../../assets/MedPal2.png';
import Stethoscope from '../../assets/Stethoscope.png';
import Texture from '../../assets/redtexture.jpg';


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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setFormData({ email: '', password: '', confirmPassword: '' });
      setMessage('Successfully signed in!');
    }
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f24b4b] font-sans">
      <div className="w-11/12  h-5/6 max-h-[800px] rounded-3xl overflow-hidden flex">
        
        {/* Left side - Red section */}
        <div className="flex flex-col justify-between text-white w-1/2 p-10 relative"
          style={{
            backgroundImage: `url(${Texture})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}>
        
          <div className="flex flex-col items-start">
            <img
              src={MedPalLogo}
              alt="MedPal Logo"
              className="w-16 h-16 mb-8"
            />
            <p className="text-lg max-w-[500px] leading-relaxed">
              Feeling sick? MedPal can help you diagnose your illness in an instance
            </p>
          </div>
          <div className="flex justify-center mt-8">
            <img
              src={Stethoscope}
              alt="Stethoscope"
              className="w-80 h-80 object-contain "
            />
          </div>
        </div>

        {/* Right side - White section */}
        <div className="bg-white w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-red-500 text-3xl font-bold mb-6">
            {authMode === 'signin' ? 'Welcome Back!' : 'Welcome, Please Sign Up'}
          </h2>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center border border-gray-300 px-4 py-2 rounded mb-6 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 mr-2"
            />
            {loading ? 'Loading...' :  authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
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
              className="bg-red-500 text-white py-2 px-6 rounded-full font-bold text-lg hover:bg-red-600 transition disabled:opacity-50"
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
    </div>
  );
}
