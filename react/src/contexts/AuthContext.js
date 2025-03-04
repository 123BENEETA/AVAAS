import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, authService } from '../services/api';

// Create auth context
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('authToken');
        setToken(null);
        setCurrentUser(null);
      }
      
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Sign up with email and password
  async function signup(name, email, password) {
    try {
      const data = await authService.register(name, email, password);
      
      const { token: authToken } = data;
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
      setCurrentUser(data);
      
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create account';
      setError(message);
      throw new Error(message);
    }
  }

  // Log in with email and password
  async function login(email, password) {
    try {
      const data = await authService.login(email, password);
      
      const { token: authToken } = data;
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
      setCurrentUser(data);
      
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password';
      setError(message);
      throw new Error(message);
    }
  }

  // Log in with Google
  async function loginWithGoogle(tokenId, profile) {
    try {
      const data = await authService.socialAuth('google', profile);
      
      const { token: authToken } = data;
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
      setCurrentUser(data);
      
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to sign in with Google';
      setError(message);
      throw new Error(message);
    }
  }

  // Log in with Facebook
  async function loginWithFacebook(tokenId, profile) {
    try {
      const data = await authService.socialAuth('facebook', profile);
      
      const { token: authToken } = data;
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
      setCurrentUser(data);
      
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to sign in with Facebook';
      setError(message);
      throw new Error(message);
    }
  }

  // Log out
  function logout() {
    localStorage.removeItem('authToken');
    setToken(null);
    setCurrentUser(null);
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request password reset';
      setError(message);
      throw new Error(message);
    }
  }

  // Update password with reset token
  async function completePasswordReset(token, password) {
    try {
      await authService.resetPassword(token, password);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      setError(message);
      throw new Error(message);
    }
  }

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    resetPassword,
    completePasswordReset,
    error,
    setError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
