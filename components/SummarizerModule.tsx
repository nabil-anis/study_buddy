import React, { useState, ChangeEvent } from 'react';
import Card from './GlassCard';
import { summarizeText, parseFileContent } from '../services/geminiService';
import { SparklesIcon, UploadIcon } from './icons';

const SummarizerModule: React.FC = () => {
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
            alert("You need to give me something to summarize. I'm smart, but not a mind reader.");
            return;
        }
        setIsLoading(true);
        setSummary('');
        try {
            const result = await summarizeText(inputText);
            setSummary(result);
        } catch (error) {
            console.error("Error summarizing text:", error);
            alert("The AI is struggling to condense your text. Maybe it's already perfect? Or try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const isProcessing = isLoading || isParsing;

    return (
        <Card className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex items-center mb-4">
                <SparklesIcon className="w-8 h-8 text-[var(--accent)] mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">AI Summarizer</h2>
            </div>
            <p className="text-[var(--foreground-muted)] mb-6">Paste your notes or upload a document. The AI will whip up a summary faster than you can say "procrastination."</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-[300px]">
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-[var(--foreground)]/90">Your Text</h3>
                        <label htmlFor="file-upload-summarizer" className="cursor-pointer flex items-center gap-2 text-sm text-[var(--accent)] hover:opacity-80 transition">
                            <UploadIcon className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{fileName || 'Upload File'}</span>
                        </label>
                        <input id="file-upload-summarizer" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isProcessing} />
                    </div>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isParsing ? "Reading your document..." : "Paste your long, boring text here, or upload a file."}
                        className="w-full flex-grow p-4 bg-[var(--input-bg)] text-[var(--foreground)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                        disabled={isProcessing}
                    />
                </div>
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-2 text-[var(--foreground)]/90">Summary</h3>
                    <div className="w-full flex-grow p-4 bg-[var(--primary)]/5 rounded-lg border border-[var(--input-border)] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
                                <div className="loader !border-[var(--accent)] !border-b-transparent"></div>
                                <p className="ml-3">Summarizing...</p>
                            </div>
                        ) : (
                            summary ? <p className="text-[var(--foreground)] whitespace-pre-wrap">{summary}</p> : <p className="text-[var(--foreground-muted)]">Your summary will appear here.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center">
                <button 
                    onClick={handleSummarize}
                    disabled={isProcessing || !inputText}
                    className="px-8 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mx-auto"
                >
                    {isLoading ? <><div className="loader !w-6 !h-6 !border-[var(--accent-foreground)] !border-b-transparent"></div><span>Processing...</span></> : 'Summarize'}
                </button>
            </div>
        </Card>
    );
};

export default SummarizerModule;