import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface ScratchpadProps {
  userProfile: UserProfile;
}

const Scratchpad: React.FC<ScratchpadProps> = ({ userProfile }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load note from Supabase or localStorage
  useEffect(() => {
    const fetchNote = async () => {
      if (supabase && userProfile.id) {
        const { data, error } = await supabase
          .from('notes')
          .select('content')
          .eq('user_id', userProfile.id)
          .single();
        
        if (!error && data) {
          setNote(data.content);
          return;
        }
      }
      
      // Fallback to localStorage
      try {
        const savedNote = localStorage.getItem('studyBuddyScratchpad');
        if (savedNote) {
          setNote(savedNote);
        }
      } catch (error) {
        console.error("Could not read from localStorage", error);
      }
    };

    fetchNote();
  }, [userProfile.id]);

  // Debounced save function
  useEffect(() => {
    const timer = setTimeout(() => {
      saveNote(note);
    }, 1000);

    return () => clearTimeout(timer);
  }, [note]);

  const saveNote = async (content: string) => {
    if (!content) return;
    setIsSaving(true);
    
    if (supabase && userProfile.id) {
      try {
        const { error } = await supabase
          .from('notes')
          .upsert({ user_id: userProfile.id, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        
        if (error) console.error("Supabase Save Note Error:", error);
      } catch (err) {
        console.error("Supabase Save Note Exception:", err);
      }
    }

    try {
      localStorage.setItem('studyBuddyScratchpad', content);
    } catch (error) {
      console.error("Could not write to localStorage", error);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/10 p-3 rounded-lg flex flex-col h-48">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Scratchpad</h3>
        {isSaving && <span className="text-[8px] uppercase tracking-widest text-[var(--primary)] animate-pulse">Saving...</span>}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Jot down quick notes..."
        className="w-full flex-grow bg-transparent text-[var(--foreground)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none text-sm p-1"
        style={{ scrollbarWidth: 'thin' }}
      />
    </div>
  );
};

export default Scratchpad;