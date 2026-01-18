
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
        <Card className="flex flex-col p-5 lg:p-8 min-h-0 h-full max-h-full">
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 lg:mb-8">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold tracking-tight flex items-center gap-3">
                        Summarizer
                        {isParsing && <div className="loader !w-3 !h-3"></div>}
                    </h2>
                    <p className="text-[var(--foreground-muted)] text-[12px] lg:text-[13px] font-medium">Extract the core essence.</p>
                </div>
                <label className="apple-pill px-4 py-2 bg-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.08] cursor-pointer flex items-center gap-2 text-[11px] font-bold w-full sm:w-auto justify-center">
                    <UploadIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span className="truncate max-w-[120px]">{fileName || 'Upload'}</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx" />
                </label>
            </div>
            
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 flex-grow min-h-0 overflow-hidden">
                <div className="flex flex-col gap-2 min-h-0 h-1/2 lg:h-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-60">Input</span>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text here..."
                        className="w-full h-full p-4 ios-input text-[13px] lg:text-[14px] leading-relaxed resize-none focus:outline-none rounded-2xl"
                    />
                </div>
                <div className="flex flex-col gap-2 min-h-0 h-1/2 lg:h-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-60">Synthesis</span>
                    <div className="w-full h-full p-4 lg:p-6 rounded-2xl bg-[var(--primary)]/[0.03] border border-[var(--primary)]/[0.08] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <div className="loader !w-5 !h-5"></div>
                                <p className="text-[11px] font-semibold opacity-40">Thinking...</p>
                            </div>
                        ) : (
                            summary ? (
                                <p className="text-[13.5px] lg:text-[14.5px] font-medium leading-[1.6] text-[var(--foreground)] animate-fade-in">{summary}</p>
                            ) : (
                                <p className="text-[12px] font-medium text-[var(--foreground-muted)] opacity-40 italic">Results appear here.</p>
                            )
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex-shrink-0 flex justify-center">
                <button 
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText}
                    className="apple-pill px-8 py-3 bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] disabled:opacity-30 text-[14px] w-full sm:w-auto"
                >
                    {isLoading ? 'Processing' : 'Generate Summary'}
                </button>
            </div>
        </Card>
    );
};

export default SummarizerModule;
