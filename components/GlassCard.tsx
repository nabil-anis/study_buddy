import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;