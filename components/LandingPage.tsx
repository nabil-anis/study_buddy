
import React, { useState } from 'react';
import Card from './GlassCard';

interface LandingPageProps {
  onLogin: (name: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    } else {
      alert("Please enter your name. The AI wants to greet you properly!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 text-[var(--foreground)] overflow-hidden relative">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="text-center mb-12 animate-fade-in-down">
           <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] pb-2">
            Study Buddy
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto">
           Built to make you smarter — or at least look like it.
          </p>
        </div>

        <div className="w-full max-w-md mx-auto animate-fade-in-up">
          <Card>
            <h2 className="text-3xl font-bold mb-2 text-[var(--foreground)] text-center">Welcome!</h2>
            <p className="text-[var(--foreground-muted)] mb-8 text-center">What should we call you?</p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..." 
                  className="w-full px-4 py-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition text-[var(--foreground)]" />
              </div>
              <button type="submit" className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                Start Studying
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;