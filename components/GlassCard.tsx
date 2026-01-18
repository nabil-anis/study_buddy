
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`apple-glass rounded-[24px] lg:rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] w-full max-w-full overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
