import React, { useState, ChangeEvent } from 'react';
import { Flashcard } from '../types';
import Card from './GlassCard';
import { generateFlashcards, parseFileContent } from '../services/geminiService';
import { CardsIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon } from './icons';

const FlashcardModule: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        setIsParsing(true);
        try {
          const text = await parseFileContent(file);
          setFileContent(text);
          setTopic(''); // Clear topic if file is uploaded
        } catch (error) {
          console.error("Error parsing file:", error);
          alert("Sorry, I couldn't read that file. Please try a different one.");
          setFileName('');
        } finally {
          setIsParsing(false);
        }
        event.target.value = '';
      }
    };

    const handleGenerate = async () => {
        if (!topic && !fileContent) {
            alert("What should I make flashcards about? My social life? Let's stick to academic topics.");
            return;
        }
        setIsLoading(true);
        setFlashcards([]);
        try {
            const cardTopic = topic || `the uploaded document: ${fileName}`;
            const cards = await generateFlashcards(cardTopic, 10, fileContent ?? undefined);
            setFlashcards(cards);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error("Error generating flashcards:", error);
            alert("The AI seems to be having a moment. Could you try that again?");
        } finally {
            setIsLoading(false);
        }
    };
    
    const nextCard = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(i => i + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(i => i - 1), 150);
        }
    };
    
    const resetGenerator = () => {
        setFlashcards([]);
        setTopic('');
        setFileContent(null);
        setFileName('');
        setIsLoading(false);
    };

    if (flashcards.length === 0) {
        const isProcessing = isLoading || isParsing;
        return (
          <Card className="flex flex-col items-center justify-center h-full text-center">
            <CardsIcon className="w-16 h-16 text-[var(--secondary)] mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">AI-Powered Flashcards</h2>
            <p className="text-[var(--foreground-muted)] mb-8 max-w-md">Enter a topic or upload a document, and we'll create a set of flashcards to help you study.</p>
            <div className="w-full max-w-sm space-y-4">
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); if(e.target.value) {setFileContent(null); setFileName('');} }}
                  placeholder="e.g., 'The Krebs Cycle'"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] transition text-[var(--foreground)]"
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-center text-[var(--foreground-muted)] text-sm">
                    <span className="flex-grow border-t border-[var(--input-border)]"></span>
                    <span className="px-2">OR</span>
                    <span className="flex-grow border-t border-[var(--input-border)]"></span>
                </div>
                 <label htmlFor="file-upload-flashcard" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)]/5 rounded-lg border border-[var(--input-border)] hover:bg-[var(--primary)]/10 transition text-[var(--foreground-muted)]">
                    <UploadIcon className="w-5 h-5" />
                    <span className="truncate">{fileName || 'Upload a document'}</span>
                </label>
                <input id="file-upload-flashcard" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isProcessing} />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isProcessing}
              className="mt-8 px-8 py-3 bg-[var(--secondary)] text-[var(--secondary-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isProcessing ? <><div className="loader !border-[var(--secondary-foreground)] !border-b-transparent"></div><span>Processing...</span></> : 'Generate Flashcards'}
            </button>
          </Card>
        );
    }

    const currentCard = flashcards[currentIndex];

    return (
        <Card className="h-full flex flex-col items-center justify-between p-4 sm:p-6">
            <div className="w-full text-center">
                <p className="font-semibold text-[var(--foreground)]/90">Card {currentIndex + 1} of {flashcards.length}</p>
                <div className="w-full bg-[var(--secondary)]/20 rounded-full h-2.5 my-4 max-w-md mx-auto">
                    <div className="bg-[var(--secondary)] h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
            </div>

            <div className="w-full flex-grow flex items-center justify-center perspective-[1000px] my-4">
                <div 
                    className={`w-full max-w-lg h-64 sm:h-80 relative cursor-pointer flip-card ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className="absolute w-full h-full rounded-2xl flex items-center justify-center p-6 text-center text-xl sm:text-2xl font-semibold bg-[var(--input-bg)] border-2 border-[var(--card-border)] shadow-lg flip-card-front text-[var(--foreground)]">
                        {currentCard.front}
                    </div>
                    <div className="absolute w-full h-full rounded-2xl flex items-center justify-center p-6 text-center text-lg sm:text-xl bg-[var(--secondary)]/30 border-2 border-[var(--secondary)] shadow-lg flip-card-back text-[var(--foreground)]">
                        {currentCard.back}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-lg">
                <button onClick={prevCard} disabled={currentIndex === 0} className="p-4 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <ChevronLeftIcon className="w-7 h-7 text-[var(--primary)]" />
                </button>
                <button onClick={resetGenerator} className="px-6 py-3 bg-[var(--primary)]/80 text-white font-semibold rounded-lg hover:bg-opacity-70 transition">
                    New Topic
                </button>
                <button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="p-4 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <ChevronRightIcon className="w-7 h-7 text-[var(--primary)]" />
                </button>
            </div>
        </Card>
    );
};

export default FlashcardModule;