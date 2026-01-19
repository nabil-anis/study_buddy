
import React, { useState, useEffect } from 'react';
import { UserProfile, Theme } from '../types';
import ProfileCard from './ProfileCard';
import Scratchpad from './StudyChart';
import QuizModule from './QuizModule';
import FlashcardModule from './FlashcardModule';
import SummarizerModule from './SummarizerModule';
import FileAssistantModule from './FileAssistantModule';
import PlannerModule from './PlannerModule';
import LiveTutorModule from './LiveTutorModule';
import AnalyticsModule from './AnalyticsModule';
import { getStudyTip } from '../services/geminiService';
import { BrainIcon, CardsIcon, SparklesIcon, FileTextIcon, PlannerIcon, MenuIcon, TutorIcon, ChartBarIcon } from './icons';

interface DashboardProps {
  userProfile: UserProfile;
  theme: Theme;
  toggleTheme: () => void;
}

type ActiveModule = 'planner' | 'quiz' | 'flashcards' | 'summarizer' | 'files' | 'tutor' | 'analytics';

const Dashboard: React.FC<DashboardProps> = ({ userProfile, theme, toggleTheme }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('planner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studyTip, setStudyTip] = useState('Synchronizing assets...');

  useEffect(() => {
    getStudyTip().then(setStudyTip);
  }, []);
  
  const NavItem = ({ module, icon, label }: { module: ActiveModule, icon: React.ReactNode, label: string }) => {
    const active = activeModule === module;
    return (
      <button
        onClick={() => { setActiveModule(module); setIsSidebarOpen(false); }}
        className={`flex items-center w-full px-4 py-3.5 rounded-2xl transition-all duration-500 group apple-pill ${
          active 
          ? 'bg-[var(--primary)] text-white shadow-[0_10px_30px_rgba(0,113,227,0.25)]' 
          : 'text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/[0.04] hover:text-[var(--foreground)]'
        }`}
      >
        <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {/* FIX: Cast icon to any to avoid "strokeWidth" property error on unknown type */}
          {React.cloneElement(icon as any, { strokeWidth: 1.2 })}
        </div>
        <span className="ml-4 text-[14px] font-semibold tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full bg-transparent overflow-hidden relative">
      {/* Sidebar Island - Adjusted for strict mobile safety */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[60] w-[280px] lg:w-[300px] apple-glass sidebar-island m-4 lg:m-6 p-6 lg:p-8 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-xl">
            <span className="text-lg font-bold italic">S</span>
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-tighter">Workspace</h1>
            <span className="text-[9px] uppercase font-black tracking-widest text-[var(--foreground-muted)] opacity-60">Pro Edition</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
          <NavItem module="planner" icon={<PlannerIcon className="w-5 h-5" />} label="Planner" />
          <NavItem module="tutor" icon={<TutorIcon className="w-5 h-5" />} label="Live Voice" />
          <NavItem module="analytics" icon={<ChartBarIcon className="w-5 h-5" />} label="Progress" />
          
          <div className="mt-8 mb-3 px-4 text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest opacity-40">Intelligence</div>
          
          <NavItem module="quiz" icon={<BrainIcon className="w-5 h-5" />} label="Quizzes" />
          <NavItem module="flashcards" icon={<CardsIcon className="w-5 h-5" />} label="Memory" />
          <NavItem module="summarizer" icon={<SparklesIcon className="w-5 h-5" />} label="Synthesis" />
          <NavItem module="files" icon={<FileTextIcon className="w-5 h-5" />} label="Library" />
        </nav>

        <div className="mt-auto pt-6 space-y-4">
          <Scratchpad userProfile={userProfile} />
          <div className="pt-4 border-t border-[var(--card-border)] opacity-60">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--foreground)] mb-0.5">Designed by</p>
            <p className="text-[12px] font-extrabold tracking-tighter text-[var(--foreground)]">Study Buddy Inc.</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative p-4 lg:p-8 overflow-hidden">
        {/* Header - Fixed Height */}
        <header className="flex justify-between items-center h-14 mb-4 lg:mb-10 flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 -ml-2 rounded-full hover:bg-[var(--foreground)]/5 transition-colors">
            <MenuIcon className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 min-w-0">
            <h2 className="text-xl lg:text-3xl font-extrabold tracking-tighter truncate leading-none">
              {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-5 apple-glass px-4 py-2 rounded-full shadow-sm">
            <ProfileCard userProfile={userProfile} theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>

        {/* Dynamic Content Area - Robust scroll container */}
        <section className="flex-grow min-h-0 w-full relative">
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pr-1 -mr-1 pb-10">
            {(() => {
              switch (activeModule) {
                case 'planner': return <PlannerModule userProfile={userProfile} />;
                case 'quiz': return <QuizModule userProfile={userProfile} />;
                case 'flashcards': return <FlashcardModule userProfile={userProfile} />;
                case 'summarizer': return <SummarizerModule userProfile={userProfile} />;
                case 'files': return <FileAssistantModule userProfile={userProfile} />;
                case 'tutor': return <LiveTutorModule userProfile={userProfile} />;
                case 'analytics': return <AnalyticsModule userProfile={userProfile} />;
                default: return <PlannerModule userProfile={userProfile} />;
              }
            })()}
          </div>
        </section>
      </main>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xl z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default Dashboard;
