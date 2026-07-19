import { createContext, useContext, useState, useEffect } from 'react';
import { isLiveMode } from '../config/appMode';
import { getCurrentUser, loginWithApi, clearAuthToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (!isLiveMode) return;
    if (!localStorage.getItem('auth_token')) return;

    getCurrentUser()
      .then((res) => {
        if (res?.user) setUser(res.user);
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      });
  }, []);

  // Global sign-out when any request hits a 401 (token expired/invalid mid-session).
  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthToken();
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = async (username, password) => {
    if (isLiveMode) {
      try {
        const res = await loginWithApi(username, password);
        if (res?.user) {
          setUser(res.user);
          return { success: true };
        }
        return { success: false, error: 'Invalid email or password' };
      } catch (err) {
        return { success: false, error: err?.message || 'Invalid email or password' };
      }
    }

    // Demo sandbox only (no backend). Fixed, clearly-fake logins that unlock the local demo
    // dataset — these are NOT real accounts and do not work against the live API.
    const DEMO_USERS = {
      'demo-admin': { password: 'demo', role: 'admin', name: 'Demo Admin' },
      'demo-member': { password: 'demo', role: 'member', name: 'Demo Member', flatNumber: 'A-101' },
    };
    const match = DEMO_USERS[(username || '').toLowerCase().trim()];
    if (match && password === match.password) {
      const userData = { username, role: match.role, name: match.name };
      if (match.flatNumber) userData.flatNumber = match.flatNumber;
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Invalid demo credentials' };
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
