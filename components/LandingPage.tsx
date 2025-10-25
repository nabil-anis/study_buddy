import React from 'react';
import Card from './GlassCard'; // Re-using the component, but it's styled as a solid card now
import { BrainIcon, SparklesIcon, FileTextIcon, CardsIcon } from './icons';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 text-zinc-100 overflow-hidden">
      <div className="text-center mb-10 animate-fade-in-down">
         <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          Welcome to Study Buddy
        </h1>
        <p className="mt-4 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
          Your new AI study companion. Smarter, quieter, and won't steal your snacks.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <Card>
          <h2 className="text-2xl font-bold mb-2 text-zinc-100 text-center">Get Started</h2>
          <p className="text-zinc-400 mb-6 text-center">Unlock your brain's full potential. Seriously.</p>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="your-smart-email@university.com" 
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-zinc-100" />
              <input 
                type="password" 
                placeholder="A-Super-Secret-Password" 
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-zinc-100" />
            </div>
            <button type="submit" className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg">
              Sign Up & Study
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;