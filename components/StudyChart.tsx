
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface ScratchpadProps {
  userProfile: UserProfile;
}

const Scratchpad: React.FC<ScratchpadProps> = ({ userProfile }) => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      if (supabase && userProfile.id) {
        const { data, error } = await supabase
          .from('notes')
          .select('content')
          .eq('user_id', userProfile.id)
          .single();
        if (!error && data) setNote(data.content);
      }
    };
    fetchNote();
  }, [userProfile.id]);

  useEffect(() => {
    const timer = setTimeout(() => saveNote(note), 1500);
    return () => clearTimeout(timer);
  }, [note]);

  const saveNote = async (content: string) => {
    if (!content || !userProfile.id) return;
    setIsSaving(true);
    if (supabase) {
      await supabase.from('notes').upsert({ user_id: userProfile.id, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-amber-50/10 dark:bg-amber-900/10 border border-amber-500/10 p-4 rounded-[22px] flex flex-col h-32 lg:h-44 transition-all duration-300">
      <div className="flex justify-between items-center mb-1.5">
        <h3 className="text-[9px] lg:text-[10px] font-bold text-amber-500 uppercase tracking-widest">Scratchpad</h3>
        {isSaving && <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Quick notes..."
        className="w-full flex-grow bg-transparent text-[var(--foreground)] rounded-md focus:outline-none resize-none text-[12px] lg:text-[13px] leading-relaxed placeholder:opacity-30"
      />
    </div>
  );
};

export default Scratchpad;
