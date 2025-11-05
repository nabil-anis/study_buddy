import React, { useState, useEffect } from 'react';
import { UserProfile, Theme } from '../types';
import ProfileCard from './ProfileCard';
import Scratchpad from './StudyChart';
import QuizModule from './QuizModule';
import FlashcardModule from './FlashcardModule';
import SummarizerModule from './SummarizerModule';
import FileAssistantModule from './FileAssistantModule';
import PlannerModule from './PlannerModule';
import { getStudyTip } from '../services/geminiService';
import { BrainIcon, CardsIcon, SparklesIcon, FileTextIcon, PlannerIcon, MenuIcon, LightbulbIcon } from './icons';

interface DashboardProps {
  userProfile: UserProfile;
  theme: Theme;
  toggleTheme: () => void;
}

type ActiveModule = 'planner' | 'quiz' | 'flashcards' | 'summarizer' | 'files';

const Dashboard: React.FC<DashboardProps> = ({ userProfile, theme, toggleTheme }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('planner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studyTip, setStudyTip] = useState('Loading your daily inspiration...');

  useEffect(() => {
    const fetchTip = async () => {
        const tip = await getStudyTip();
        setStudyTip(tip);
    };
    fetchTip();
  }, []);
  
  const renderModule = () => {
    switch (activeModule) {
      case 'planner':
        return <PlannerModule />;
      case 'quiz':
        return <QuizModule />;
      case 'flashcards':
        return <FlashcardModule />;
      case 'summarizer':
        return <SummarizerModule />;
      case 'files':
        return <FileAssistantModule />;
      default:
        return <PlannerModule />;
    }
  };
  
  const handleNavClick = (module: ActiveModule) => {
    setActiveModule(module);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  const NavButton = ({ module, icon, label }: { module: ActiveModule, icon: React.ReactNode, label: string }) => (
      <button
          onClick={() => handleNavClick(module)}
          className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
              activeModule === module 
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg' 
              : 'text-[var(--foreground-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--foreground)]'
          }`}
      >
          {icon}
          <span className="font-semibold ml-4">{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-transparent text-[var(--foreground)]">
        {/* Sidebar */}
        <aside className={`absolute md:relative inset-y-0 left-0 z-30 w-72 flex-shrink-0 p-6 flex flex-col gap-8 overflow-y-auto bg-[var(--card-bg)] backdrop-blur-xl border-r border-[var(--card-border)] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-lg flex items-center justify-center font-bold text-lg text-white">SB</div>
               <h1 className="text-xl font-bold">Study Buddy</h1>
            </div>
            
            <div className="md:hidden my-4">
              <ProfileCard userProfile={userProfile} theme={theme} toggleTheme={toggleTheme} />
            </div>

            <nav className="flex flex-col gap-3">
                <NavButton module="planner" icon={<PlannerIcon className="w-6 h-6" />} label="Planner" />
                <NavButton module="quiz" icon={<BrainIcon className="w-6 h-6" />} label="Quizzes" />
                <NavButton module="flashcards" icon={<CardsIcon className="w-6 h-6" />} label="Flashcards" />
                <NavButton module="summarizer" icon={<SparklesIcon className="w-6 h-6" />} label="Summarizer" />
                <NavButton module="files" icon={<FileTextIcon className="w-6 h-6" />} label="File Chat" />
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                <div className="p-4 rounded-lg bg-[var(--primary)]/5 text-center border border-[var(--primary)]/10">
                    <LightbulbIcon className="w-6 h-6 mx-auto text-[var(--secondary)] mb-2" />
                    <p className="text-sm font-medium text-[var(--foreground-muted)] italic">"{studyTip}"</p>
                </div>
                <Scratchpad />
            </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto min-w-0">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]">Welcome back, {userProfile.name.split(' ')[0]}!</h1>
                <p className="text-[var(--foreground-muted)] mt-1 text-sm sm:text-base">Ready to make your brain bigger?</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  <ProfileCard userProfile={userProfile} theme={theme} toggleTheme={toggleTheme} />
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 rounded-lg text-[var(--foreground-muted)] bg-[var(--card-bg)] border border-[var(--card-border)]"
                  aria-label="Open menu"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
              </div>
            </header>
            
            <div className="h-[calc(100%-80px)]">
              {renderModule()}
            </div>
        </main>
    </div>
  );
};

export default Dashboard;