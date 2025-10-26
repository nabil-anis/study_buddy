import React, { useState } from 'react';
import { UserProfile } from '../types';
import ProfileCard from './ProfileCard';
import StudyChart from './StudyChart';
import QuizModule from './QuizModule';
import FlashcardModule from './FlashcardModule';
import SummarizerModule from './SummarizerModule';
import FileAssistantModule from './FileAssistantModule';
import PlannerModule from './PlannerModule';
import { BrainIcon, CardsIcon, SparklesIcon, FileTextIcon, PlannerIcon, MenuIcon } from './icons';

interface DashboardProps {
  userProfile: UserProfile;
}

type ActiveModule = 'planner' | 'quiz' | 'flashcards' | 'summarizer' | 'files';

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('planner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
          className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
              activeModule === module 
              ? 'bg-[#134686] text-white shadow-lg' 
              : 'text-[#134686]/70 hover:bg-[#134686]/10 hover:text-[#134686]'
          }`}
      >
          {icon}
          <span className="font-semibold ml-4">{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-transparent text-[#134686]">
        {/* Sidebar */}
        <aside className={`absolute md:relative inset-y-0 left-0 z-30 w-72 flex-shrink-0 p-6 flex flex-col gap-8 bg-white/40 backdrop-blur-md border-r border-white/60 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-[#134686] to-[#ED3F27] rounded-lg flex items-center justify-center font-bold text-lg text-white">SB</div>
               <h1 className="text-xl font-bold">Study Buddy</h1>
            </div>
            
            <nav className="flex flex-col gap-2">
                <NavButton module="planner" icon={<PlannerIcon className="w-6 h-6" />} label="Planner" />
                <NavButton module="quiz" icon={<BrainIcon className="w-6 h-6" />} label="Quizzes" />
                <NavButton module="flashcards" icon={<CardsIcon className="w-6 h-6" />} label="Flashcards" />
                <NavButton module="summarizer" icon={<SparklesIcon className="w-6 h-6" />} label="Summarizer" />
                <NavButton module="files" icon={<FileTextIcon className="w-6 h-6" />} label="File Chat" />
            </nav>

            <div className="mt-auto flex flex-col gap-6">
                <StudyChart />
                <ProfileCard userProfile={userProfile} />
            </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div
                className="fixed inset-0 bg-black/40 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto min-w-0">
            <header className="mb-6 md:mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#134686]">Welcome back, {userProfile.name.split(' ')[0]}!</h1>
                <p className="text-[#134686]/70 mt-1 text-sm sm:text-base">Ready to make your brain bigger?</p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-[#134686]/70 hover:bg-[#134686]/10"
                aria-label="Open menu"
              >
                  <MenuIcon className="w-6 h-6" />
              </button>
            </header>
            
            {renderModule()}
        </main>
    </div>
  );
};

export default Dashboard;