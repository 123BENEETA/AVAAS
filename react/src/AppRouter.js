import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Auth from './components/Auth/Auth';
import PrivateRoute from './components/Auth/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

export default function AppRouter() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<App />} />
          </Route>
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
