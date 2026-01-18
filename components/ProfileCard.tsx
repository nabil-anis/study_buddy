
import React from 'react';
import { UserProfile, Theme } from '../types';
import ThemeToggle from './ThemeToggle';

interface ProfileCardProps {
  userProfile: UserProfile;
  theme: Theme;
  toggleTheme: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userProfile, theme, toggleTheme }) => {
  return (
      <div className="flex items-center gap-6">
        <div className="text-right">
          <h3 className="text-[13px] font-bold text-[var(--foreground)] tracking-tight leading-none mb-1">{userProfile.name}</h3>
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500"></div>
            <p className="text-[9px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.1em] opacity-60">Verified Session</p>
          </div>
        </div>
        <div className="h-6 w-[0.5px] bg-[var(--card-border)]"></div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
  );
};

export default ProfileCard;
