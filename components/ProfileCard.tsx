import React from 'react';
import { UserProfile } from '../types';

interface ProfileCardProps {
  userProfile: UserProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userProfile }) => {
  return (
      <div className="flex items-center gap-4">
        <img src={userProfile.photo} alt={userProfile.name} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700" />
        <div>
          <h3 className="text-md font-bold text-zinc-100">{userProfile.name}</h3>
          <p className="text-sm text-zinc-400">{userProfile.email}</p>
        </div>
      </div>
  );
};

export default ProfileCard;