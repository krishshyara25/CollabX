import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp    { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes orbit     { from{transform:rotate(0deg) translateX(180px) rotate(0deg)} to{transform:rotate(360deg) translateX(180px) rotate(-360deg)} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    -webkit-text-fill-color: #0f172a !important;
  }
`;

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
);

const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(70px)', opacity: 0.6, ...style }} />
);

export default function Login() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState('');
  const [shake, setShake]             = useState(false);
  const { login, googleLogin }        = useAuth();
  const navigate                      = useNavigate();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: '100%',
    padding: '0.78rem 1rem',
    paddingRight: name === 'password' ? '3rem' : '1rem',
    borderRadius: 10,
    border: `1.5px solid ${focused === name ? '#2563eb' : error && name === 'password' ? '#ef4444' : '#e2e8f0'}`,
    background: '#fff',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
    boxShadow: focused === name ? '0 0 0 4px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#eff6ff 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      {/* Ambient orbs */}
      <Orb style={{ width: 500, height: 500, top: '-15%', right: '-10%', background: 'radial-gradient(circle,rgba(99,102,241,.2),transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, bottom: '-20%', left: '-8%',  background: 'radial-gradient(circle,rgba(16,185,129,.15),transparent 70%)' }} />
      <Orb style={{ width: 300, height: 300, top: '40%',   left: '40%',    background: 'radial-gradient(circle,rgba(245,158,11,.1),transparent 70%)' }} />

      {/* Left Branding Panel — hidden on small screens */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem', position: 'relative', zIndex: 1,
        '@media(max-width:768px)': { display: 'none' },
      }} className="login-panel-left">
        <style>{`.login-panel-left { display: flex; } @media(max-width: 860px){ .login-panel-left{ display: none !important; } }`}</style>

        <div style={{ animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1)', textAlign: 'center', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{
            fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg,#14b8a6,#0ea5e9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '2.5rem',
          }}>CollabX</div>

          {/* Floating illustration */}
          <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto 2.5rem' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1.5px dashed rgba(37,99,235,.2)',
            }} />
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                position: 'absolute', width: 14, height: 14, borderRadius: '50%',
                background: ['#2563eb','#7c3aed','#10b981','#f59e0b'][i],
                top: '50%', left: '50%', marginTop: -7, marginLeft: -7,
                animation: `orbit ${3.5 + i * 0.5}s linear infinite`,
                animationDelay: `${-i * 0.8}s`,
                boxShadow: `0 0 14px ${['#2563eb','#7c3aed','#10b981','#f59e0b'][i]}88`,
              }} />
            ))}
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
              alt=""
              style={{
                width: 180, position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                filter: 'drop-shadow(0 20px 40px rgba(37,99,235,.2))',
                animation: 'float 5s ease-in-out infinite',
              }}
            />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem', color: '#0f172a' }}>
            Study Smarter Together
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.75, fontSize: '0.95rem' }}>
            Chat, whiteboard, video call, and quiz each other — all in one collaborative workspace.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: '2rem' }}>
            {['💬 Chat','🎨 Whiteboard','🎥 Video','📄 PDF Quiz','⏱ Timer','🏆 Leaderboard'].map((f, i) => (
              <span key={i} style={{
                background: 'white', border: '1px solid #e2e8f0', borderRadius: 999,
                padding: '0.3rem 0.85rem', fontSize: '0.78rem', fontWeight: 500, color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                animation: `fadeUp .5s ${.1 + i * .08}s cubic-bezier(.16,1,.3,1) both`,
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{
        width: '100%', maxWidth: 500,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 2rem', zIndex: 1, position: 'relative',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.7)',
          padding: '2.5rem 2.25rem',
          boxShadow: '0 20px 70px rgba(37,99,235,.12), 0 4px 20px rgba(0,0,0,0.06)',
          animation: `fadeUp .6s cubic-bezier(.16,1,.3,1), ${shake ? 'shake .5s ease' : 'none'}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top shimmer line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg,#2563eb,#7c3aed,#10b981)',
            backgroundSize: '200% 200%', animation: 'gradShift 4s ease infinite',
          }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg,#14b8a6,#0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '0.5rem',
            }}>CollabX</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: '0.35rem' }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Sign in to continue your study sessions</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
              padding: '0.75rem 1rem', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'slideIn .3s ease',
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '.03em', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                placeholder="you@example.com"
                required
                style={inputStyle('email')}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', letterSpacing: '.03em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: '0.78rem', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                   onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                   onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your password"
                  required
                  style={inputStyle('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center',
                    padding: 4, borderRadius: 6, transition: 'color .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem',
                borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)',
                backgroundSize: '200% 200%',
                animation: loading ? 'none' : 'gradShift 4s ease infinite',
                color: 'white', fontWeight: 700, fontSize: '0.95rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(37,99,235,.35)',
                transition: 'transform .2s, box-shadow .2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(37,99,235,.45)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 24px rgba(37,99,235,.35)'; }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,#e2e8f0)' }} />
            <span style={{ padding: '0 1rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,#e2e8f0,transparent)' }} />
          </div>

          {/* Google Login */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setLoading(true);
                try {
                  await googleLogin(credentialResponse.credential);
                  navigate('/dashboard');
                } catch {
                  setError('Google authentication failed. Please try again.');
                  triggerShake();
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => { setError('Google authentication failed.'); triggerShake(); }}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          {/* Footer */}
          <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#2563eb', fontWeight: 600, textDecoration: 'none',
              transition: 'color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.color = '#2563eb'}
            >
              Create one free →
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          By signing in, you agree to our{' '}
          <a href="#" style={{ color: '#64748b' }}>Terms</a> &amp;{' '}
          <a href="#" style={{ color: '#64748b' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}