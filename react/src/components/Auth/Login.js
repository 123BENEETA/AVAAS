import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login({ onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginWithFacebook, error, setError } = useAuth();
  const navigate = useNavigate();
  
  // Check for caps lock
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.getModifierState('CapsLock')) {
        setCapsLockOn(true);
      } else {
        setCapsLockOn(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Email validation
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };
  
  // Password validation
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setError('');
    
    // Validate inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) return;
    
    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during login:', error);
      setLoading(false);
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, implement proper Google OAuth
      // For now, we'll simulate it with a mock profile
      const profile = {
        name: 'Google User',
        email: `google_user_${Date.now()}@example.com`,
      };
      
      await loginWithGoogle('mock-token', profile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during Google login:', error);
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };
  
  // Handle Facebook login
  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In a real app, implement proper Facebook OAuth
      // For now, we'll simulate it with a mock profile
      const profile = {
        name: 'Facebook User',
        email: `facebook_user_${Date.now()}@example.com`,
      };
      
      await loginWithFacebook('mock-token', profile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during Facebook login:', error);
      setError('Failed to sign in with Facebook');
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>Welcome back!</h2>
      <p>Log in to your account to continue</p>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            placeholder="Enter your email"
            className={emailError ? 'error' : ''}
          />
          {emailError && <div className="error-message">{emailError}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              placeholder="Enter your password"
              className={passwordError ? 'error' : ''}
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordError && <div className="error-message">{passwordError}</div>}
          {capsLockOn && <div className="caps-lock-warning">Caps Lock is on!</div>}
        </div>
        
        <div className="forgot-password">
          <button type="button" onClick={onForgotPassword} className="text-button">
            Forgot your password?
          </button>
        </div>
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="social-login">
        <p>Or login with</p>
        <div className="social-buttons">
          <button 
            type="button" 
            className="social-button google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FaGoogle /> Google
          </button>
          <button 
            type="button" 
            className="social-button facebook"
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <FaFacebook /> Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
