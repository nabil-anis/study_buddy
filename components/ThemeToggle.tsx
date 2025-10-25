
import React from 'react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-300 ${
        theme === Theme.Calm ? 'bg-blue-300' : 'bg-gray-700'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          theme === Theme.Focus ? 'translate-x-6' : ''
        }`}
      >
        {theme === Theme.Calm ? '☀️' : '🌙'}
      </div>
    </button>
  );
};

export default ThemeToggle;
