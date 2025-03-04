import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaGoogle, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup, loginWithGoogle, loginWithFacebook, error, setError } = useAuth();
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

  // Name validation
  const validateName = () => {
    if (!name) {
      setNameError('Name is required');
      return false;
    } else if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    } else {
      setNameError('');
      return true;
    }
  };
  
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
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  // Confirm password validation
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setError('');
    
    // Validate inputs
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) return;
    
    try {
      setLoading(true);
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during signup:', error);
      setLoading(false);
    }
  };
  
  // Handle Google signup
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      // Get user info from Google token
      // In a real app, decode the credential or send it to your backend
      // For simplicity, we'll create a mock profile
      const profile = {
        name: 'Google User', // In a real app, extract this from the credential
        email: `google_user_${Date.now()}@example.com`, // In a real app, extract this from the credential
      };
      
      await loginWithGoogle(credentialResponse.credential, profile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during Google signup:', error);
      setLoading(false);
    }
  };
  
  // Handle Facebook signup
  const handleFacebookSuccess = async (response) => {
    try {
      setLoading(true);
      setError('');
      
      if (response.accessToken) {
        const profile = {
          name: response.name,
          email: response.email,
        };
        
        await loginWithFacebook(response.accessToken, profile);
        navigate('/dashboard');
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (error) {
      console.error('Error during Facebook signup:', error);
      setError('Failed to sign up with Facebook');
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-form-container">
      <h2>Create Account</h2>
      <p>Sign up to use AVAASS system</p>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="signup-name">Name</label>
          <input
            type="text"
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            placeholder="Enter your name"
            className={nameError ? 'error' : ''}
          />
          {nameError && <div className="error-message">{nameError}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            type="email"
            id="signup-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            placeholder="Enter your email"
            className={emailError ? 'error' : ''}
          />
          {emailError && <div className="error-message">{emailError}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              placeholder="Create a password"
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
        
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={validateConfirmPassword}
            placeholder="Confirm your password"
            className={confirmPasswordError ? 'error' : ''}
          />
          {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
        </div>
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="social-login">
        <p>Or sign up with</p>
        <div className="social-buttons">
          {/* For proper Google integration, install and configure @react-oauth/google */}
          <button 
            type="button" 
            className="social-button google"
            onClick={() => handleGoogleSuccess({ credential: 'mock-token' })}
            disabled={loading}
          >
            <FaGoogle /> Google
          </button>
          
          {/* For proper Facebook integration, install and configure react-facebook-login */}
          <button 
            type="button" 
            className="social-button facebook"
            onClick={() => handleFacebookSuccess({ 
              accessToken: 'mock-token',
              name: 'Facebook User',
              email: `facebook_user_${Date.now()}@example.com`
            })}
            disabled={loading}
          >
            <FaFacebook /> Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
