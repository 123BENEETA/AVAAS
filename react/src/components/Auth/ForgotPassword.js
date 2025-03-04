import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword, error, setError } = useAuth();
  
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setMessage('');
    setError('');
    
    // Validate email
    const isEmailValid = validateEmail();
    if (!isEmailValid) return;
    
    try {
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for password reset instructions');
      setLoading(false);
    } catch (error) {
      console.error('Error during password reset:', error);
      
      // The error code check is now handled by our MongoDB backend through the AuthContext
      if (error.message.includes('No account with that email')) {
        setError('No account with that email was found');
      } else {
        setError('Failed to reset password. Please try again.');
      }
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-form-container">
      <button 
        type="button" 
        className="back-button"
        onClick={onBackToLogin}
      >
        <FaArrowLeft /> Back to Login
      </button>
      
      <h2>Reset Password</h2>
      <p>Enter your email to receive password reset instructions</p>
      
      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="reset-email">Email</label>
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            placeholder="Enter your email"
            className={emailError ? 'error' : ''}
          />
          {emailError && <div className="error-message">{emailError}</div>}
        </div>
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
