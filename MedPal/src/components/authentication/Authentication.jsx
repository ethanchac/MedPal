import React, { useState, useEffect } from 'react';
import { supabase } from '../../data/supabase-client.js';

const Authentication = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
    
    const { data, error } = await supabase.auth.signUp({
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
    } else {
      setMessage('Successfully signed in!');
      setFormData({ email: '', password: '', confirmPassword: '' });
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setMessage('Successfully signed out!');
    }
  };

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <h2>Welcome!</h2>
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        {message && <div>{message}</div>}
        {error && <div>{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <h2>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>

      <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        {authMode === 'signup' && (
          <div>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div>
        <button onClick={handleGoogleSignIn}>
          Sign in with Google
        </button>
      </div>

      <div>
        <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
          {authMode === 'signin' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </button>
      </div>

      {message && <div>{message}</div>}
      {error && <div>{error}</div>}
    </div>
  );
};

export default Authentication;