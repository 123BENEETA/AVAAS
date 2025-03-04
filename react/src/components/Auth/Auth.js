import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import './Auth.css';
import logo from '../../assets/logo.png'; // Make sure you have a logo image

export default function Auth() {
  const [mode, setMode] = useState('login');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <img src={logo} alt="AVAASS Logo" className="auth-logo" />
          <h1>AVAASS</h1>
          <p>Advanced Voice and Audio Assistance for Stammering Support</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-content">
          {mode === 'login' && <Login onForgotPassword={() => setMode('forgot')} />}
          {mode === 'signup' && <Signup />}
          {mode === 'forgot' && (
            <ForgotPassword onBackToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
