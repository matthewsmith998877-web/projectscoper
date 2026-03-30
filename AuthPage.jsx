import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('login');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');

  // Register form state
  const [regName,  setRegName]  = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass,  setRegPass]  = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPass);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(regName, regEmail, regPass);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          Agency Tools
          <span>ScopeBuilder</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Sign in
          </button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@agency.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="auth-hint">
              Admin: admin@agency.com / admin1234
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="field">
              <label>Name</label>
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@agency.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="min. 6 characters" required />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
