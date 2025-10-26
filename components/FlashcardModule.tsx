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
            <CardsIcon className="w-16 h-16 text-[#FEB21A] mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#134686]">AI-Powered Flashcards</h2>
            <p className="text-[#134686]/80 mb-6 max-w-md">Enter a topic or upload a document, and we'll create a set of flashcards to help you study.</p>
            <div className="w-full max-w-sm space-y-4">
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); if(e.target.value) {setFileContent(null); setFileName('');} }}
                  placeholder="Enter a topic..."
                  className="w-full px-4 py-3 bg-white/50 rounded-lg border border-[#134686]/20 placeholder:text-[#134686]/60 focus:outline-none focus:ring-2 focus:ring-[#FEB21A] transition text-[#134686]"
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-center text-[#134686]/60">
                    <span className="flex-grow border-t border-[#134686]/20"></span>
                    <span className="px-2">OR</span>
                    <span className="flex-grow border-t border-[#134686]/20"></span>
                </div>
                 <label htmlFor="file-upload-flashcard" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#134686]/5 rounded-lg border border-[#134686]/20 hover:bg-[#134686]/10 transition text-[#134686]/80">
                    <UploadIcon className="w-5 h-5" />
                    <span className="truncate">{fileName || 'Upload a document'}</span>
                </label>
                <input id="file-upload-flashcard" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isProcessing} />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isProcessing}
              className="mt-6 px-8 py-3 bg-[#FEB21A] text-[#134686] font-bold rounded-lg hover:bg-[#FEB21A]/90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-[#FEB21A]/60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Crafting Knowledge Nuggets...' : isParsing ? 'Reading your document...' : 'Generate Flashcards'}
            </button>
          </Card>
        );
    }

    const currentCard = flashcards[currentIndex];

    return (
        <Card className="h-full flex flex-col items-center justify-between">
            <div className="w-full text-center">
                <p className="font-semibold text-[#134686]/90">Card {currentIndex + 1} of {flashcards.length}</p>
                <div className="w-full bg-[#FEB21A]/20 rounded-full h-2.5 my-4">
                    <div className="bg-[#FEB21A] h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
            </div>

            <div className="w-full flex-grow flex items-center justify-center perspective-[1000px] my-4">
                <div 
                    className={`w-full max-w-lg h-64 relative cursor-pointer flip-card ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className="absolute w-full h-full rounded-2xl flex items-center justify-center p-6 text-center text-xl font-semibold bg-white/80 border border-[#134686]/20 shadow-lg flip-card-front text-[#134686]">
                        {currentCard.front}
                    </div>
                    <div className="absolute w-full h-full rounded-2xl flex items-center justify-center p-6 text-center text-lg bg-[#FEB21A]/30 border border-[#FEB21A] shadow-lg flip-card-back text-[#134686]">
                        {currentCard.back}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-md">
                <button onClick={prevCard} disabled={currentIndex === 0} className="p-3 rounded-full bg-[#134686]/10 hover:bg-[#134686]/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <ChevronLeftIcon className="w-6 h-6 text-[#134686]" />
                </button>
                <button onClick={resetGenerator} className="px-6 py-2 bg-[#134686]/80 text-white rounded-lg hover:bg-[#134686]/70 transition">
                    New Topic
                </button>
                <button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="p-3 rounded-full bg-[#134686]/10 hover:bg-[#134686]/20 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <ChevronRightIcon className="w-6 h-6 text-[#134686]" />
                </button>
            </div>
        </Card>
    );
};

export default FlashcardModule;