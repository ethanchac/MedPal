import React, { useState } from 'react';
import { supabase } from '../../data/supabase-client.js';

const Authentication = () => {
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

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
    }}>
      {/* Left Section */}
      <div style={{
        flex: 1,
        backgroundColor: '#f44336',
        color: '#fff',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: '2rem',
        borderBottomLeftRadius: '2rem'
      }}>
        <div style={{
          backgroundColor: '#fff',
          color: '#f44336',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.2rem',
        }}>
          MedPal
        </div>
        <p style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '1.2rem',
          maxWidth: '300px',
        }}>
          Feeling sick? MedPal can help you diagnose your illness in an instance.
        </p>
        <div style={{
          marginTop: '2rem',
        }}>
          <img src="/assets/Stethoscope.png" alt="Stethoscope" style={{ width: '120px' }} />
        </div>
      </div>

      {/* Right Section */}
      <div style={{
        flex: 1,
        backgroundColor: '#fff',
        padding: '3rem',
        borderTopRightRadius: '2rem',
        borderBottomRightRadius: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2 style={{
          color: '#f44336',
          marginBottom: '1rem'
        }}>
          Welcome, Please Sign in
        </h2>

        <button
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1.5rem',
          }}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: '20px', marginRight: '0.5rem' }}
          />
          Sign in with Google
        </button>

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#f44336' }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '2px solid #f44336',
                padding: '0.5rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#f44336' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '2px solid #f44336',
                padding: '0.5rem',
                outline: 'none',
              }}
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Loading...' : 'Sign in'}
          </button>
        </form>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
};

export default Authentication;
