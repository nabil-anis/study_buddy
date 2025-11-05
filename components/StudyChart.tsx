import React, { useState, useEffect } from 'react';

const Scratchpad: React.FC = () => {
  const [note, setNote] = useState('');

  // Load note from localStorage on initial render
  useEffect(() => {
    try {
      const savedNote = localStorage.getItem('studyBuddyScratchpad');
      if (savedNote) {
        setNote(savedNote);
      }
    } catch (error) {
      console.error("Could not read from localStorage", error);
    }
  }, []);

  // Save note to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('studyBuddyScratchpad', note);
    } catch (error) {
      console.error("Could not write to localStorage", error);
    }
  }, [note]);

  return (
    <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/10 p-3 rounded-lg flex flex-col h-48">
      <h3 className="text-sm font-bold mb-2 px-1 text-[var(--foreground)]">Scratchpad</h3>
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