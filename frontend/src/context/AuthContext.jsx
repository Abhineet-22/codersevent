import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredTokens, setStoredTokens, getStoredUser, setStoredUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [tokens, setTokens] = useState(getStoredTokens());
  const [loading, setLoading] = useState(true);

  // Validate or restore session on mount
  useEffect(() => {
    async function initAuth() {
      const storedTokens = getStoredTokens();
      if (!storedTokens?.access_token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
        setStoredUser(currentUser);
      } catch (err) {
        // If access token expired, try refreshing
        if (storedTokens.refresh_token) {
          try {
            const newTokens = await api.refresh(storedTokens.refresh_token);
            setStoredTokens(newTokens);
            setTokens(newTokens);
            const currentUser = await api.getMe();
            setUser(currentUser);
            setStoredUser(currentUser);
          } catch (refreshErr) {
            // Invalid refresh token, clear session
            setStoredTokens(null);
            setStoredUser(null);
            setUser(null);
            setTokens(null);
          }
        } else {
          setStoredTokens(null);
          setStoredUser(null);
          setUser(null);
          setTokens(null);
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (username, password) => {
    const tokenData = await api.login(username, password);
    setStoredTokens(tokenData);
    setTokens(tokenData);

    const currentUser = await api.getMe();
    setUser(currentUser);
    setStoredUser(currentUser);
    return currentUser;
  };

  const logout = async (allDevices = false) => {
    try {
      if (tokens?.refresh_token) {
        await api.logout(tokens.refresh_token, allDevices);
      }
    } catch (e) {
      console.warn('Logout network call error (clearing local state anyway):', e);
    } finally {
      setStoredTokens(null);
      setStoredUser(null);
      setUser(null);
      setTokens(null);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.changePassword(oldPassword, newPassword);
    // After password change, backend revokes refresh tokens and bumps token_version.
    // User must log in again with their new password.
    setStoredTokens(null);
    setStoredUser(null);
    setUser(null);
    setTokens(null);
  };

  const value = {
    user,
    tokens,
    loading,
    isAuthenticated: !!user,
    mustChangePassword: !!user?.must_change_password,
    role: user?.role || null,
    isAdmin: user?.role === 'ADMIN',
    isCoordinator: user?.role === 'COORDINATOR' || user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF' || user?.role === 'COORDINATOR' || user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
