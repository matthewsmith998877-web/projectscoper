import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify stored token
  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    if (!token) { setLoading(false); return; }
    api.get('/api/auth/me')
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('sb_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('sb_token', token);
    setUser(user);
    return user;
  }

  async function register(name, email, password) {
    const { token, user } = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('sb_token', token);
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('sb_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
