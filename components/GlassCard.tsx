import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/40 backdrop-blur-lg border border-white/60 rounded-2xl p-6 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;