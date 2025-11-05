
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, UserProfile, Theme } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<Theme>(Theme.Calm);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === Theme.Calm ? Theme.Focus : Theme.Calm);
  }, []);

  useEffect(() => {
    if (theme === Theme.Focus) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = useCallback((name: string) => {
    const profile: UserProfile = {
      name,
      photo: `https://picsum.photos/seed/${name}/200`,
    };
    setUserProfile(profile);
    setAppState(AppState.Dashboard);
  }, []);
  
  const renderContent = () => {
    switch (appState) {
      case AppState.Landing:
        return <LandingPage onLogin={handleLogin} />;
      case AppState.Dashboard:
        return userProfile ? <Dashboard userProfile={userProfile} theme={theme} toggleTheme={toggleTheme} /> : <LandingPage onLogin={handleLogin} />;
      default:
        return <LandingPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default App;
