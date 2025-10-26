import React, { useState, useCallback } from 'react';
import { AppState, UserProfile } from './types';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleLogin = useCallback(() => {
    setAppState(AppState.Onboarding);
  }, []);

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setAppState(AppState.Dashboard);
  }, []);
  
  const renderContent = () => {
    switch (appState) {
      case AppState.Landing:
        return <LandingPage onLogin={handleLogin} />;
      case AppState.Onboarding:
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case AppState.Dashboard:
        return userProfile ? <Dashboard userProfile={userProfile} /> : <LandingPage onLogin={handleLogin} />;
      default:
        return <LandingPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      <div className="background"></div>
      {renderContent()}
    </div>
  );
};

export default App;