
import React, { useState, ChangeEvent } from 'react';
import Card from './GlassCard';
import { summarizeText, parseFileContent } from '../services/geminiService';
import { SparklesIcon, UploadIcon } from './icons';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface SummarizerModuleProps {
    userProfile?: UserProfile;
}

const SummarizerModule: React.FC<SummarizerModuleProps> = ({ userProfile }) => {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        setIsParsing(true);
        setSummary('');
        try {
            const text = await parseFileContent(file);
            setInputText(text);
        } catch (error) {
            console.error("Error parsing file:", error);
            setFileName('');
        } finally {
            setIsParsing(false);
        }
      }
    };

    const handleSummarize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setSummary('');
        try {
            const result = await summarizeText(inputText);
            setSummary(result);
            if (supabase && userProfile?.id) {
                await supabase.from('summaries').insert([{
                    user_id: userProfile.id,
                    topic: fileName || inputText.substring(0, 50),
                    content: result
                }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col p-6 lg:p-10 min-h-[600px] lg:h-full">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tighter">Synthesis</h2>
                    <p className="text-[var(--foreground-muted)] text-sm font-medium">Condense knowledge into core insights.</p>
                </div>
                <label className="apple-pill px-6 py-2.5 bg-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.08] cursor-pointer flex items-center gap-2 text-[12px] font-bold w-full sm:w-auto justify-center">
                    <UploadIcon className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{fileName || 'Upload Doc'}</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx" />
                </label>
            </header>
            
            <div className="flex flex-col flex-grow gap-8 min-h-0 overflow-visible lg:overflow-hidden">
                <div className="flex flex-col gap-3 h-[300px] lg:h-1/2 flex-shrink-0 lg:flex-shrink">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] opacity-50 ml-1">Input Text</span>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste or upload your reading material..."
                        className="w-full h-full p-5 lg:p-6 ios-input text-[14px] lg:text-[15px] leading-relaxed resize-none focus:outline-none rounded-[24px]"
                    />
                </div>

                <div className="flex flex-col gap-3 min-h-[200px] lg:h-1/2 flex-grow overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] opacity-50 ml-1">AI Summary</span>
                    <div className="w-full h-full p-6 lg:p-8 rounded-[24px] bg-[var(--primary)]/[0.03] border border-[var(--primary)]/[0.1] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="loader !w-6 !h-6"></div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Synthesizing Assets...</p>
                            </div>
                        ) : (
                            summary ? (
                                <p className="text-[14.5px] lg:text-[16px] font-medium leading-[1.65] text-[var(--foreground)] animate-fade-in">{summary}</p>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                   <SparklesIcon className="w-8 h-8 mb-4" />
                                   <p className="text-sm font-bold italic">Summary will appear here.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <footer className="mt-8 flex justify-center">
                <button 
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText}
                    className="apple-pill w-full sm:w-auto px-12 py-4 bg-[var(--primary)] text-white shadow-2xl shadow-[var(--primary)]/20 hover:scale-[1.02] disabled:opacity-30 text-[15px] font-bold"
                >
                    {isLoading ? 'Processing...' : 'Generate Core Insights'}
                </button>
            </footer>
        </Card>
    );
};

export default SummarizerModule;
