import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-[var(--card-bg)] backdrop-blur-2xl border border-[var(--card-border)] rounded-2xl p-6 shadow-2xl transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;