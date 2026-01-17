
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
            alert("Sorry, I couldn't read that file. Please try a different one.");
            setFileName('');
        } finally {
            setIsParsing(false);
        }
        event.target.value = '';
      }
    };

    const handleSummarize = async () => {
        if (!inputText.trim()) {
            alert("You need to give me something to summarize.");
            return;
        }
        setIsLoading(true);
        setSummary('');
        try {
            const result = await summarizeText(inputText);
            setSummary(result);
            
            // Save to Supabase
            if (supabase && userProfile?.id) {
                await supabase.from('summaries').insert([{
                    user_id: userProfile.id,
                    topic: fileName || inputText.substring(0, 50),
                    content: result
                }]);
            }
        } catch (error) {
            console.error("Error summarizing text:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isProcessing = isLoading || isParsing;

    return (
        <Card className="h-full flex flex-col p-4 sm:p-6 overflow-hidden">
            <div className="flex-shrink-0">
                <div className="flex items-center mb-2">
                    <SparklesIcon className="w-8 h-8 text-[var(--accent)] mr-3" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">AI Summarizer</h2>
                </div>
                <p className="text-[var(--foreground-muted)] mb-4 text-sm">Paste notes or upload a doc. The AI will save the summary to your profile.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                        <h3 className="font-semibold text-sm text-[var(--foreground)]/90">Your Text</h3>
                        <label htmlFor="file-upload-summarizer" className="cursor-pointer flex items-center gap-2 text-xs text-[var(--accent)] hover:opacity-80 transition">
                            <UploadIcon className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{fileName || 'Upload File'}</span>
                        </label>
                        <input id="file-upload-summarizer" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isProcessing} />
                    </div>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isParsing ? "Reading your document..." : "Paste your text here."}
                        className="w-full flex-grow p-4 bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none text-sm"
                        disabled={isProcessing}
                    />
                </div>
                <div className="flex flex-col min-h-0">
                    <h3 className="font-semibold mb-2 text-sm text-[var(--foreground)]/90 flex-shrink-0">Summary</h3>
                    <div className="w-full flex-grow p-4 bg-[var(--primary)]/5 rounded-lg border border-[var(--input-border)] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
                                <div className="loader !border-[var(--accent)] !border-b-transparent"></div>
                                <p className="ml-3 text-sm">Summarizing...</p>
                            </div>
                        ) : (
                            summary ? <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap leading-relaxed">{summary}</p> : <p className="text-[var(--foreground-muted)] text-sm italic">Generated summary will be auto-saved.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex-shrink-0">
                <button 
                    onClick={handleSummarize}
                    disabled={isProcessing || !inputText}
                    className="w-full md:w-auto px-8 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform enabled:hover:scale-105 shadow-lg flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                >
                    {isLoading ? 'Processing...' : 'Summarize & Save'}
                </button>
            </div>
        </Card>
    );
};

export default SummarizerModule;
