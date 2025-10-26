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
        <Card className="h-full flex flex-col">
            <div className="flex items-center mb-4">
                <SparklesIcon className="w-8 h-8 text-yellow-400 mr-3" />
                <h2 className="text-2xl font-bold text-zinc-100">AI Summarizer</h2>
            </div>
            <p className="text-zinc-400 mb-6">Paste your notes, or upload a document, and our AI will whip up a summary faster than you can say "procrastination."</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-zinc-300">Your Text</h3>
                        <label htmlFor="file-upload-summarizer" className="cursor-pointer flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition">
                            <UploadIcon className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{fileName || 'Upload File'}</span>
                        </label>
                        <input id="file-upload-summarizer" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isProcessing} />
                    </div>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isParsing ? "Reading your document..." : "Paste your long, boring text here, or upload a file above."}
                        className="w-full flex-grow p-4 bg-zinc-800/50 text-zinc-200 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                        disabled={isProcessing}
                    />
                </div>
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-2 text-zinc-300">Summary</h3>
                    <div className="w-full flex-grow p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-zinc-400">
                                <p>Condensing knowledge...</p>
                            </div>
                        ) : (
                            summary ? <p className="text-zinc-200 whitespace-pre-wrap">{summary}</p> : <p className="text-zinc-500">Your summary will appear here.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center">
                <button 
                    onClick={handleSummarize}
                    disabled={isProcessing || !inputText}
                    className="px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-transform transform hover:scale-105 shadow-lg disabled:bg-yellow-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? 'Thinking Hard...' : isParsing ? 'Reading File...' : 'Summarize'}
                </button>
            </div>
        </Card>
    );
};

export default SummarizerModule;