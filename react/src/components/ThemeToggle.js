import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <div className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </div>
  );
};

export default ThemeToggle;
