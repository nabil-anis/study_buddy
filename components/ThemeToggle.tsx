import React from 'react';
import { Theme } from '../types';
import { SunIcon, MoonIcon } from './icons';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isCalm = theme === Theme.Calm;
  return (
    <button
      onClick={toggleTheme}
      className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-300 relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:ring-[var(--primary)] ${
        isCalm ? 'bg-[var(--primary)]' : 'bg-slate-700'
      }`}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isCalm ? 'translate-x-0' : 'translate-x-6'
        }`}
      >
        {isCalm 
          ? <SunIcon className="w-4 h-4 text-yellow-500" />
          : <MoonIcon className="w-4 h-4 text-slate-700" />
        }
      </div>
    </button>
  );
};

export default ThemeToggle;