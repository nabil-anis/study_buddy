import React, { useState } from 'react';
import { UserProfile } from '../types';
import ProfileCard from './ProfileCard';
import StudyChart from './StudyChart';
import QuizModule from './QuizModule';
import FlashcardModule from './FlashcardModule';
import SummarizerModule from './SummarizerModule';
import FileAssistantModule from './FileAssistantModule';
import PlannerModule from './PlannerModule';
import { BrainIcon, CardsIcon, SparklesIcon, FileTextIcon, PlannerIcon } from './icons';

interface DashboardProps {
  userProfile: UserProfile;
}

type ActiveModule = 'planner' | 'quiz' | 'flashcards' | 'summarizer' | 'files';

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('planner');
  
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
  
  const NavButton = ({ module, icon, label }: { module: ActiveModule, icon: React.ReactNode, label: string }) => (
      <button
          onClick={() => setActiveModule(module)}
          className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
              activeModule === module 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
      >
          {icon}
          <span className="font-semibold ml-4">{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 p-6 flex flex-col gap-8 bg-zinc-900 border-r border-zinc-800">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center font-bold text-lg">SB</div>
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

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100">Welcome back, {userProfile.name.split(' ')[0]}!</h1>
              <p className="text-zinc-400 mt-1">Ready to make your brain bigger?</p>
            </header>
            
            <div className="h-[calc(100%-120px)]">
                {renderModule()}
            </div>
        </main>
    </div>
  );
};

export default Dashboard;