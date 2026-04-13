import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Welcome Back</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label className="input-label">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '10px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
                {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin 
                onSuccess={async (credentialResponse) => {
                    try {
                        await googleLogin(credentialResponse.credential);
                        navigate('/dashboard');
                    } catch(err) {
                        setError('Google Auth failed');
                    }
                }}
                onError={() => setError('Google Auth failed')}
            />
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
