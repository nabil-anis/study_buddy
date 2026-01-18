
import React from 'react';
import { Theme } from '../types';
import { SunIcon, MoonIcon } from './icons';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === Theme.Focus;
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-[52px] h-[28px] rounded-full p-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] apple-glass shadow-inner overflow-hidden ${
        isDark ? 'bg-zinc-800/80' : 'bg-zinc-200/80'
      }`}
      aria-label="Toggle Appearance"
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
          isDark ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
      >
        {isDark 
          ? <MoonIcon className="w-3 h-3 text-zinc-900 fill-zinc-900" strokeWidth={2.5} />
          : <SunIcon className="w-3 h-3 text-amber-500 fill-amber-500" strokeWidth={2.5} />
        }
      </div>
    </button>
  );
};

export default ThemeToggle;
