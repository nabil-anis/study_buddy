
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, UserProfile, Theme } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { supabase } from './services/supabaseClient';

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

  const handleLogin = useCallback(async (name: string, email: string) => {
    let profile: UserProfile = {
      name,
      email,
      photo: `https://picsum.photos/seed/${email}/200`,
    };

    if (supabase) {
      try {
        // Find existing profile by email
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (data) {
          profile = { 
            id: data.id, 
            name: data.name, 
            email: data.email, 
            photo: data.photo_url || profile.photo 
          };
        } else {
          // Create new profile
          const { data: newData, error: insertError } = await supabase
            .from('profiles')
            .insert([{ name, email, photo_url: profile.photo }])
            .select()
            .single();
          
          if (!insertError && newData) {
            profile.id = newData.id;
          }
        }
      } catch (err) {
        console.error("Failed to sync profile with Supabase", err);
      }
    }

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
