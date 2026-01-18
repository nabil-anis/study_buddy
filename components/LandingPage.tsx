
import React, { useState } from 'react';

interface LandingPageProps {
  onLogin: (name: string, email: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onLogin(name.trim(), email.trim());
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-transparent relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-block px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black tracking-[0.2em] uppercase rounded-full mb-6">
            Pro Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-[var(--foreground)] mb-4">
            Study Buddy
          </h1>
          <p className="text-[17px] font-medium text-[var(--foreground-muted)] max-w-sm mx-auto leading-relaxed">
            Elevate your academic workflow with spatial intelligence.
          </p>
        </header>

        <div className="apple-glass p-10 rounded-[40px] premium-shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider ml-1">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name" 
                className="w-full px-5 py-4 ios-input rounded-[16px] text-[15px] font-medium text-[var(--foreground)] focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider ml-1">Academic Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" 
                className="w-full px-5 py-4 ios-input rounded-[16px] text-[15px] font-medium text-[var(--foreground)] focus:outline-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={!name || !email}
              className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 apple-pill text-[15px] shadow-lg disabled:opacity-20 mt-4"
            >
              Continue to Workspace
            </button>
          </form>
        </div>
        
        <footer className="mt-12 text-center">
          <p className="text-[12px] font-semibold text-[var(--foreground-muted)] opacity-40">Designed by Study Buddy Inc. &bull; Cupertino</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
