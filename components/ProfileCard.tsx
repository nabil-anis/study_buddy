
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
      <div className="flex items-center gap-3">
        <img src={userProfile.photo} alt={userProfile.name} className="w-11 h-11 rounded-full object-cover border-2 border-[var(--card-border)]" />
        <div className="hidden sm:block flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[var(--foreground)] truncate">{userProfile.name}</h3>
          {userProfile.email && <p className="text-xs text-[var(--foreground-muted)] truncate">{userProfile.email}</p>}
        </div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
  );
};

export default ProfileCard;
